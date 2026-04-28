import { Router } from "express";
import { getDb } from "../database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// User addresses
router.get("/addresses", requireAuth, (req, res) => {
  const db = getDb();
  res.json({ addresses: db.prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC").all(req.user.id) });
});

router.post("/addresses", requireAuth, (req, res) => {
  const { name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (!name || !phone || !line1 || !city || !state || !pincode) return res.status(400).json({ error: "All address fields required" });
  const db = getDb();
  if (is_default) db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(req.user.id);
  const result = db.prepare(
    "INSERT INTO addresses (user_id, name, phone, line1, line2, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(req.user.id, name, phone, line1, line2 || null, city, state, pincode, country || "India", is_default ? 1 : 0);
  res.status(201).json({ address: db.prepare("SELECT * FROM addresses WHERE id = ?").get(result.lastInsertRowid) });
});

router.put("/addresses/:id", requireAuth, (req, res) => {
  const db = getDb();
  const addr = db.prepare("SELECT * FROM addresses WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!addr) return res.status(404).json({ error: "Address not found" });
  const { name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (is_default) db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(req.user.id);
  db.prepare("UPDATE addresses SET name=?, phone=?, line1=?, line2=?, city=?, state=?, pincode=?, country=?, is_default=? WHERE id=?")
    .run(name||addr.name, phone||addr.phone, line1||addr.line1, line2||addr.line2, city||addr.city, state||addr.state, pincode||addr.pincode, country||addr.country, is_default?1:0, req.params.id);
  res.json({ address: db.prepare("SELECT * FROM addresses WHERE id = ?").get(req.params.id) });
});

router.delete("/addresses/:id", requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ message: "Address deleted" });
});

// Wishlist
router.get("/wishlist", requireAuth, (req, res) => {
  const db = getDb();
  const items = db.prepare(
    `SELECT w.id, w.created_at, p.id as product_id, p.name, p.slug, p.price, p.discount_price, p.stock,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ? ORDER BY w.created_at DESC`
  ).all(req.user.id);
  res.json({ items });
});

router.post("/wishlist/:product_id", requireAuth, (req, res) => {
  const db = getDb();
  try {
    db.prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)").run(req.user.id, req.params.product_id);
    res.json({ message: "Added to wishlist" });
  } catch {
    res.status(409).json({ error: "Already in wishlist" });
  }
});

router.delete("/wishlist/:product_id", requireAuth, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(req.user.id, req.params.product_id);
  res.json({ message: "Removed from wishlist" });
});

// ---------- ADMIN ----------

router.get("/admin/all", requireAdmin, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  let where = "1=1";
  const params = [];
  if (search) { where += " AND (name LIKE ? OR email LIKE ?)"; params.push(search, search); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM users WHERE ${where}`).get(...params).c;
  const users = db.prepare(
    `SELECT u.id, u.name, u.email, u.phone, u.created_at,
     COUNT(DISTINCT o.id) as order_count,
     COALESCE(SUM(o.total), 0) as total_spent
     FROM users u LEFT JOIN orders o ON o.user_id = u.id
     WHERE ${where.replace(/u\./g, "u.")}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get("/admin/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const user = db.prepare("SELECT id, name, email, phone, created_at FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(req.params.id);
  user.addresses = db.prepare("SELECT * FROM addresses WHERE user_id = ?").all(req.params.id);
  res.json({ user });
});

export default router;
