import { Router } from "express";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getDb } from "../database.js";
import { requireAdmin } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: join(__dirname, "../../uploads/categories"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// GET /api/categories - public
router.get("/", (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    `SELECT c.*, COUNT(p.id) as product_count
     FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC`
  ).all();
  res.json({ categories });
});

// GET /api/categories/:slug - public
router.get("/:slug", (req, res) => {
  const db = getDb();
  const category = db.prepare("SELECT * FROM categories WHERE slug = ? AND is_active = 1").get(req.params.slug);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json({ category });
});

// Admin routes
router.get("/admin/all", requireAdmin, (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.sort_order ASC"
  ).all();
  res.json({ categories });
});

router.post("/", requireAdmin, upload.single("image"), (req, res) => {
  const { name, description, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  try {
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO categories (name, slug, description, image, sort_order) VALUES (?, ?, ?, ?, ?)"
    ).run(name.trim(), slug, description || null, req.file ? `/uploads/categories/${req.file.filename}` : null, parseInt(sort_order) || 0);
    const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ category });
  } catch {
    res.status(409).json({ error: "Category name already exists" });
  }
});

router.put("/:id", requireAdmin, upload.single("image"), (req, res) => {
  const db = getDb();
  const cat = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
  if (!cat) return res.status(404).json({ error: "Category not found" });
  const { name, description, is_active, sort_order } = req.body;
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : cat.slug;
  db.prepare("UPDATE categories SET name=?, slug=?, description=?, is_active=?, sort_order=?, image=?, updated_at=strftime('%s','now') WHERE id=?")
    .run(name || cat.name, slug, description !== undefined ? description : cat.description,
      is_active !== undefined ? (is_active === "true" ? 1 : 0) : cat.is_active,
      sort_order !== undefined ? parseInt(sort_order) : cat.sort_order,
      req.file ? `/uploads/categories/${req.file.filename}` : cat.image,
      req.params.id);
  res.json({ category: db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id) });
});

router.delete("/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ message: "Category deleted" });
});

export default router;
