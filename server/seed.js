import "dotenv/config";
import bcrypt from "bcryptjs";
import { getDb } from "./database.js";

async function seed() {
  const db = getDb();
  console.log("🌱 Seeding LATEX Leep database...\n");

  // Default super admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(adminEmail);
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    db.prepare(
      "INSERT INTO admins (name, email, password, role, force_password_change) VALUES (?, ?, ?, 'super_admin', 1)"
    ).run("Super Admin", adminEmail, hashed);
    console.log(`✅ Super Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("ℹ️  Admin already exists, skipping.");
  }

  // Categories
  const categories = [
    { name: "Mattresses", slug: "mattresses", description: "Premium quality latex, foam and gel mattresses", sort_order: 1 },
    { name: "Pillows", slug: "pillows", description: "Ergonomic pillows for perfect neck support", sort_order: 2 },
    { name: "Bed Accessories", slug: "bed-accessories", description: "Mattress protectors, toppers and more", sort_order: 3 },
    { name: "Services", slug: "services", description: "Professional mattress cleaning and maintenance", sort_order: 4 },
  ];

  for (const cat of categories) {
    const exists = db.prepare("SELECT id FROM categories WHERE slug = ?").get(cat.slug);
    if (!exists) {
      db.prepare("INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)").run(cat.name, cat.slug, cat.description, cat.sort_order);
      console.log(`✅ Category: ${cat.name}`);
    }
  }

  // Products
  const matCat = db.prepare("SELECT id FROM categories WHERE slug = 'mattresses'").get();
  const pilCat = db.prepare("SELECT id FROM categories WHERE slug = 'pillows'").get();
  const svcCat = db.prepare("SELECT id FROM categories WHERE slug = 'services'").get();
  const accCat = db.prepare("SELECT id FROM categories WHERE slug = 'bed-accessories'").get();

  const products = [
    {
      name: "Natural Latex Mattress", slug: "natural-latex-mattress", sku: "NLM-001",
      description: "100% natural latex for breathable, hypoallergenic comfort that lasts for years. Our Natural Latex Mattress is crafted from the finest rubber tree sap, offering unparalleled comfort and durability.",
      short_description: "100% natural latex for breathable, hypoallergenic comfort that lasts for years.",
      price: 24999, discount_price: 19999, category_id: matCat?.id, stock: 25,
      is_featured: 1, rating_avg: 4.8, rating_count: 124,
      features: JSON.stringify(["Eco-friendly natural latex", "Anti-microbial & dust-mite resistant", "Superior back support", "10+ year durability", "Breathable open-cell structure"]),
      tags: "latex,natural,eco,hypoallergenic",
    },
    {
      name: "Premium Foam Mattress", slug: "premium-foam-mattress", sku: "PFM-001",
      description: "High-density memory foam that contours to your body for pressure-free sleep. Experience the ultimate in comfort with our advanced memory foam technology.",
      short_description: "High-density memory foam that contours to your body for pressure-free sleep.",
      price: 17999, discount_price: 14499, category_id: matCat?.id, stock: 40,
      is_featured: 1, rating_avg: 4.6, rating_count: 89,
      features: JSON.stringify(["Body-contouring memory foam", "Motion isolation technology", "Medium-firm comfort", "Available in all sizes", "CertiPUR-US certified foam"]),
      tags: "foam,memory,medium-firm",
    },
    {
      name: "Cooling Gel Mattress", slug: "cooling-gel-mattress", sku: "CGM-001",
      description: "Advanced cooling gel technology keeps you cool all night long — perfect for hot climates. Our gel-infused mattress regulates temperature for a sweat-free sleep experience.",
      short_description: "Advanced cooling gel technology keeps you cool all night long.",
      price: 29999, discount_price: 24999, category_id: matCat?.id, stock: 18,
      is_featured: 1, rating_avg: 4.9, rating_count: 67,
      features: JSON.stringify(["Cooling gel-infused layers", "Temperature regulating", "Breathable cover fabric", "Ideal for Indian summers", "5-zone pressure relief"]),
      tags: "gel,cooling,summer,temperature",
    },
    {
      name: "Orthopedic Spring Mattress", slug: "orthopedic-spring-mattress", sku: "OSM-001",
      description: "Bonnel spring system with orthopedic support for back pain relief. Specially designed for those who need firm support and spinal alignment.",
      short_description: "Bonnel spring system with orthopedic support for back pain relief.",
      price: 21999, discount_price: null, category_id: matCat?.id, stock: 15,
      is_featured: 0, rating_avg: 4.5, rating_count: 43,
      features: JSON.stringify(["Bonnel spring system", "Orthopedic firm support", "Spinal alignment technology", "High-density border rod", "Anti-sag design"]),
      tags: "spring,orthopedic,firm,back-pain",
    },
    {
      name: "Memory Foam Contour Pillow", slug: "memory-foam-contour-pillow", sku: "MCP-001",
      description: "Ergonomic neck support that adapts to your sleeping position for a pain-free morning. The cervical contour design ensures perfect spinal alignment.",
      short_description: "Ergonomic neck support that adapts to your sleeping position.",
      price: 1999, discount_price: 1499, category_id: pilCat?.id, stock: 80,
      is_featured: 0, rating_avg: 4.7, rating_count: 201,
      features: JSON.stringify(["Cervical contour design", "Premium memory foam", "Washable bamboo cover", "Relieves neck tension", "Hypoallergenic material"]),
      tags: "pillow,memory,contour,neck",
    },
    {
      name: "Latex Comfort Pillow", slug: "latex-comfort-pillow", sku: "LCP-001",
      description: "Natural latex pillow with ventilation holes for optimal airflow. Naturally anti-microbial and dust-mite resistant for a healthier sleep.",
      short_description: "Natural latex pillow with ventilation holes for optimal airflow.",
      price: 2499, discount_price: null, category_id: pilCat?.id, stock: 60,
      is_featured: 0, rating_avg: 4.4, rating_count: 38,
      features: JSON.stringify(["100% natural latex", "Ventilation holes for airflow", "Naturally anti-microbial", "Dust-mite resistant", "Durable & long-lasting"]),
      tags: "pillow,latex,natural",
    },
    {
      name: "Waterproof Mattress Protector", slug: "waterproof-mattress-protector", sku: "WMP-001",
      description: "Terry cotton top with waterproof TPU backing to protect your mattress from spills and allergens. Fits all mattress sizes perfectly.",
      short_description: "Waterproof protection for your premium mattress.",
      price: 1299, discount_price: 999, category_id: accCat?.id, stock: 100,
      is_featured: 0, rating_avg: 4.3, rating_count: 156,
      features: JSON.stringify(["100% waterproof TPU layer", "Terry cotton top for comfort", "Machine washable", "Fits all mattress depths", "Allergen protection"]),
      tags: "protector,waterproof,accessory",
    },
    {
      name: "Deep Mattress Cleaning", slug: "deep-mattress-cleaning", sku: "SVC-001",
      description: "Professional steam and dry cleaning service to remove stains, dust mites, and allergens. Our certified technicians use industry-grade equipment.",
      short_description: "Professional steam cleaning to remove stains, dust mites and allergens.",
      price: 1499, discount_price: 1199, category_id: svcCat?.id, stock: 999,
      is_featured: 0, rating_avg: 4.9, rating_count: 312,
      features: JSON.stringify(["High-temp steam sterilization", "Stain & odor removal", "Allergen & dust-mite treatment", "Same-day service available", "Certified technicians"]),
      tags: "service,cleaning,steam",
    },
  ];

  for (const prod of products) {
    const exists = db.prepare("SELECT id FROM products WHERE sku = ?").get(prod.sku);
    if (!exists) {
      const { features, ...rest } = prod;
      const result = db.prepare(
        `INSERT INTO products (name, slug, description, short_description, price, discount_price, sku, category_id, stock, is_featured, rating_avg, rating_count, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(rest.name, rest.slug, rest.description, rest.short_description, rest.price, rest.discount_price, rest.sku, rest.category_id, rest.stock, rest.is_featured, rest.rating_avg, rest.rating_count, rest.tags);

      const pid = result.lastInsertRowid;

      // Add features
      const featList = JSON.parse(features);
      featList.forEach((f, i) => db.prepare("INSERT INTO product_features (product_id, feature, sort_order) VALUES (?, ?, ?)").run(pid, f, i));

      // Add placeholder image reference
      const imageMap = {
        "NLM-001": "/assets/natural-latex-mattress.jpg",
        "PFM-001": "/assets/premium-foam-mattress.jpg",
        "CGM-001": "/assets/cooling-gel-mattress.jpg",
        "MCP-001": "/assets/memory-foam-contour-pillow.png",
        "SVC-001": "/assets/deep-mattress-cleaning.png",
      };
      const img = imageMap[prod.sku] || "/assets/hero-bedroom.jpg";
      db.prepare("INSERT INTO product_images (product_id, url, sort_order, is_primary, alt) VALUES (?, ?, 0, 1, ?)").run(pid, img, prod.name);

      console.log(`✅ Product: ${prod.name}`);
    }
  }

  // Default coupon
  const coupon = db.prepare("SELECT id FROM coupons WHERE code = 'WELCOME10'").get();
  if (!coupon) {
    db.prepare(
      "INSERT INTO coupons (code, type, value, min_order_amount, usage_limit) VALUES ('WELCOME10', 'percentage', 10, 1000, 1000)"
    ).run();
    console.log("✅ Coupon: WELCOME10 (10% off, min ₹1000)");
  }

  // Default settings
  const settingsData = {
    store_name: "LATEX Leep",
    store_phone: "+91 83745 30026",
    store_address: "Tirupathi, Andhra Pradesh, India",
    whatsapp_number: "918374530026",
    free_shipping_threshold: "5000",
    default_shipping_charge: "99",
    tax_rate: "18",
    store_currency_symbol: "₹",
  };
  for (const [key, value] of Object.entries(settingsData)) {
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  }

  console.log("\n🎉 Seeding complete!\n");
  process.exit(0);
}

seed().catch(console.error);
