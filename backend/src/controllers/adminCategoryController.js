const pool = require("../config/db");

async function getAdminCategories(req, res, next) {
  try {
    const [categories] = await pool.query(
      "SELECT id, name, slug, description, status FROM categories ORDER BY name",
    );
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

async function createAdminCategory(req, res, next) {
  try {
    const { name, slug, description, status } = req.body;
    if (!name || !slug) {
      res.status(400);
      return next(new Error("Name and slug are required"));
    }

    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE slug = ? OR name = ?",
      [slug, name],
    );
    if (existing.length) {
      res.status(409);
      return next(
        new Error("Category already exists with the same name or slug"),
      );
    }

    const [result] = await pool.query(
      "INSERT INTO categories (name, slug, description, status) VALUES (?, ?, ?, ?)",
      [name, slug, description || null, status || "active"],
    );

    res
      .status(201)
      .json({
        message: "Category created successfully",
        categoryId: result.insertId,
      });
  } catch (error) {
    next(error);
  }
}

async function updateAdminCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, description, status } = req.body;
    if (!name || !slug) {
      res.status(400);
      return next(new Error("Name and slug are required"));
    }

    const [existing] = await pool.query(
      "SELECT id FROM categories WHERE (slug = ? OR name = ?) AND id != ?",
      [slug, name, id],
    );
    if (existing.length) {
      res.status(409);
      return next(
        new Error("Another category already exists with the same name or slug"),
      );
    }

    await pool.query(
      "UPDATE categories SET name = ?, slug = ?, description = ?, status = ? WHERE id = ?",
      [name, slug, description || null, status || "active", id],
    );

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function deleteAdminCategory(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
};
