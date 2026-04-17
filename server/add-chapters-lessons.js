require('dotenv').config();

const mysql = require('mysql2/promise');

async function addChaptersAndLessons() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'smart_coding_platform'
  });

  try {
    // Check if chapters already exist for course 2
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM chapters WHERE course_id = 2');
    if (existing[0].count > 0) {
      console.log('Chapters already exist, skipping...');
      return;
    }

    // Insert chapters for all 6 courses
    const chapters = [
      // Course 1: HTML5 CSS3 Basic
      [1, 'HTML 基础', '学习 HTML 的基本结构和常用标签', 1],
      [1, 'CSS 基础', '学习 CSS 选择器和样式设置', 2],
      [1, 'HTML5 新特性', '了解 HTML5 新增的语义化标签', 3],
      // Course 2: JavaScript Basic
      [2, 'JavaScript 基础', '变量、数据类型和基本语法', 1],
      [2, '函数与作用域', '函数定义、作用域和闭包', 2],
      [2, 'DOM 操作', '使用 JavaScript 操作页面元素', 3],
      [2, '异步编程', 'Promise、async/await 和事件循环', 4],
      // Course 3: Vue.js Framework
      [3, 'Vue 基础', 'Vue 核心概念和基本用法', 1],
      [3, '组件化开发', '组件通信和复用', 2],
      [3, 'Vue Router', '路由管理和页面跳转', 3],
      // Course 4: Node.js Backend
      [4, 'Node.js 入门', '安装 Node.js 和基本概念', 1],
      [4, 'Express 框架', '使用 Express 构建 Web 应用', 2],
      [4, '数据库集成', '连接 MongoDB 和 MySQL', 3],
      // Course 5: MySQL Database
      [5, '数据库基础', '数据库概念和 SQL 语言基础', 1],
      [5, 'SQL 查询', 'SELECT、JOIN 和子查询', 2],
      [5, '数据库设计', '范式理论和索引优化', 3],
      // Course 6: Python ML
      [6, 'Python 基础', 'Python 语言基础和数据类型', 1],
      [6, 'NumPy 与 Pandas', '科学计算和数据处理', 2],
      [6, '机器学习基础', '常用机器学习算法', 3],
    ];

    for (const chapter of chapters) {
      await connection.execute(
        'INSERT INTO chapters (course_id, title, description, `order`) VALUES (?, ?, ?, ?)',
        chapter
      );
    }
    console.log('Chapters inserted successfully');

    // Insert lessons for all chapters
    const lessons = [
      // Course 1 chapters (IDs 1-3)
      [1, 'HTML 文档结构', '<h2>HTML 文档的基本结构</h2><p>每个 HTML 文档都包含 <!DOCTYPE html>、<html>、<head> 和 <body> 标签</p>', null, 600, 1, true],
      [1, '常用 HTML 标签', '<h2>常用 HTML 标签</h2><p>学习标题、段落、链接、图片等常用标签的使用</p>', null, 900, 2, false],
      [1, 'HTML 表单', '<h2>HTML 表单元素</h2><p>学习如何使用表单收集用户输入</p>', null, 1200, 3, false],
      [2, 'CSS 选择器', '<h2>CSS 选择器</h2><p>学习类选择器、ID 选择器和伪类选择器</p>', null, 900, 1, false],
      [2, 'CSS 盒模型', '<h2>CSS 盒模型</h2><p>理解 margin、border、padding 和 content</p>', null, 600, 2, false],
      [3, '语义化标签', '<h2>HTML5 语义化标签</h2><p>学习 header、nav、section、article 等语义化标签</p>', null, 900, 1, false],
      // Course 2 chapters (IDs 4-7)
      [4, '变量与数据类型', '<h2>变量与数据类型</h2><p>学习 var、let、const 的区别，以及 JavaScript 的数据类型</p>', 'https://www.w3schools.com/html/mov_bbb.mp4', 600, 1, true],
      [4, '运算符与表达式', '<h2>运算符与表达式</h2><p>算术运算符、比较运算符、逻辑运算符</p>', null, 900, 2, false],
      [4, '流程控制', '<h2>流程控制</h2><p>if-else、switch、for、while 循环</p>', null, 1200, 3, false],
      [5, '函数定义', '<h2>函数定义</h2><p>函数声明、函数表达式、箭头函数</p>', null, 900, 1, false],
      [5, '作用域与闭包', '<h2>作用域与闭包</h2><p>词法作用域、变量提升、闭包原理</p>', null, 1200, 2, false],
      [6, 'DOM 选择器', '<h2>DOM 选择器</h2><p>getElementById、querySelector、querySelectorAll</p>', null, 600, 1, false],
      [6, 'DOM 操作与事件', '<h2>DOM 操作与事件</h2><p>创建、修改、删除元素，事件监听</p>', null, 900, 2, false],
      [7, 'Promise 基础', '<h2>Promise 基础</h2><p>理解 Promise 的概念和用法</p>', null, 900, 1, false],
      [7, 'async/await', '<h2>async/await</h2><p>使用 async/await 简化异步代码</p>', null, 600, 2, false],
      // Course 3 chapters (IDs 8-10)
      [8, 'Vue 实例与模板语法', '<h2>Vue 实例</h2><p>创建 Vue 实例，学习模板语法和指令</p>', null, 900, 1, true],
      [8, '计算属性与侦听器', '<h2>计算属性与侦听器</h2><p>computed 和 watch 的使用</p>', null, 600, 2, false],
      [9, '组件基础', '<h2>组件基础</h2><p>组件的定义、props 和 events</p>', null, 900, 1, false],
      [9, '组件通信', '<h2>组件通信</h2><p>父子组件通信、事件总线、Vuex 状态管理</p>', null, 1200, 2, false],
      [10, '路由基础', '<h2>Vue Router 基础</h2><p>路由配置和页面导航</p>', null, 600, 1, false],
      // Course 4 chapters (IDs 11-13)
      [11, 'Node.js 简介', '<h2>Node.js 简介</h2><p>安装 Node.js，学习 CommonJS 模块系统</p>', null, 600, 1, true],
      [11, 'fs 和 path 模块', '<h2>文件操作</h2><p>使用 fs 和 path 模块进行文件读写</p>', null, 900, 2, false],
      [12, 'Express 入门', '<h2>Express 入门</h2><p>创建 Express 应用，路由和中间件</p>', null, 900, 1, false],
      [12, 'RESTful API 设计', '<h2>RESTful API</h2><p>设计 RESTful API 接口规范</p>', null, 1200, 2, false],
      [13, 'MongoDB 基础', '<h2>MongoDB 基础</h2><p>使用 Mongoose 操作 MongoDB</p>', null, 900, 1, false],
      // Course 5 chapters (IDs 14-16)
      [14, '数据库概述', '<h2>数据库概述</h2><p>关系型数据库和 SQL 基础</p>', null, 600, 1, true],
      [14, '安装 MySQL', '<h2>安装 MySQL</h2><p>MySQL 安装和基本配置</p>', null, 900, 2, false],
      [15, 'SELECT 查询', '<h2>SELECT 查询</h2><p>基本查询、条件过滤、排序和分组</p>', null, 900, 1, false],
      [15, 'JOIN 连接查询', '<h2>JOIN 连接查询</h2><p>INNER JOIN、LEFT JOIN、RIGHT JOIN</p>', null, 1200, 2, false],
      [16, '数据库范式', '<h2>数据库范式</h2><p>第一范式到第三范式</p>', null, 900, 1, false],
      // Course 6 chapters (IDs 17-19)
      [17, 'Python 环境搭建', '<h2>Python 环境搭建</h2><p>安装 Python 和 Jupyter Notebook</p>', null, 600, 1, true],
      [17, 'Python 基础语法', '<h2>Python 基础语法</h2><p>变量、列表、字典、条件判断和循环</p>', null, 900, 2, false],
      [18, 'NumPy 数组', '<h2>NumPy 数组</h2><p>数组创建、索引、切片和运算</p>', null, 900, 1, false],
      [18, 'Pandas 数据帧', '<h2>Pandas 数据帧</h2><p>DataFrame 操作和数据清洗</p>', null, 1200, 2, false],
      [19, '线性回归', '<h2>线性回归</h2><p>使用 scikit-learn 实现线性回归</p>', null, 900, 1, false],
    ];

    for (const lesson of lessons) {
      await connection.execute(
        'INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)',
        lesson
      );
    }
    console.log('Lessons inserted successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

addChaptersAndLessons();
