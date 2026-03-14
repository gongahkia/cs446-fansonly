import Database from "better-sqlite3";
import { getEnv } from "./env.js";

let db;

export function getDb() {
  if (!db) {
    const env = getEnv();
    db = new Database(env.dbPath);
    db.pragma("journal_mode = WAL");
  }

  return db;
}

export function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'analyst', 'admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return database;
}

export function upsertMeta(key, value) {
  const database = getDb();
  database
    .prepare(`
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, value);
}

export function getMeta(key) {
  const database = getDb();
  const row = database.prepare("SELECT value FROM app_meta WHERE key = ?").get(key);
  return row?.value ?? null;
}

export function createUser({ email, password, role }) {
  const database = getDb();
  const result = database
    .prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)")
    .run(email, password, role);

  return getUserById(result.lastInsertRowid);
}

export function getUserByEmail(email) {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function getUserById(id) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export function listUsers() {
  return getDb().prepare("SELECT * FROM users ORDER BY id ASC").all();
}

export function updateUserRole(id, role) {
  getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  return getUserById(id);
}

export function resetUsers(seedUsers) {
  const database = getDb();
  const insert = database.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
  const transaction = database.transaction(() => {
    database.prepare("DELETE FROM users").run();
    database.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
    for (const user of seedUsers) {
      insert.run(user.email, user.password, user.role);
    }
  });
  transaction();
}
