const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_coding_platform'
    });

    const [rows] = await pool.execute(
      `SELECT id, title, LEFT(description, 50) as desc_preview FROM problems`
    );
    console.log('Problems:');
    console.log(JSON.stringify(rows, null, 2));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
