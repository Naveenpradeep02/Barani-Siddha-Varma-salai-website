const pool = require("../config/db");

async function getCategories(req, res, next) {
  try {
    const [categories] = await pool.query(
      "SELECT id, name, slug, description FROM categories WHERE status = ? ORDER BY name",
      ["active"],
    );
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCategories };
