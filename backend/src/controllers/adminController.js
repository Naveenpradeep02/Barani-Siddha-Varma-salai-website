const pool = require("../config/db");

async function getDashboard(req, res, next) {
  try {
    const [orders] = await pool.query(
      "SELECT COUNT(*) as totalOrders, SUM(total_amount) as totalRevenue FROM orders",
    );
    const [todayOrders] = await pool.query(
      "SELECT COUNT(*) as todaysOrders FROM orders WHERE DATE(created_at) = CURDATE()",
    );
    const [pendingOrders] = await pool.query(
      "SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'pending'",
    );
    const [deliveredOrders] = await pool.query(
      "SELECT COUNT(*) as deliveredOrders FROM orders WHERE status = 'delivered'",
    );
    const [cancelledOrders] = await pool.query(
      "SELECT COUNT(*) as cancelledOrders FROM orders WHERE status = 'cancelled'",
    );
    const [customers] = await pool.query(
      "SELECT COUNT(*) as totalCustomers FROM customers",
    );
    const [products] = await pool.query(
      "SELECT COUNT(*) as totalProducts FROM products",
    );
    const [lowStock] = await pool.query(
      "SELECT COUNT(*) as lowStock FROM inventory WHERE quantity <= reorder_level",
    );

    res.json({
      dashboard: {
        totalOrders: orders[0].totalOrders || 0,
        totalRevenue: Number(orders[0].totalRevenue || 0),
        todaysOrders: todayOrders[0].todaysOrders || 0,
        pendingOrders: pendingOrders[0].pendingOrders || 0,
        deliveredOrders: deliveredOrders[0].deliveredOrders || 0,
        cancelledOrders: cancelledOrders[0].cancelledOrders || 0,
        totalCustomers: customers[0].totalCustomers || 0,
        totalProducts: products[0].totalProducts || 0,
        lowStockProducts: lowStock[0].lowStock || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
