import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import couponRoutes from "./routes/coupons.js";
import customerRoutes from "./routes/customers.js";
import reviewRoutes from "./routes/reviews.js";
import inventoryRoutes from "./routes/inventory.js";
import teamRoutes from "./routes/team.js";
import paymentRoutes from "./routes/payments.js";
import settingsRoutes from "./routes/settings.js";
import { ensureRuntimeDirectories, frontendOrigins, uploadsDir } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

ensureRuntimeDirectories();

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: frontendOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });
app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/admin/login", authLimiter);

// Stripe webhook needs raw body
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/", (req, res) => res.json({ status: "ok", service: "latexleep-api" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🛏️  LATEX Leep Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Admin: ${process.env.ADMIN_EMAIL}\n`);
});
