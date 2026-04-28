import { Router } from "express";
import { getDb } from "../database.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// POST /api/coupons/validate - public
router.post("/validate", (req, res) => {
  const { code, order_amount } = req.body;
  if (!code) return res.status(400).json({ error: "Coupon code required" });
  const db = getDb();
  const coupon = db.prepare(
    "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > strftime('%s','now')) AND (usage_limit IS NULL OR used_count < usage_limit)"
  ).get(code.toUpperCase());

  if (!coupon) return res.status(404).json({ error: "Invalid or expired coupon" });
  if (order_amount && order_amount < coupon.min_order_amount) {
    return res.status(400).json({ error: `Minimum order amount is ₹${coupon.min_order_amount}` });
  }

  const discount = coupon.type === "percentage"
    ? Math.min((order_amount || 0) * (coupon.value / 100), coupon.max_discount || Infinity)
    : Math.min(coupon.value, order_amount || coupon.value);

  res.json({ coupon: { id: coupon.id, code: coupon.code, type: coupon.type, value: coupon.value, discount } });
});

// Admin routes
router.get("/", requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ coupons: db.prepare("SELECT * FROM coupons ORDER BY created_at DESC").all() });
});

router.post("/", requireAdmin, (req, res) => {
  const { code, type, value, min_order_amount, max_discount, usage_limit, expires_at } = req.body;
  if (!code || !type || !value) return res.status(400).json({ error: "Code, type and value are required" });
  try {
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(code.toUpperCase(), type, parseFloat(value), parseFloat(min_order_amount) || 0, max_discount ? parseFloat(max_discount) : null, usage_limit ? parseInt(usage_limit) : null, expires_at ? Math.floor(new Date(expires_at).getTime() / 1000) : null);
    res.status(201).json({ coupon: db.prepare("SELECT * FROM coupons WHERE id = ?").get(result.lastInsertRowid) });
  } catch {
    res.status(409).json({ error: "Coupon code already exists" });
  }
});

router.put("/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const coupon = db.prepare("SELECT * FROM coupons WHERE id = ?").get(req.params.id);
  if (!coupon) return res.status(404).json({ error: "Coupon not found" });
  const { code, type, value, min_order_amount, max_discount, usage_limit, expires_at, is_active } = req.body;
  db.prepare(
    "UPDATE coupons SET code=?, type=?, value=?, min_order_amount=?, max_discount=?, usage_limit=?, expires_at=?, is_active=?, updated_at=strftime('%s','now') WHERE id=?"
  ).run(
    code ? code.toUpperCase() : coupon.code, type || coupon.type, value ? parseFloat(value) : coupon.value,
    min_order_amount !== undefined ? parseFloat(min_order_amount) : coupon.min_order_amount,
    max_discount !== undefined ? (max_discount ? parseFloat(max_discount) : null) : coupon.max_discount,
    usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : coupon.usage_limit,
    expires_at !== undefined ? (expires_at ? Math.floor(new Date(expires_at).getTime() / 1000) : null) : coupon.expires_at,
    is_active !== undefined ? (is_active ? 1 : 0) : coupon.is_active,
    req.params.id
  );
  res.json({ coupon: db.prepare("SELECT * FROM coupons WHERE id = ?").get(req.params.id) });
});

router.delete("/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM coupons WHERE id = ?").run(req.params.id);
  res.json({ message: "Coupon deleted" });
});

export default router;
