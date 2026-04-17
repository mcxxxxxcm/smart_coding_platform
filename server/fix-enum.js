const mysql = require('mysql2/promise');

(async () => {
  try {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'smart_coding_platform'
    });

    await pool.execute(`ALTER TABLE exam_submissions MODIFY COLUMN status ENUM('pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'partial_correct') DEFAULT 'pending'`);
    console.log('ALTER TABLE success');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
