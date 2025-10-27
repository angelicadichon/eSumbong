import dbPromise from './database.js';

const init = async () => {
  const db = await dbPromise;

  // Drop old users table (⚠️ this will delete existing data)
  await db.exec(`DROP TABLE IF EXISTS users`);

  // Create the new version with the 'role' column
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user'
    )
  `);

  // Insert predefined admin
  await db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    ["admin", "admin123", "admin"]
  );

  console.log("✅ Database initialized and admin created: admin / admin123");
};

init();
