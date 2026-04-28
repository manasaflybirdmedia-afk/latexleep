import { Router } from "express";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDb } from "../database.js";
import { requireAdmin, requireRole } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = multer.diskStorage({
  destination: join(__dirname, "../../uploads/products"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function buildProductQuery(filters = {}) {
  const conditions = ["p.is_active = 1"];
  const params = [];

  if (filters.category) {
    conditions.push("c.slug = ?");
    params.push(filters.category);
  }
  if (filters.brand) {
    conditions.push("b.name = ?");
    params.push(filters.brand);
  }
  if (filters.min_price) {
    conditions.push("COALESCE(p.discount_price, p.price) >= ?");
    params.push(Number(filters.min_price));
  }
  if (filters.max_price) {
    conditions.push("COALESCE(p.discount_price, p.price) <= ?");
    params.push(Number(filters.max_price));
  }
  if (filters.rating) {
    conditions.push("p.rating_avg >= ?");
    params.push(Number(filters.rating));
  }
  if (filters.search) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }
  if (filters.featured) {
    conditions.push("p.is_featured = 1");
  }

  return { where: conditions.join(" AND "), params };
}

// GET /api/products - public listing
router.get("/", (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  const sortMap = {
    newest: "p.created_at DESC",
    price_asc: "COALESCE(p.discount_price, p.price) ASC",
    price_desc: "COALESCE(p.discount_price, p.price) DESC",
    popularity: "p.sold_count DESC",
    rating: "p.rating_avg DESC",
  };
  const orderBy = sortMap[req.query.sort] || "p.created_at DESC";

  const { where, params } = buildProductQuery(req.query);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE ${where}`
  ).get(...params).count;

  const rows = db.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE ${where}
     ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({
    products: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/products/featured
router.get("/featured", (req, res) => {
  const db = getDb();
  const products = db.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_featured = 1 AND p.is_active = 1 ORDER BY p.updated_at DESC LIMIT 8`
  ).all();
  res.json({ products });
});

// GET /api/products/best-sellers
router.get("/best-sellers", (req, res) => {
  const db = getDb();
  const products = db.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = 1 ORDER BY p.sold_count DESC LIMIT 8`
  ).all();
  res.json({ products });
});

// GET /api/products/new-arrivals
router.get("/new-arrivals", (req, res) => {
  const db = getDb();
  const products = db.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = 1 ORDER BY p.created_at DESC LIMIT 8`
  ).all();
  res.json({ products });
});

// GET /api/products/:slug - public product detail
router.get("/:slug", (req, res) => {
  const db = getDb();
  const product = db.prepare(
    `SELECT p.*, c.name as category_name, c.slug as category_slug, b.name as brand_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.slug = ? AND p.is_active = 1`
  ).get(req.params.slug);

  if (!product) return res.status(404).json({ error: "Product not found" });

  product.images = db.prepare(
    "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, is_primary DESC"
  ).all(product.id);

  product.features = db.prepare(
    "SELECT feature FROM product_features WHERE product_id = ? ORDER BY sort_order ASC"
  ).all(product.id).map((r) => r.feature);

  product.reviews = db.prepare(
    `SELECT r.*, u.name as user_name, u.avatar as user_avatar
     FROM reviews r JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC LIMIT 10`
  ).all(product.id);

  const related = db.prepare(
    `SELECT p.id, p.name, p.slug, p.price, p.discount_price,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p
     WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
     ORDER BY p.sold_count DESC LIMIT 4`
  ).all(product.category_id, product.id);

  res.json({ product, related });
});

// ---------- ADMIN PRODUCT ROUTES ----------

// GET /api/products/admin/list - admin all products
router.get("/admin/list", requireAdmin, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let where = "1=1";
  const params = [];
  if (search) {
    where += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    params.push(search, search);
  }
  if (req.query.category) {
    where += " AND p.category_id = ?";
    params.push(req.query.category);
  }
  if (req.query.status !== undefined) {
    where += " AND p.is_active = ?";
    params.push(req.query.status === "active" ? 1 : 0);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM products p WHERE ${where}`).get(...params).count;
  const products = db.prepare(
    `SELECT p.*, c.name as category_name,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// POST /api/products - create product
router.post("/", requireAdmin, upload.array("images", 10), (req, res) => {
  const db = getDb();
  const {
    name, description, short_description, price, discount_price,
    sku, category_id, brand_id, stock, is_featured, is_active,
    features, tags, weight, dimensions, meta_title, meta_description,
    low_stock_threshold
  } = req.body;

  if (!name || !price || !sku) return res.status(400).json({ error: "Name, price and SKU are required" });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  try {
    const existing = db.prepare("SELECT id FROM products WHERE sku = ? OR slug = ?").get(sku, slug);
    if (existing) return res.status(409).json({ error: "SKU or product name already exists" });

    const result = db.prepare(
      `INSERT INTO products (name, slug, description, short_description, price, discount_price, sku,
       category_id, brand_id, stock, is_featured, is_active, features, tags, weight, dimensions,
       meta_title, meta_description, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name.trim(), slug, description || null, short_description || null,
      parseFloat(price), discount_price ? parseFloat(discount_price) : null,
      sku.trim(), category_id || null, brand_id || null,
      parseInt(stock) || 0, is_featured === "true" ? 1 : 0,
      is_active === "false" ? 0 : 1,
      features || null, tags || null,
      weight ? parseFloat(weight) : null, dimensions || null,
      meta_title || null, meta_description || null,
      parseInt(low_stock_threshold) || 5
    );

    const productId = result.lastInsertRowid;

    // Save features list
    if (features) {
      const featureList = Array.isArray(features) ? features : JSON.parse(features);
      featureList.forEach((f, i) => {
        db.prepare("INSERT INTO product_features (product_id, feature, sort_order) VALUES (?, ?, ?)").run(productId, f, i);
      });
    }

    // Save uploaded images
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        db.prepare("INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (?, ?, ?, ?)")
          .run(productId, `/uploads/products/${file.filename}`, i, i === 0 ? 1 : 0);
      });
    }

    // Log initial stock
    if (parseInt(stock) > 0) {
      db.prepare(
        "INSERT INTO inventory_logs (product_id, type, quantity_before, quantity_change, quantity_after, note, admin_id) VALUES (?, 'add', 0, ?, ?, 'Initial stock', ?)"
      ).run(productId, parseInt(stock), parseInt(stock), req.admin.id);
    }

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product", details: err.message });
  }
});

// PUT /api/products/:id - update product
router.put("/:id", requireAdmin, upload.array("images", 10), (req, res) => {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const {
    name, description, short_description, price, discount_price, sku,
    category_id, brand_id, stock, is_featured, is_active,
    features, tags, weight, dimensions, meta_title, meta_description,
    low_stock_threshold, remove_images
  } = req.body;

  try {
    const slug = name
      ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      : product.slug;

    db.prepare(
      `UPDATE products SET name=?, slug=?, description=?, short_description=?, price=?, discount_price=?,
       sku=?, category_id=?, brand_id=?, stock=?, is_featured=?, is_active=?, tags=?, weight=?,
       dimensions=?, meta_title=?, meta_description=?, low_stock_threshold=?, updated_at=strftime('%s','now')
       WHERE id=?`
    ).run(
      name || product.name, slug,
      description !== undefined ? description : product.description,
      short_description !== undefined ? short_description : product.short_description,
      price ? parseFloat(price) : product.price,
      discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : product.discount_price,
      sku || product.sku,
      category_id !== undefined ? category_id || null : product.category_id,
      brand_id !== undefined ? brand_id || null : product.brand_id,
      stock !== undefined ? parseInt(stock) : product.stock,
      is_featured !== undefined ? (is_featured === "true" ? 1 : 0) : product.is_featured,
      is_active !== undefined ? (is_active === "false" ? 0 : 1) : product.is_active,
      tags !== undefined ? tags : product.tags,
      weight !== undefined ? (weight ? parseFloat(weight) : null) : product.weight,
      dimensions !== undefined ? dimensions : product.dimensions,
      meta_title !== undefined ? meta_title : product.meta_title,
      meta_description !== undefined ? meta_description : product.meta_description,
      low_stock_threshold !== undefined ? parseInt(low_stock_threshold) : product.low_stock_threshold,
      req.params.id
    );

    // Update features
    if (features !== undefined) {
      db.prepare("DELETE FROM product_features WHERE product_id = ?").run(req.params.id);
      const featureList = Array.isArray(features) ? features : JSON.parse(features);
      featureList.forEach((f, i) => {
        db.prepare("INSERT INTO product_features (product_id, feature, sort_order) VALUES (?, ?, ?)").run(req.params.id, f, i);
      });
    }

    // Remove selected images
    if (remove_images) {
      const toRemove = Array.isArray(remove_images) ? remove_images : JSON.parse(remove_images);
      toRemove.forEach((imgId) => db.prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?").run(imgId, req.params.id));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const existingCount = db.prepare("SELECT COUNT(*) as c FROM product_images WHERE product_id = ?").get(req.params.id).c;
      req.files.forEach((file, i) => {
        db.prepare("INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (?, ?, ?, ?)")
          .run(req.params.id, `/uploads/products/${file.filename}`, existingCount + i, existingCount === 0 && i === 0 ? 1 : 0);
      });
    }

    const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json({ product: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", requireRole("super_admin", "admin"), (req, res) => {
  const db = getDb();
  const product = db.prepare("SELECT id FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ message: "Product deleted" });
});

// PUT /api/products/:id/toggle-featured
router.put("/:id/toggle-featured", requireAdmin, (req, res) => {
  const db = getDb();
  const product = db.prepare("SELECT id, is_featured FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  db.prepare("UPDATE products SET is_featured = ?, updated_at = strftime('%s','now') WHERE id = ?")
    .run(product.is_featured ? 0 : 1, req.params.id);
  res.json({ is_featured: !product.is_featured });
});

export default router;
