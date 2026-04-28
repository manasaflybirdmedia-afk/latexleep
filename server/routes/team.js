import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../database.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireRole("super_admin", "admin"), (req, res) => {
  const db = getDb();
  const members = db.prepare(
    "SELECT id, name, email, role, is_active, last_login, created_at FROM admins ORDER BY created_at DESC"
  ).all();
  res.json({ members });
});

router.post("/", requireRole("super_admin"), async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!name || !email || !role) return res.status(400).json({ error: "Name, email and role are required" });
  const validRoles = ["admin", "manager", "inventory_staff", "support_staff"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });

  try {
    const db = getDb();
    const tempPassword = password || `LatexLeep@${Math.random().toString(36).slice(2, 8)}`;
    const hashed = await bcrypt.hash(tempPassword, 12);
    const result = db.prepare(
      "INSERT INTO admins (name, email, password, role, created_by, force_password_change) VALUES (?, ?, ?, ?, ?, 1)"
    ).run(name, email.toLowerCase(), hashed, role, req.admin.id);
    const member = db.prepare("SELECT id, name, email, role, is_active, created_at FROM admins WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ member, temp_password: tempPassword });
  } catch {
    res.status(409).json({ error: "Email already registered" });
  }
});

router.put("/:id", requireRole("super_admin", "admin"), (req, res) => {
  const db = getDb();
  const { name, role, is_active } = req.body;
  const member = db.prepare("SELECT * FROM admins WHERE id = ?").get(req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found" });
  if (member.role === "super_admin" && req.admin.role !== "super_admin") return res.status(403).json({ error: "Cannot modify super admin" });

  db.prepare("UPDATE admins SET name=?, role=?, is_active=?, updated_at=strftime('%s','now') WHERE id=?")
    .run(name || member.name, role || member.role, is_active !== undefined ? (is_active ? 1 : 0) : member.is_active, req.params.id);
  res.json({ member: db.prepare("SELECT id, name, email, role, is_active FROM admins WHERE id = ?").get(req.params.id) });
});

router.delete("/:id", requireRole("super_admin"), (req, res) => {
  const db = getDb();
  if (parseInt(req.params.id) === req.admin.id) return res.status(400).json({ error: "Cannot delete yourself" });
  db.prepare("DELETE FROM admins WHERE id = ?").run(req.params.id);
  res.json({ message: "Member removed" });
});

export default router;
