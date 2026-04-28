import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../database.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

function signUserToken(user) {
  return jwt.sign({ id: user.id, type: "user" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

function signAdminToken(admin) {
  return jwt.sign({ id: admin.id, type: "admin" }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

// ---------- CUSTOMER AUTH ----------

router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)"
    ).run(name.trim(), email.toLowerCase(), hashed, phone || null);

    const user = db.prepare("SELECT id, name, email, phone FROM users WHERE id = ?").get(result.lastInsertRowid);
    const token = signUserToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const { password: _, ...safeUser } = user;
    const token = signUserToken(user);
    res.json({ user: safeUser, token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.put("/profile", requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const db = getDb();
    db.prepare("UPDATE users SET name = ?, phone = ?, updated_at = strftime('%s','now') WHERE id = ?")
      .run(name || req.user.name, phone || req.user.phone, req.user.id);
    const updated = db.prepare("SELECT id, name, email, phone, avatar FROM users WHERE id = ?").get(req.user.id);
    res.json({ user: updated });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

router.put("/change-password", requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: "Both passwords required" });
  if (new_password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const db = getDb();
    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 12);
    db.prepare("UPDATE users SET password = ?, updated_at = strftime('%s','now') WHERE id = ?").run(hashed, req.user.id);
    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ error: "Password change failed" });
  }
});

// ---------- ADMIN AUTH ----------

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const db = getDb();
    const admin = db.prepare("SELECT * FROM admins WHERE email = ? AND is_active = 1").get(email.toLowerCase());
    if (!admin) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    db.prepare("UPDATE admins SET last_login = strftime('%s','now') WHERE id = ?").run(admin.id);

    const { password: _, ...safeAdmin } = admin;
    const token = signAdminToken(admin);
    res.json({ admin: safeAdmin, token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/admin/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

router.put("/admin/change-password", requireAdmin, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: "Both passwords required" });
  if (new_password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  try {
    const db = getDb();
    const admin = db.prepare("SELECT password FROM admins WHERE id = ?").get(req.admin.id);
    const valid = await bcrypt.compare(current_password, admin.password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(new_password, 12);
    db.prepare("UPDATE admins SET password = ?, force_password_change = 0, updated_at = strftime('%s','now') WHERE id = ?")
      .run(hashed, req.admin.id);
    res.json({ message: "Password changed successfully" });
  } catch {
    res.status(500).json({ error: "Password change failed" });
  }
});

export default router;
