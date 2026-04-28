import { Router } from "express";
import { getDb } from "../database.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const defaultSettings = {
  store_name: "LATEX Leep",
  store_tagline: "Premium Mattress Manufacturers — Tirupathi",
  store_email: "info@latexleep.com",
  store_phone: "+91 83745 30026",
  store_address: "Tirupathi, Andhra Pradesh, India",
  store_currency: "INR",
  store_currency_symbol: "₹",
  free_shipping_threshold: "5000",
  default_shipping_charge: "99",
  tax_rate: "18",
  gst_number: "",
  whatsapp_number: "918374530026",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  youtube_url: "",
  maintenance_mode: "false",
  allow_guest_checkout: "true",
  order_prefix: "LL-",
  low_stock_alert_threshold: "5",
};

router.get("/", requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const settings = { ...defaultSettings };
  rows.forEach((r) => { settings[r.key] = r.value; });
  res.json({ settings });
});

router.put("/", requireAdmin, (req, res) => {
  const db = getDb();
  const upsert = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%s','now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at");
  const transaction = db.transaction((data) => {
    Object.entries(data).forEach(([key, value]) => upsert.run(key, String(value)));
  });
  transaction(req.body);
  res.json({ message: "Settings saved", settings: req.body });
});

router.get("/public", (req, res) => {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('store_name','store_tagline','store_phone','store_address','store_currency_symbol','free_shipping_threshold','default_shipping_charge','tax_rate','whatsapp_number')").all();
  const settings = {};
  rows.forEach((r) => { settings[r.key] = r.value; });
  res.json({ settings: { ...defaultSettings, ...settings } });
});

// Newsletter
router.post("/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const db = getDb();
  try {
    db.prepare("INSERT INTO newsletters (email) VALUES (?)").run(email.toLowerCase());
    res.json({ message: "Subscribed successfully!" });
  } catch {
    res.status(409).json({ error: "Already subscribed" });
  }
});

router.get("/newsletters", requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ subscribers: db.prepare("SELECT * FROM newsletters WHERE is_active = 1 ORDER BY created_at DESC").all() });
});

export default router;
