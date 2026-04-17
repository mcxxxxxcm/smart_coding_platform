require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'smart_coding_platform'
  });

  try {
    const correctHash = '$2a$10$sQo2YA3SUfmCq36uGSqOcOJekbdjM/q43wW59OS4AAaYRTUmVk4z2';
    
    const users = [
      { email: 'admin@smartcoding.com', username: 'admin' },
      { email: 'teacher1@smartcoding.com', username: 'teacher1' },
      { email: 'teacher2@smartcoding.com', username: 'teacher2' }
    ];

    for (const user of users) {
      const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);
      if (rows.length > 0) {
        await connection.execute('UPDATE users SET password = ? WHERE email = ?', [correctHash, user.email]);
        console.log(`已更新 ${user.username} 的密码`);
      } else {
        console.log(`用户 ${user.email} 不存在，跳过`);
      }
    }
    console.log('密码更新完成！所有初始账号密码均为: 123456');
  } catch (error) {
    console.error('更新失败:', error);
  } finally {
    await connection.end();
  }
}

updatePasswords();
