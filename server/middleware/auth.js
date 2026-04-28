import jwt from "jsonwebtoken";
import { getDb } from "../database.js";

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = db.prepare("SELECT id, name, email, phone, avatar, email_verified FROM users WHERE id = ?").get(payload.id);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "admin") return res.status(403).json({ error: "Admin access required" });
    const db = getDb();
    const admin = db.prepare("SELECT id, name, email, role, force_password_change FROM admins WHERE id = ? AND is_active = 1").get(payload.id);
    if (!admin) return res.status(401).json({ error: "Admin not found or inactive" });
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    requireAdmin(req, res, () => {
      if (!roles.includes(req.admin.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    });
  };
}

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
