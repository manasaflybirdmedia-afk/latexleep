import { Router } from "express";
import { getDb } from "../database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/:product_id", requireAuth, (req, res) => {
  const { rating, title, body } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be between 1 and 5" });
  const db = getDb();
  try {
    const hasPurchased = db.prepare(
      "SELECT 1 FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'delivered'"
    ).get(req.params.product_id, req.user.id);

    db.prepare(
      "INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.params.product_id, req.user.id, parseInt(rating), title || null, body || null, hasPurchased ? 1 : 0);

    // Recalculate rating
    const stats = db.prepare("SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id = ? AND is_approved = 1").get(req.params.product_id);
    db.prepare("UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?").run(stats.avg || 0, stats.cnt, req.params.product_id);

    res.status(201).json({ message: "Review submitted" });
  } catch {
    res.status(409).json({ error: "You have already reviewed this product" });
  }
});

router.get("/admin/all", requireAdmin, (req, res) => {
  const db = getDb();
  const reviews = db.prepare(
    "SELECT r.*, u.name as user_name, p.name as product_name FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC LIMIT 100"
  ).all();
  res.json({ reviews });
});

router.put("/admin/:id/approve", requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE reviews SET is_approved = 1 WHERE id = ?").run(req.params.id);
  res.json({ message: "Review approved" });
});

router.delete("/admin/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
  res.json({ message: "Review deleted" });
});

export default router;
