import { dbPromise } from "../config/db.js";

export async function findUserByEmail(email) {
  const db = await dbPromise;
  return db.get("SELECT * FROM users WHERE email = ?", [email]);
}

export async function createUser(name, email, password) {
  const db = await dbPromise;
  return db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
    name,
    email,
    password,
  ]);
}
