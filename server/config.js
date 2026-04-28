import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

export const dbPath = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : join(__dirname, "latexleep.db");

export const uploadsDir = process.env.UPLOADS_DIR
  ? resolve(process.env.UPLOADS_DIR)
  : join(rootDir, "uploads");

export const productUploadsDir = join(uploadsDir, "products");
export const categoryUploadsDir = join(uploadsDir, "categories");

export const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

export function ensureRuntimeDirectories() {
  mkdirSync(dirname(dbPath), { recursive: true });
  mkdirSync(productUploadsDir, { recursive: true });
  mkdirSync(categoryUploadsDir, { recursive: true });
}