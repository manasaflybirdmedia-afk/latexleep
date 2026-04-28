-- LATEX Leep E-Commerce Schema

PRAGMA foreign_keys = ON;

-- Users (customers)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  email_verified INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expiry INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Admin / Team
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('super_admin','admin','manager','inventory_staff','support_staff')),
  is_active INTEGER DEFAULT 1,
  force_password_change INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES admins(id),
  last_login INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  logo TEXT,
  is_active INTEGER DEFAULT 1
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price REAL NOT NULL,
  discount_price REAL,
  sku TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_featured INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  weight REAL,
  dimensions TEXT,
  tags TEXT,
  meta_title TEXT,
  meta_description TEXT,
  sold_count INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0
);

-- Product Features
CREATE TABLE IF NOT EXISTS product_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  UNIQUE(user_id, product_id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  UNIQUE(product_id, user_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('percentage','fixed')),
  value REAL NOT NULL,
  min_order_amount REAL DEFAULT 0,
  max_discount REAL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  shipping_charge REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total REAL NOT NULL,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded')),
  payment_method TEXT,
  payment_id TEXT,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  tracking_number TEXT,
  shipped_at INTEGER,
  delivered_at INTEGER,
  cancelled_at INTEGER,
  cancel_reason TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  price REAL NOT NULL,
  discount_price REAL,
  quantity INTEGER NOT NULL,
  subtotal REAL NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  refund_id TEXT,
  refund_amount REAL,
  refunded_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('add','remove','sale','return','adjustment')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  note TEXT,
  admin_id INTEGER REFERENCES admins(id),
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Newsletters
CREATE TABLE IF NOT EXISTS newsletters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_logs(product_id);
