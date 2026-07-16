const pool = require("../config/db");

async function getProducts(req, res, next) {
  try {
    const query = `
      SELECT p.id, p.name, p.slug, p.price, p.discount_price, p.stock, p.status,
             c.name as category_name, b.name as brand_name,
             (
               SELECT pi.url
               FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.is_featured DESC, pi.id ASC
               LIMIT 1
             ) as featured_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    const [rows] = await pool.query(query);
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const products = rows.map((product) => ({
      ...product,
      featured_image: product.featured_image
        ? `${baseUrl}/${product.featured_image}`
        : null,
    }));
    res.json({ products });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ?`,
      [id],
    );

    if (!products.length) {
      res.status(404);
      return next(new Error("Product not found"));
    }

    const [images] = await pool.query(
      "SELECT id, url, is_featured FROM product_images WHERE product_id = ?",
      [id],
    );
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const normalizedImages = images.map((image) => ({
      ...image,
      url: image.url ? `${baseUrl}/${image.url}` : null,
    }));
    const [related] = await pool.query(
      "SELECT id, name, slug, price, discount_price FROM products WHERE category_id = ? AND id != ? LIMIT 6",
      [products[0].category_id, id],
    );

    res.json({ product: products[0], images: normalizedImages, related });
  } catch (error) {
    next(error);
  }
}

module.exports = { getProducts, getProductById };
