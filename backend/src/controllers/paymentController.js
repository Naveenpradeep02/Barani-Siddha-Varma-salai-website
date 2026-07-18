const axios = require("axios");
const pool = require("../config/db");
const {
  BACKEND_URL,
  CASHFREE_API_VERSION,
  CASHFREE_CLIENT_ID,
  CASHFREE_CLIENT_SECRET,
  CASHFREE_ENDPOINT,
  CASHFREE_ENV,
  FRONTEND_URL,
} = require("../config/appConfig");

function getCashfreeEndpoint() {
  const configuredEndpoint = String(CASHFREE_ENDPOINT || "").replace(/\/+$/, "");
  if (configuredEndpoint) {
    return configuredEndpoint;
  }

  return CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function getCashfreeMode() {
  return CASHFREE_ENV === "production" ? "production" : "sandbox";
}

function isValidCashfreeEndpoint(endpoint = getCashfreeEndpoint()) {
  return /^https:\/\/(api|sandbox)\.cashfree\.com\/pg$/.test(endpoint);
}

function assertPaymentConfig() {
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
    const error = new Error(
      "Cashfree credentials are not configured. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.",
    );
    error.statusCode = 500;
    throw error;
  }

  const endpoint = getCashfreeEndpoint();
  if (!isValidCashfreeEndpoint(endpoint)) {
    const error = new Error(
      "CASHFREE_ENDPOINT must be https://api.cashfree.com/pg for production or https://sandbox.cashfree.com/pg for sandbox.",
    );
    error.statusCode = 500;
    error.details = {
      cashfreeEndpoint: endpoint,
      cashfreeMode: getCashfreeMode(),
    };
    throw error;
  }
}

function getCashfreeHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-version": CASHFREE_API_VERSION,
    "x-client-id": CASHFREE_CLIENT_ID,
    "x-client-secret": CASHFREE_CLIENT_SECRET,
  };
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function buildCashfreeOrderId(orderId) {
  return `BSVS_${orderId}_${Date.now().toString(36)}`;
}

function isPaidCashfreeOrder(orderStatus) {
  return String(orderStatus || "").toUpperCase() === "PAID";
}

function handleCashfreeError(error) {
  if (!error.response) {
    return error;
  }

  const gatewayStatus = error.response.status;
  const gatewayResponse = error.response.data;
  const providerMessage =
    gatewayResponse?.message || gatewayResponse?.error || gatewayResponse?.detail;
  const gatewayError = new Error(
    providerMessage ||
      "Cashfree rejected the payment request. Check your Cashfree credentials, mode, and endpoint.",
  );

  gatewayError.statusCode = 502;
  gatewayError.details = {
    gatewayStatus,
    gatewayResponse,
    cashfreeEndpoint: getCashfreeEndpoint(),
    cashfreeMode: getCashfreeMode(),
    cashfreeApiVersion: CASHFREE_API_VERSION,
  };
  console.error("Cashfree request failed:", gatewayError.details);
  return gatewayError;
}

function getPaymentConfig(req, res, next) {
  try {
    const endpoint = getCashfreeEndpoint();
    res.json({
      gateway: "cashfree",
      backendUrl: BACKEND_URL,
      frontendUrl: FRONTEND_URL,
      redirectUrl: `${BACKEND_URL}/api/payments/verify`,
      cashfreeEndpoint: endpoint,
      cashfreeMode: getCashfreeMode(),
      cashfreeApiVersion: CASHFREE_API_VERSION,
      isValidCashfreeEndpoint: isValidCashfreeEndpoint(endpoint),
      hasCashfreeClientId: Boolean(CASHFREE_CLIENT_ID),
      hasCashfreeClientSecret: Boolean(CASHFREE_CLIENT_SECRET),
    });
  } catch (error) {
    next(error);
  }
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

    const cashfreeOrderId = buildCashfreeOrderId(order.id);
    const payload = {
      order_id: cashfreeOrderId,
      order_amount: Number(orderAmount.toFixed(2)),
      order_currency: "INR",
      order_note: purpose,
      customer_details: {
        customer_id: `customer_${order.id}`,
        customer_name: buyerName,
        customer_email: buyerEmail,
        customer_phone: normalizePhone(buyerPhone),
      },
      order_meta: {
        return_url: `${BACKEND_URL}/api/payments/verify?order_id=${cashfreeOrderId}`,
      },
      order_tags: {
        internal_order_id: String(order.id),
        order_number: order.order_number,
      },
    };

    const response = await axios.post(`${getCashfreeEndpoint()}/orders`, payload, {
      headers: getCashfreeHeaders(),
    });

    const cashfreeOrder = response.data;
    if (!cashfreeOrder.order_id || !cashfreeOrder.payment_session_id) {
      const error = new Error("Cashfree response did not include a payment session");
      error.statusCode = 502;
      error.details = { gatewayResponse: cashfreeOrder };
      throw error;
    }

    await pool.query(
      "INSERT INTO payments (order_id, payment_id, payment_method, amount, status, response_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        order.id,
        cashfreeOrder.order_id,
        "cashfree",
        orderAmount,
        "pending",
        JSON.stringify(cashfreeOrder),
      ],
    );

    res.json({
      gateway: "cashfree",
      cashfreeMode: getCashfreeMode(),
      paymentSessionId: cashfreeOrder.payment_session_id,
      paymentRequest: cashfreeOrder,
    });
  } catch (error) {
    next(handleCashfreeError(error));
  }
}

async function verifyPayment(req, res, next) {
  try {
    assertPaymentConfig();
    const cashfreeOrderId = req.query.order_id || req.query.orderId;

    if (!cashfreeOrderId) {
      res.status(400);
      return next(new Error("Missing Cashfree order id"));
    }

    const response = await axios.get(
      `${getCashfreeEndpoint()}/orders/${cashfreeOrderId}`,
      {
        headers: getCashfreeHeaders(),
      },
    );

    const cashfreeOrder = response.data;
    const internalStatus = isPaidCashfreeOrder(cashfreeOrder.order_status)
      ? "paid"
      : "failed";

    const [payments] = await pool.query(
      "SELECT id, order_id FROM payments WHERE payment_id = ?",
      [cashfreeOrderId],
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
      "UPDATE payments SET status = ?, transaction_id = ?, response_json = ? WHERE id = ?",
      [
        internalStatus,
        cashfreeOrder.cf_order_id || cashfreeOrder.order_id,
        JSON.stringify(cashfreeOrder),
        paymentRecord.id,
      ],
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
    resultUrl.searchParams.set("paymentRequestId", cashfreeOrderId);

    res.redirect(resultUrl.toString());
  } catch (error) {
    next(handleCashfreeError(error));
  }
}

module.exports = { createPaymentRequest, getPaymentConfig, verifyPayment };
