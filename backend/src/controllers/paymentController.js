const axios = require("axios");
const pool = require("../config/db");
const {
  BACKEND_URL,
  FRONTEND_URL,
  INSTAMOJO_API_KEY,
  INSTAMOJO_AUTH_TOKEN,
  INSTAMOJO_ENDPOINT,
} = require("../config/appConfig");

function getPaymentUrl(paymentRequest) {
  return (
    paymentRequest?.longurl ||
    paymentRequest?.long_url ||
    paymentRequest?.payment_url ||
    paymentRequest?.url ||
    null
  );
}

function assertPaymentConfig() {
  if (!INSTAMOJO_API_KEY || !INSTAMOJO_AUTH_TOKEN || !INSTAMOJO_ENDPOINT) {
    const error = new Error("Instamojo payment credentials are not configured");
    error.statusCode = 500;
    throw error;
  }

  const isLiveEndpoint = INSTAMOJO_ENDPOINT.includes("www.instamojo.com");
  const isLocalCallback =
    BACKEND_URL.includes("localhost") ||
    BACKEND_URL.includes("127.0.0.1") ||
    BACKEND_URL.includes("::1");

  if (isLiveEndpoint && isLocalCallback) {
    const error = new Error(
      "Instamojo live payments need a public BACKEND_URL for redirects. Use the test Instamojo endpoint for local development, or set BACKEND_URL to your deployed HTTPS backend URL.",
    );
    error.statusCode = 400;
    throw error;
  }
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function toInstamojoPayload(payload) {
  return new URLSearchParams(
    Object.entries(payload).map(([key, value]) => [key, String(value)]),
  );
}

function handleInstamojoError(error) {
  if (!error.response) {
    return error;
  }

  const providerMessage =
    error.response.data?.message ||
    error.response.data?.error ||
    error.response.data?.detail;
  const message =
    error.response.status === 403
      ? "Payment gateway rejected the request. Check that INSTAMOJO_ENDPOINT matches your Instamojo key/token mode, and that the key/token are active."
      : providerMessage || "Payment gateway request failed";

  const gatewayError = new Error(message);
  gatewayError.statusCode = 502;
  return gatewayError;
}

async function createPaymentRequest(req, res, next) {
  try {
    assertPaymentConfig();
    const { orderId, amount, buyerName, buyerEmail, buyerPhone, purpose } =
      req.body;
    if (
      !orderId ||
      !amount ||
      !buyerName ||
      !buyerEmail ||
      !buyerPhone ||
      !purpose
    ) {
      res.status(400);
      return next(new Error("Missing required payment fields"));
    }

    const [orders] = await pool.query(
      "SELECT id, order_number, grand_total, payment_status FROM orders WHERE id = ?",
      [orderId],
    );

    if (!orders.length) {
      res.status(404);
      return next(new Error("Order not found"));
    }

    const order = orders[0];
    if (order.payment_status === "paid") {
      res.status(409);
      return next(new Error("Order is already paid"));
    }

    const orderAmount = Number(order.grand_total);
    if (Math.abs(orderAmount - Number(amount)) > 0.01) {
      res.status(400);
      return next(new Error("Payment amount does not match order total"));
    }

    const payload = {
      purpose,
      amount: orderAmount.toFixed(2),
      phone: normalizePhone(buyerPhone),
      buyer_name: buyerName,
      email: buyerEmail,
      redirect_url: `${BACKEND_URL}/api/payments/verify`,
      send_email: false,
      send_sms: false,
      allow_repeated_payments: false,
    };

    const response = await axios.post(
      `${INSTAMOJO_ENDPOINT}/payment-requests/`,
      toInstamojoPayload(payload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Api-Key": INSTAMOJO_API_KEY,
          "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
        },
      },
    );

    const paymentRequest = response.data.payment_request;
    const paymentUrl = getPaymentUrl(paymentRequest);
    await pool.query(
      "INSERT INTO payments (order_id, payment_id, payment_method, amount, status, response_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        orderId,
        paymentRequest.id,
        "instamojo",
        orderAmount,
        "pending",
        JSON.stringify(paymentRequest),
      ],
    );

    res.json({ paymentRequest, paymentUrl });
  } catch (error) {
    next(handleInstamojoError(error));
  }
}

async function verifyPayment(req, res, next) {
  try {
    assertPaymentConfig();
    const { payment_request_id, payment_id } = req.query;

    if (!payment_request_id || !payment_id) {
      res.status(400);
      return next(new Error("Missing payment verification values"));
    }

    const response = await axios.get(
      `${INSTAMOJO_ENDPOINT}/payment-requests/${payment_request_id}/`,
      {
        headers: {
          "X-Api-Key": INSTAMOJO_API_KEY,
          "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
        },
      },
    );

    const paymentRequest = response.data.payment_request;
    const internalStatus =
      paymentRequest.status === "Completed" ? "paid" : "failed";

    const [payments] = await pool.query(
      "SELECT id, order_id FROM payments WHERE payment_id = ?",
      [payment_request_id],
    );

    if (!payments.length) {
      res.status(404);
      return next(new Error("Payment record not found"));
    }

    const paymentRecord = payments[0];
    const [orders] = await pool.query(
      "SELECT order_number FROM orders WHERE id = ?",
      [paymentRecord.order_id],
    );
    const orderNumber = orders[0]?.order_number;

    await pool.query(
      "UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?",
      [internalStatus, payment_id, paymentRecord.id],
    );
    await pool.query(
      "UPDATE orders SET payment_status = ?, status = CASE WHEN ? = 'paid' THEN 'confirmed' ELSE status END WHERE id = ?",
      [internalStatus, internalStatus, paymentRecord.order_id],
    );

    const resultUrl = new URL("/payment-result", FRONTEND_URL);
    resultUrl.searchParams.set(
      "status",
      internalStatus === "paid" ? "success" : "failed",
    );
    if (orderNumber) {
      resultUrl.searchParams.set("orderNumber", orderNumber);
    }
    resultUrl.searchParams.set("paymentRequestId", payment_request_id);

    res.redirect(resultUrl.toString());
  } catch (error) {
    next(handleInstamojoError(error));
  }
}

module.exports = { createPaymentRequest, verifyPayment };
