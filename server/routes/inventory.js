import { Router } from "express";
import { getDb } from "../database.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdmin, (req, res) => {
  const db = getDb();
  const products = db.prepare(
    `SELECT p.id, p.name, p.sku, p.stock, p.low_stock_threshold, c.name as category_name,
     (p.stock <= p.low_stock_threshold) as is_low_stock
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = 1 ORDER BY is_low_stock DESC, p.name ASC`
  ).all();
  res.json({ products });
});

router.get("/low-stock", requireAdmin, (req, res) => {
  const db = getDb();
  const products = db.prepare(
    "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock <= p.low_stock_threshold AND p.is_active = 1 ORDER BY p.stock ASC"
  ).all();
  res.json({ products });
});

router.post("/:product_id/adjust", requireAdmin, (req, res) => {
  const db = getDb();
  const { type, quantity, note } = req.body;
  const validTypes = ["add", "remove", "adjustment"];
  if (!validTypes.includes(type)) return res.status(400).json({ error: "Invalid adjustment type" });
  if (!quantity || isNaN(quantity)) return res.status(400).json({ error: "Valid quantity required" });

  const product = db.prepare("SELECT id, stock FROM products WHERE id = ?").get(req.params.product_id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const qty = parseInt(quantity);
  let change = type === "remove" ? -qty : qty;
  if (type === "adjustment") change = qty - product.stock;

  const newStock = Math.max(0, product.stock + change);

  db.prepare("UPDATE products SET stock = ?, updated_at = strftime('%s','now') WHERE id = ?").run(newStock, product.id);
  db.prepare(
    "INSERT INTO inventory_logs (product_id, type, quantity_before, quantity_change, quantity_after, note, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(product.id, type, product.stock, change, newStock, note || null, req.admin.id);

  res.json({ product_id: product.id, new_stock: newStock });
});

router.get("/:product_id/logs", requireAdmin, (req, res) => {
  const db = getDb();
  const logs = db.prepare(
    "SELECT il.*, a.name as admin_name FROM inventory_logs il LEFT JOIN admins a ON il.admin_id = a.id WHERE il.product_id = ? ORDER BY il.created_at DESC LIMIT 50"
  ).all(req.params.product_id);
  res.json({ logs });
});

export default router;
