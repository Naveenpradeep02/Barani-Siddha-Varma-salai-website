const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const uploadsRoot = path.join(__dirname, "..", "uploads");
const productUploadsRoot = path.join(uploadsRoot, "products");

function ensureUploadDirectories() {
  fs.mkdirSync(productUploadsRoot, { recursive: true });
}

function getRelativePath(filename) {
  return `uploads/products/${filename}`;
}

function getAbsolutePath(relativePath) {
  return path.join(__dirname, "..", relativePath);
}

function deleteLocalFile(relativePath) {
  if (!relativePath) return;
  const absolutePath = getAbsolutePath(relativePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

async function removeImagesByIds(productId, imageIds) {
  if (!imageIds || !imageIds.length) return;
  const [images] = await pool.query(
    "SELECT id, url FROM product_images WHERE product_id = ? AND id IN (?)",
    [productId, imageIds],
  );
  images.forEach((image) => deleteLocalFile(image.url));
  await pool.query("DELETE FROM product_images WHERE id IN (?)", [imageIds]);
}

async function removeAllImages(productId) {
  const [images] = await pool.query(
    "SELECT id, url FROM product_images WHERE product_id = ?",
    [productId],
  );
  images.forEach((image) => deleteLocalFile(image.url));
  await pool.query("DELETE FROM product_images WHERE product_id = ?", [
    productId,
  ]);
}

async function createProduct(req, res, next) {
  try {
    const {
      name,
      slug,
      categoryId,
      brandId,
      sku,
      shortDescription,
      description,
      price,
      discountPrice,
      gst,
      stock,
      status,
      featured,
    } = req.body;

    const [productResult] = await pool.query(
      `INSERT INTO products (name, slug, category_id, brand_id, sku, short_description, description, price, discount_price, gst, stock, status, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        categoryId || null,
        brandId || null,
        sku,
        shortDescription,
        description,
        price,
        discountPrice || 0,
        gst || 0,
        stock || 0,
        status || "active",
        featured ? 1 : 0,
      ],
    );

    ensureUploadDirectories();
    const productId = productResult.insertId;
    const images = req.files || [];

    const imagePromises = images.map(async (file, index) => {
      const imageUrl = getRelativePath(file.filename);
      return pool.query(
        "INSERT INTO product_images (product_id, url, public_id, is_featured) VALUES (?, ?, ?, ?)",
        [productId, imageUrl, null, index === 0 ? 1 : 0],
      );
    });

    await Promise.all(imagePromises);

    res
      .status(201)
      .json({ message: "Product created successfully", productId });
  } catch (error) {
    next(error);
  }
}

async function getAdminProducts(req, res, next) {
  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.category_id, p.brand_id, p.sku,
              p.short_description, p.description, p.price, p.discount_price,
              p.gst, p.stock, p.status, p.featured,
              c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ORDER BY p.created_at DESC`,
    );

    if (!products.length) {
      return res.json({ products: [] });
    }

    const productIds = products.map((product) => product.id);
    const [images] = await pool.query(
      "SELECT id, product_id, url, is_featured FROM product_images WHERE product_id IN (?) ORDER BY is_featured DESC, id ASC",
      [productIds],
    );
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const imagesByProduct = images.reduce((result, image) => {
      const productImages = result[image.product_id] || [];
      productImages.push({
        ...image,
        url: image.url ? `${baseUrl}/${image.url}` : null,
      });
      result[image.product_id] = productImages;
      return result;
    }, {});

    res.json({
      products: products.map((product) => ({
        ...product,
        images: imagesByProduct[product.id] || [],
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      categoryId,
      brandId,
      sku,
      shortDescription,
      description,
      price,
      discountPrice,
      gst,
      stock,
      status,
      featured,
    } = req.body;

    await pool.query(
      `UPDATE products SET name = ?, slug = ?, category_id = ?, brand_id = ?, sku = ?, short_description = ?, description = ?, price = ?, discount_price = ?, gst = ?, stock = ?, status = ?, featured = ? WHERE id = ?`,
      [
        name,
        slug,
        categoryId || null,
        brandId || null,
        sku,
        shortDescription,
        description,
        price,
        discountPrice || 0,
        gst || 0,
        stock || 0,
        status || "active",
        featured ? 1 : 0,
        id,
      ],
    );

    if (req.body.replaceExisting === "true") {
      await removeAllImages(id);
    }

    const removeImageIds = req.body.removeImageIds
      ? req.body.removeImageIds
          .toString()
          .split(",")
          .map((value) => Number(value.trim()))
          .filter(Boolean)
      : [];

    if (removeImageIds.length) {
      await removeImagesByIds(id, removeImageIds);
    }

    const images = req.files || [];
    if (images.length) {
      ensureUploadDirectories();
      const imagePromises = images.map(async (file) => {
        const imageUrl = getRelativePath(file.filename);
        return pool.query(
          "INSERT INTO product_images (product_id, url, public_id, is_featured) VALUES (?, ?, ?, ?)",
          [id, imageUrl, null, 0],
        );
      });
      await Promise.all(imagePromises);
    }

    res.json({ message: "Product updated successfully" });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    await removeAllImages(id);
    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
};
