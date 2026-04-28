import { Router } from "express";
import Stripe from "stripe";
import { getDb } from "../database.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder")) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// POST /api/payments/create-intent
router.post("/create-intent", requireAuth, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Payment gateway not configured. Please set Stripe keys." });

  const { order_id } = req.body;
  if (!order_id) return res.status(400).json({ error: "Order ID required" });

  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.payment_status === "paid") return res.status(400).json({ error: "Order already paid" });

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "inr",
      metadata: { order_id: order.id.toString(), order_number: order.order_number },
    });

    db.prepare("UPDATE orders SET payment_id = ? WHERE id = ?").run(intent.id, order_id);
    res.json({ client_secret: intent.client_secret, amount: order.total });
  } catch (err) {
    res.status(500).json({ error: "Payment intent creation failed", details: err.message });
  }
});

// POST /api/payments/confirm
router.post("/confirm", requireAuth, async (req, res) => {
  const { order_id, payment_intent_id } = req.body;
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: "Payment gateway not configured" });

  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  try {
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.status === "succeeded") {
      db.prepare("UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = strftime('%s','now') WHERE id = ?").run(order_id);
      db.prepare(
        "INSERT INTO payments (order_id, stripe_payment_intent_id, amount, status, method) VALUES (?, ?, ?, 'succeeded', 'stripe')"
      ).run(order_id, intent.id, order.total);
      return res.json({ success: true, message: "Payment confirmed" });
    }
    res.status(400).json({ error: "Payment not successful", status: intent.status });
  } catch (err) {
    res.status(500).json({ error: "Payment confirmation failed" });
  }
});

// POST /api/payments/cod-confirm (Cash on Delivery)
router.post("/cod-confirm", requireAuth, (req, res) => {
  const { order_id } = req.body;
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(order_id, req.user.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  db.prepare("UPDATE orders SET status = 'confirmed', payment_method = 'cod', updated_at = strftime('%s','now') WHERE id = ?").run(order_id);
  res.json({ success: true, message: "Order confirmed for Cash on Delivery" });
});

// Stripe Webhook
router.post("/webhook", (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.sendStatus(200);

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const db = getDb();
    const order = db.prepare("SELECT * FROM orders WHERE payment_id = ?").get(intent.id);
    if (order) {
      db.prepare("UPDATE orders SET payment_status = 'paid', status = 'confirmed', updated_at = strftime('%s','now') WHERE id = ?").run(order.id);
    }
  }

  res.sendStatus(200);
});

export default router;
