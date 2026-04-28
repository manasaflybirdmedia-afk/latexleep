import { Router } from "express";
import { getDb } from "../database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function generateOrderNumber() {
  return `LL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// POST /api/orders - place order (customer)
router.post("/", requireAuth, (req, res) => {
  const db = getDb();
  const { items, shipping_address, payment_method, coupon_code, notes } = req.body;

  if (!items || !items.length) return res.status(400).json({ error: "No items in order" });
  if (!shipping_address) return res.status(400).json({ error: "Shipping address required" });

  try {
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").get(item.product_id);
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      const price = product.discount_price || product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({ product, quantity: item.quantity, price, subtotal: itemSubtotal });
    }

    // Apply coupon
    let discount = 0;
    let couponId = null;
    if (coupon_code) {
      const coupon = db.prepare(
        "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > strftime('%s','now')) AND (usage_limit IS NULL OR used_count < usage_limit)"
      ).get(coupon_code.toUpperCase());
      if (coupon && subtotal >= coupon.min_order_amount) {
        discount = coupon.type === "percentage"
          ? Math.min(subtotal * (coupon.value / 100), coupon.max_discount || Infinity)
          : Math.min(coupon.value, subtotal);
        couponId = coupon.id;
      }
    }

    const shipping_charge = subtotal > 5000 ? 0 : 99;
    const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const total = Math.max(0, subtotal - discount + shipping_charge + tax);

    const createOrder = db.transaction(() => {
      const orderResult = db.prepare(
        `INSERT INTO orders (order_number, user_id, subtotal, discount, shipping_charge, tax, total,
         coupon_id, coupon_code, payment_method, shipping_address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        generateOrderNumber(), req.user.id, subtotal, discount, shipping_charge, tax, total,
        couponId, coupon_code ? coupon_code.toUpperCase() : null,
        payment_method || "cod", JSON.stringify(shipping_address), notes || null
      );

      const orderId = orderResult.lastInsertRowid;

      for (const item of orderItems) {
        const primaryImg = db.prepare("SELECT url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1").get(item.product.id);
        db.prepare(
          "INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_image, price, discount_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(orderId, item.product.id, item.product.name, item.product.sku, primaryImg?.url || null, item.product.price, item.product.discount_price, item.quantity, item.subtotal);

        db.prepare("UPDATE products SET stock = stock - ?, sold_count = sold_count + ?, updated_at = strftime('%s','now') WHERE id = ?")
          .run(item.quantity, item.quantity, item.product.id);
      }

      if (couponId) {
        db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?").run(couponId);
      }

      return orderId;
    });

    const orderId = createOrder();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    const orderItemsData = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);

    res.status(201).json({ order: { ...order, items: orderItemsData } });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order", details: err.message });
  }
});

// GET /api/orders/my - user order history
router.get("/my", requireAuth, (req, res) => {
  const db = getDb();
  const orders = db.prepare(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC"
  ).all(req.user.id);
  res.json({ orders });
});

// GET /api/orders/my/:id
router.get("/my/:id", requireAuth, (req, res) => {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({ order });
});

// ---------- ADMIN ROUTES ----------

router.get("/admin/all", requireAdmin, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;

  let where = "1=1";
  const params = [];
  if (req.query.status) { where += " AND o.status = ?"; params.push(req.query.status); }
  if (req.query.payment_status) { where += " AND o.payment_status = ?"; params.push(req.query.payment_status); }
  if (req.query.search) {
    where += " AND (o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
    const s = `%${req.query.search}%`;
    params.push(s, s, s);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE ${where}`).get(...params).c;
  const orders = db.prepare(
    `SELECT o.*, u.name as customer_name, u.email as customer_email
     FROM orders o LEFT JOIN users u ON o.user_id = u.id
     WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get("/admin/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const order = db.prepare(
    "SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?"
  ).get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({ order });
});

router.put("/admin/:id/status", requireAdmin, (req, res) => {
  const db = getDb();
  const { status, tracking_number, note } = req.body;
  const validStatuses = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const updates = ["status = ?", "updated_at = strftime('%s','now')"];
  const values = [status];

  if (tracking_number) { updates.push("tracking_number = ?"); values.push(tracking_number); }
  if (status === "shipped") { updates.push("shipped_at = strftime('%s','now')"); }
  if (status === "delivered") { updates.push("delivered_at = strftime('%s','now')"); }
  if (status === "cancelled") {
    updates.push("cancelled_at = strftime('%s','now')");
    if (note) { updates.push("cancel_reason = ?"); values.push(note); }
    // Restore stock
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    items.forEach((item) => {
      if (item.product_id) {
        db.prepare("UPDATE products SET stock = stock + ?, sold_count = MAX(0, sold_count - ?) WHERE id = ?")
          .run(item.quantity, item.quantity, item.product_id);
      }
    });
  }

  values.push(req.params.id);
  db.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  res.json({ order: db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) });
});

// GET /api/orders/admin/stats
router.get("/admin/stats/summary", requireAdmin, (req, res) => {
  const db = getDb();
  const today = Math.floor(Date.now() / 1000) - 86400;
  const week = Math.floor(Date.now() / 1000) - 7 * 86400;
  const month = Math.floor(Date.now() / 1000) - 30 * 86400;

  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM orders WHERE payment_status='paid'").get().v;
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get().c;
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const lowStockProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE stock <= low_stock_threshold AND is_active = 1").get().c;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM orders WHERE payment_status='paid' AND created_at >= ?").get(today).v;
  const weekRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM orders WHERE payment_status='paid' AND created_at >= ?").get(week).v;
  const monthRevenue = db.prepare("SELECT COALESCE(SUM(total),0) as v FROM orders WHERE payment_status='paid' AND created_at >= ?").get(month).v;

  const recentOrders = db.prepare(
    "SELECT o.*, u.name as customer_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5"
  ).all();

  const topProducts = db.prepare(
    `SELECT p.name, p.sold_count, p.price, p.discount_price,
     (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.is_active = 1 ORDER BY p.sold_count DESC LIMIT 5`
  ).all();

  const dailySales = db.prepare(
    `SELECT date(datetime(created_at, 'unixepoch')) as date, COUNT(*) as orders, COALESCE(SUM(total),0) as revenue
     FROM orders WHERE created_at >= ? GROUP BY date ORDER BY date ASC`
  ).all(month);

  res.json({ totalRevenue, totalOrders, pendingOrders, totalCustomers, lowStockProducts, todayRevenue, weekRevenue, monthRevenue, recentOrders, topProducts, dailySales });
});

export default router;
