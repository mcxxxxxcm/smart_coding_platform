const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  let pool;
  try {
    // 创建连接池
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '123456',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 连接到默认数据库
    const connection = await pool.getConnection();
    
    // 删除并创建数据库
    await connection.execute('DROP DATABASE IF EXISTS smart_coding_platform');
    await connection.execute('CREATE DATABASE smart_coding_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    
    // 切换到新创建的数据库
    await connection.changeUser({ database: 'smart_coding_platform' });
    
    // 读取并执行初始化SQL文件
    const initSqlPath = path.join(__dirname, 'database', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    // 分割SQL语句并执行
    const queries = initSql.split(';').filter(query => query.trim());
    for (const query of queries) {
      if (query.trim()) {
        try {
          await connection.execute(query);
        } catch (error) {
          console.error('执行SQL失败:', query.substring(0, 100) + '...');
          throw error;
        }
      }
    }
    
    console.log('数据库初始化成功！');
    
    // 释放连接
    connection.release();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

initDatabase();