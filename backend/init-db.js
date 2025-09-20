import sqlite3 from "sqlite3";
import { open } from "sqlite";

const init = async () => {
  const db = await open({
    filename: "notes.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester TEXT,
      subject TEXT,
      unit TEXT,
      filename TEXT,
      file_url TEXT,
      uploaded_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database initialized!");
  await db.close();
};

init();
