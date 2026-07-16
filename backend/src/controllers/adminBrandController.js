const pool = require("../config/db");

async function getAdminBrands(req, res, next) {
  try {
    const [brands] = await pool.query(
      "SELECT id, name, slug, description, status FROM brands ORDER BY name",
    );
    res.json({ brands });
  } catch (error) {
    next(error);
  }
}

async function createAdminBrand(req, res, next) {
  try {
    const { name, slug, description, status } = req.body;
    if (!name || !slug) {
      res.status(400);
      return next(new Error("Name and slug are required"));
    }

    const [existing] = await pool.query(
      "SELECT id FROM brands WHERE slug = ? OR name = ?",
      [slug, name],
    );
    if (existing.length) {
      res.status(409);
      return next(new Error("Brand already exists with the same name or slug"));
    }

    const [result] = await pool.query(
      "INSERT INTO brands (name, slug, description, status) VALUES (?, ?, ?, ?)",
      [name, slug, description || null, status || "active"],
    );

    res
      .status(201)
      .json({
        message: "Brand created successfully",
        brandId: result.insertId,
      });
  } catch (error) {
    next(error);
  }
}

async function updateAdminBrand(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, status } = req.body;
    if (!name || !slug) {
      res.status(400);
      return next(new Error("Name and slug are required"));
    }

    const [existing] = await pool.query(
      "SELECT id FROM brands WHERE (slug = ? OR name = ?) AND id != ?",
      [slug, name, id],
    );
    if (existing.length) {
      res.status(409);
      return next(
        new Error("Another brand already exists with the same name or slug"),
      );
    }

    await pool.query(
      "UPDATE brands SET name = ?, slug = ?, description = ?, status = ? WHERE id = ?",
      [name, slug, description || null, status || "active", id],
    );

    res.json({ message: "Brand updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminBrand(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM brands WHERE id = ?", [id]);
    res.json({ message: "Brand deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
};
