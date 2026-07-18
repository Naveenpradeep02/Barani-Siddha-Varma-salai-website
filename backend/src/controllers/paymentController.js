const axios = require("axios");
const pool = require("../config/db");
const {
  BACKEND_URL,
  FRONTEND_URL,
  INSTAMOJO_API_KEY,
  INSTAMOJO_API_VERSION,
  INSTAMOJO_AUTH_TOKEN,
  INSTAMOJO_AUTH_ENDPOINT,
  INSTAMOJO_CLIENT_ID,
  INSTAMOJO_CLIENT_SECRET,
  INSTAMOJO_ENDPOINT,
} = require("../config/appConfig");

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function getPaymentUrl(paymentRequest) {
  return (
    paymentRequest?.longurl ||
    paymentRequest?.long_url ||
    paymentRequest?.shorturl ||
    paymentRequest?.short_url ||
    paymentRequest?.payment_url ||
    paymentRequest?.url ||
    null
  );
}

function getPaymentRequestId(paymentRequest) {
  return paymentRequest?.id || paymentRequest?.payment_request_id || null;
}

function getConfiguredApiVersion() {
  const configuredVersion = String(INSTAMOJO_API_VERSION || "").toLowerCase();
  if (configuredVersion === "v1" || configuredVersion === "v1.1") {
    return "v1.1";
  }

  if (configuredVersion === "v2") {
    return "v2";
  }

  return INSTAMOJO_CLIENT_ID && INSTAMOJO_CLIENT_SECRET ? "v2" : "v1.1";
}

function getInstamojoEndpoint() {
  const configuredEndpoint = String(INSTAMOJO_ENDPOINT || "").replace(/\/+$/, "");
  if (configuredEndpoint) {
    return configuredEndpoint;
  }

  return getConfiguredApiVersion() === "v2"
    ? "https://api.instamojo.com/v2"
    : "";
}

function getInstamojoMode(endpoint = getInstamojoEndpoint()) {
  if (endpoint.includes("test.instamojo.com")) {
    return "test";
  }

  if (endpoint.includes("instamojo.com")) {
    return "live";
  }

  return "unknown";
}

function isValidInstamojoEndpoint(endpoint = getInstamojoEndpoint()) {
  if (getConfiguredApiVersion() === "v2") {
    return /^https:\/\/(api|test)\.instamojo\.com\/v2$/.test(endpoint);
  }

  return /^https:\/\/(www|test)\.instamojo\.com\/api\/1\.1$/.test(endpoint);
}

function getInstamojoAuthEndpoint() {
  const configuredEndpoint = String(INSTAMOJO_AUTH_ENDPOINT || "").replace(/\/+$/, "");
  if (configuredEndpoint) {
    return `${configuredEndpoint}/`;
  }

  const apiEndpoint = getInstamojoEndpoint();
  if (apiEndpoint.includes("test.instamojo.com")) {
    return "https://test.instamojo.com/oauth2/token/";
  }

  return "https://api.instamojo.com/oauth2/token/";
}

function assertPaymentConfig() {
  const apiVersion = getConfiguredApiVersion();
  const hasCredentials =
    apiVersion === "v2"
      ? INSTAMOJO_CLIENT_ID && INSTAMOJO_CLIENT_SECRET
      : INSTAMOJO_API_KEY && INSTAMOJO_AUTH_TOKEN;

  if (!hasCredentials || !getInstamojoEndpoint()) {
    const error = new Error(
      apiVersion === "v2"
        ? "Instamojo v2 credentials are not configured. Set INSTAMOJO_CLIENT_ID and INSTAMOJO_CLIENT_SECRET."
        : "Instamojo v1.1 credentials are not configured. Set INSTAMOJO_API_KEY and INSTAMOJO_AUTH_TOKEN.",
    );
    error.statusCode = 500;
    throw error;
  }

  const endpoint = getInstamojoEndpoint();
  if (!isValidInstamojoEndpoint(endpoint)) {
    const error = new Error(
      apiVersion === "v2"
        ? "INSTAMOJO_ENDPOINT must be https://api.instamojo.com/v2 for live v2 credentials or https://test.instamojo.com/v2 for test v2 credentials"
        : "INSTAMOJO_ENDPOINT must be https://www.instamojo.com/api/1.1 for live v1.1 keys or https://test.instamojo.com/api/1.1 for test v1.1 keys",
    );
    error.statusCode = 500;
    error.details = {
      instamojoApiVersion: apiVersion,
      instamojoEndpoint: endpoint,
      instamojoMode: getInstamojoMode(endpoint),
    };
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

async function getInstamojoAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpiresAt > now) {
    return cachedAccessToken;
  }

  const response = await axios.post(
    getInstamojoAuthEndpoint(),
    toInstamojoPayload({
      grant_type: "client_credentials",
      client_id: INSTAMOJO_CLIENT_ID,
      client_secret: INSTAMOJO_CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedAccessToken = response.data.access_token;
  cachedAccessTokenExpiresAt =
    now + Math.max(Number(response.data.expires_in || 36000) - 60, 60) * 1000;
  return cachedAccessToken;
}

async function getInstamojoHeaders() {
  if (getConfiguredApiVersion() === "v2") {
    const accessToken = await getInstamojoAccessToken();
    return {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  return {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Api-Key": INSTAMOJO_API_KEY,
    "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
  };
}

function getCreatePaymentRequestUrl() {
  return getConfiguredApiVersion() === "v2"
    ? `${getInstamojoEndpoint()}/payment_requests/`
    : `${getInstamojoEndpoint()}/payment-requests/`;
}

function getPaymentRequestUrl(paymentRequestId) {
  return getConfiguredApiVersion() === "v2"
    ? `${getInstamojoEndpoint()}/payment_requests/${paymentRequestId}/`
    : `${getInstamojoEndpoint()}/payment-requests/${paymentRequestId}/`;
}

function getPaymentRequestFromResponse(data) {
  return data.payment_request || data;
}

function handleInstamojoError(error) {
  if (!error.response) {
    return error;
  }

  const gatewayStatus = error.response.status;
  const gatewayResponse = error.response.data;
  const providerMessage =
    gatewayResponse?.message || gatewayResponse?.error || gatewayResponse?.detail;
  const message =
    gatewayStatus === 403
      ? "Payment gateway rejected the request. Check that your Instamojo endpoint matches the configured API version and credential mode, and that the credentials are active."
      : providerMessage || "Payment gateway request failed";

  const gatewayError = new Error(message);
  gatewayError.statusCode = 502;
  gatewayError.details = {
    gatewayStatus,
    gatewayResponse,
    instamojoApiVersion: getConfiguredApiVersion(),
    instamojoEndpoint: getInstamojoEndpoint(),
    instamojoMode: getInstamojoMode(),
  };
  console.error("Instamojo request failed:", gatewayError.details);
  return gatewayError;
}

function getPaymentConfig(req, res, next) {
  try {
    const endpoint = getInstamojoEndpoint();
    res.json({
      backendUrl: BACKEND_URL,
      frontendUrl: FRONTEND_URL,
      redirectUrl: `${BACKEND_URL}/api/payments/verify`,
      instamojoApiVersion: getConfiguredApiVersion(),
      instamojoEndpoint: endpoint || null,
      instamojoAuthEndpoint:
        getConfiguredApiVersion() === "v2" ? getInstamojoAuthEndpoint() : null,
      instamojoMode: getInstamojoMode(endpoint),
      isValidInstamojoEndpoint: isValidInstamojoEndpoint(endpoint),
      hasInstamojoApiKey: Boolean(INSTAMOJO_API_KEY),
      hasInstamojoAuthToken: Boolean(INSTAMOJO_AUTH_TOKEN),
      hasInstamojoClientId: Boolean(INSTAMOJO_CLIENT_ID),
      hasInstamojoClientSecret: Boolean(INSTAMOJO_CLIENT_SECRET),
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
      getCreatePaymentRequestUrl(),
      toInstamojoPayload(payload),
      {
        headers: await getInstamojoHeaders(),
      },
    );

    const paymentRequest = getPaymentRequestFromResponse(response.data);
    const paymentUrl = getPaymentUrl(paymentRequest);
    const paymentRequestId = getPaymentRequestId(paymentRequest);
    if (!paymentRequestId || !paymentUrl) {
      const error = new Error("Instamojo response did not include a payment link");
      error.statusCode = 502;
      error.details = { gatewayResponse: response.data };
      throw error;
    }

    await pool.query(
      "INSERT INTO payments (order_id, payment_id, payment_method, amount, status, response_json) VALUES (?, ?, ?, ?, ?, ?)",
      [
        orderId,
        paymentRequestId,
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
      getPaymentRequestUrl(payment_request_id),
      {
        headers: await getInstamojoHeaders(),
      },
    );

    const paymentRequest = getPaymentRequestFromResponse(response.data);
    const internalStatus =
      ["Completed", "Credit", "paid", "success"].includes(paymentRequest.status)
        ? "paid"
        : "failed";

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

module.exports = { createPaymentRequest, getPaymentConfig, verifyPayment };
