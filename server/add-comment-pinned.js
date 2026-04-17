require('dotenv').config();
const mysql = require('mysql2/promise');

async function addCommentPinnedColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'smart_coding_platform'
  });

  try {
    // Check if is_pinned column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'is_pinned'",
      [process.env.DB_NAME || 'smart_coding_platform']
    );

    if (columns.length === 0) {
      await connection.execute(
        "ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE AFTER like_count"
      );
      console.log('Added is_pinned column to comments table');
    } else {
      console.log('is_pinned column already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addCommentPinnedColumn();
