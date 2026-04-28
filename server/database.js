import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { dbPath } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb() {
  if (!db) {
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" ? null : null,
    });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);
}

export default getDb;
