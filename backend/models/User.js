import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

// Function to initialize the database
export async function initializeDatabase() {
  db = await open({
    filename: './database.sqlite', // Use a persistent file
    driver: sqlite3.Database,
  });

  // Create the users table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
  console.log("Database initialized and 'users' table ensured.");
}

// Find a user by email
export async function findUserByEmail(email) {
  return db.get("SELECT * FROM users WHERE email = ?", [email]);
}

// Create a new user
export async function createUser(name, email, hashedPassword) {
  try {
    const result = await db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    return result.lastID;
  } catch (error) {
    if (error.errno === 19) { // SQLite constraint violation (e.g., UNIQUE email)
        throw new Error("Email already exists!");
    }
    throw error;
  }
}