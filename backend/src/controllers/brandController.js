const pool = require("../config/db");

async function getBrands(req, res, next) {
  try {
    const [brands] = await pool.query(
      "SELECT id, name, slug, description FROM brands WHERE status = ? ORDER BY name",
      ["active"],
    );
    res.json({ brands });
  } catch (error) {
    next(error);
  }
}

module.exports = { getBrands };
