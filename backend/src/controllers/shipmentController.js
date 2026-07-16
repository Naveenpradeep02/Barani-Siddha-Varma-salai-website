const axios = require("axios");
const pool = require("../config/db");
const {
  SHIPROCKET_API_URL,
  SHIPROCKET_API_EMAIL,
  SHIPROCKET_API_PASSWORD,
} = require("../config/appConfig");

let shiprocketToken = null;
let tokenExpiry = null;

async function authenticateShiprocket() {
  if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
    return shiprocketToken;
  }

  const response = await axios.post(`${SHIPROCKET_API_URL}/auth/login`, {
    email: SHIPROCKET_API_EMAIL,
    password: SHIPROCKET_API_PASSWORD,
  });

  shiprocketToken = response.data.token;
  tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
  return shiprocketToken;
}

async function createShipment(req, res, next) {
  try {
    const { orderId, shipmentDetails } = req.body;
    const token = await authenticateShiprocket();

    const apiResponse = await axios.post(
      `${SHIPROCKET_API_URL}/shipments`,
      shipmentDetails,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const shipmentData = apiResponse.data.data;
    await pool.query(
      "INSERT INTO shipments (order_id, shipment_id, awb_code, courier_name, shipping_label_url, status, expected_delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        orderId,
        shipmentData.shipment_id,
        shipmentData.airway_bill,
        shipmentData.courier_company,
        shipmentData.label_url,
        shipmentData.status,
        shipmentData.expected_delivery_date,
      ],
    );

    res.json({ shipment: shipmentData });
  } catch (error) {
    next(error);
  }
}

async function getTrackingStatus(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const token = await authenticateShiprocket();

    const response = await axios.get(
      `${SHIPROCKET_API_URL}/shipments/${shipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    res.json({ shipment: response.data.data });
  } catch (error) {
    next(error);
  }
}

module.exports = { createShipment, getTrackingStatus };
