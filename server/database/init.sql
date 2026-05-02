-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS smart_coding_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    points INT DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image VARCHAR(255),
    category VARCHAR(50),
    difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    teacher_id INT NOT NULL,
    duration INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    enrollment_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 章节表
CREATE TABLE IF NOT EXISTS chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课时表
CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    video_url VARCHAR(255),
    duration INT DEFAULT 0,
    `order` INT DEFAULT 0,
    is_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX idx_chapter (chapter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户课程报名表
CREATE TABLE IF NOT EXISTS user_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    lesson_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 题目表
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    category VARCHAR(50),
    tags JSON,
    input_format TEXT,
    output_format TEXT,
    examples JSON,
    constraints TEXT,
    test_cases JSON,
    hints JSON,
    time_limit INT DEFAULT 1000,
    memory_limit INT DEFAULT 256,
    template_code JSON,
    created_by INT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    submission_count INT DEFAULT 0,
    accepted_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 代码提交表
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    status ENUM('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error') DEFAULT 'pending',
    runtime INT,
    memory INT,
    test_results JSON,
    error_message TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    category ENUM('question', 'article', 'discussion') DEFAULT 'discussion',
    tags JSON,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published', 'hidden') DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_author (author_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子点赞表
CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论点赞表
CREATE TABLE IF NOT EXISTS comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (comment_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课时评论表
CREATE TABLE IF NOT EXISTS lesson_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    parent_id INT DEFAULT NULL,
    is_ai_reply BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES lesson_comments(id) ON DELETE CASCADE,
    INDEX idx_lesson (lesson_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课时评论点赞表
CREATE TABLE IF NOT EXISTS lesson_comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES lesson_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (comment_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 考试表
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id INT NOT NULL,
    duration INT DEFAULT 60,
    total_score INT DEFAULT 100,
    passing_score INT DEFAULT 60,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    allow_review BOOLEAN DEFAULT TRUE,
    random_order BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 考试题目表
CREATE TABLE IF NOT EXISTS exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    problem_id INT NOT NULL,
    score INT DEFAULT 10,
    `order` INT DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_exam (exam_id),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 考试尝试表
CREATE TABLE IF NOT EXISTS exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submit_time TIMESTAMP NULL,
    total_score INT DEFAULT 0,
    status ENUM('pending', 'submitted') DEFAULT 'pending',
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt (exam_id, user_id),
    INDEX idx_exam (exam_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 考试提交表
CREATE TABLE IF NOT EXISTS exam_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    score INT DEFAULT 0,
    status ENUM('pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'partial_correct') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (exam_id, user_id, problem_id),
    INDEX idx_exam (exam_id),
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 为已存在的表添加 partial_correct 状态（如果还没有的话）
ALTER TABLE exam_submissions MODIFY COLUMN status ENUM('pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'partial_correct') DEFAULT 'pending';

-- 插入初始用户数据
INSERT INTO users (username, email, password, role, level, experience, points, bio) VALUES
('admin', 'admin@smartcoding.com', '$2a$10$sQo2YA3SUfmCq36uGSqOcOJekbdjM/q43wW59OS4AAaYRTUmVk4z2', 'admin', 10, 10000, 5000, 'System Admin'),
('teacher1', 'teacher1@smartcoding.com', '$2a$10$sQo2YA3SUfmCq36uGSqOcOJekbdjM/q43wW59OS4AAaYRTUmVk4z2', 'teacher', 8, 8000, 3000, 'Frontend Developer'),
('teacher2', 'teacher2@smartcoding.com', '$2a$10$sQo2YA3SUfmCq36uGSqOcOJekbdjM/q43wW59OS4AAaYRTUmVk4z2', 'teacher', 7, 7000, 2500, 'Backend Developer');

-- 插入初始课程数据
INSERT INTO courses (title, description, category, difficulty, teacher_id, duration, price, status, enrollment_count, rating) VALUES
('HTML5 CSS3 Basic', 'Learn web development from scratch', 'frontend', 'beginner', 2, 20, 0, 'published', 2300, 4.8),
('JavaScript Basic', 'Learn JavaScript core syntax', 'frontend', 'beginner', 2, 30, 0, 'published', 1800, 4.7),
('Vue.js Framework', 'Learn Vue.js framework', 'frontend', 'intermediate', 2, 40, 99.00, 'published', 1200, 4.9),
('Node.js Backend', 'Build backend with Node.js', 'backend', 'intermediate', 3, 35, 129.00, 'published', 980, 4.6),
('MySQL Database', 'Learn database basics', 'database', 'beginner', 3, 25, 0, 'published', 1500, 4.5),
('Python ML', 'Machine learning with Python', 'ai', 'advanced', 3, 50, 199.00, 'published', 860, 4.8);

-- 插入初始课程章节数据
-- 课程1: HTML5 CSS3 Basic
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(1, 'HTML 基础', '学习 HTML 的基本结构和常用标签', 1),
(1, 'CSS 基础', '学习 CSS 选择器和样式设置', 2),
(1, 'HTML5 新特性', '了解 HTML5 新增的语义化标签', 3);

-- 课程1 的课时
INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(1, 'HTML 文档结构', '<h2>HTML 文档的基本结构</h2><p>每个 HTML 文档都包含 <!DOCTYPE html>、<html>、<head> 和 <body> 标签</p>', NULL, 600, 1, TRUE),
(1, '常用 HTML 标签', '<h2>常用 HTML 标签</h2><p>学习标题、段落、链接、图片等常用标签的使用</p>', NULL, 900, 2, FALSE),
(1, 'HTML 表单', '<h2>HTML 表单元素</h2><p>学习如何使用表单收集用户输入</p>', NULL, 1200, 3, FALSE),
(2, 'CSS 选择器', '<h2>CSS 选择器</h2><p>学习类选择器、ID 选择器和伪类选择器</p>', NULL, 900, 1, FALSE),
(2, 'CSS 盒模型', '<h2>CSS 盒模型</h2><p>理解 margin、border、padding 和 content</p>', NULL, 600, 2, FALSE),
(3, '语义化标签', '<h2>HTML5 语义化标签</h2><p>学习 header、nav、section、article 等语义化标签</p>', NULL, 900, 1, FALSE);

-- 课程2: JavaScript Basic
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(2, 'JavaScript 基础', '变量、数据类型和基本语法', 1),
(2, '函数与作用域', '函数定义、作用域和闭包', 2),
(2, 'DOM 操作', '使用 JavaScript 操作页面元素', 3),
(2, '异步编程', 'Promise、async/await 和事件循环', 4);

-- 课程2 的课时
INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(4, '变量与数据类型', '<h2>变量与数据类型</h2><p>学习 var、let、const 的区别，以及 JavaScript 的数据类型</p>', 'https://www.w3schools.com/html/mov_bbb.mp4', 600, 1, TRUE),
(4, '运算符与表达式', '<h2>运算符与表达式</h2><p>算术运算符、比较运算符、逻辑运算符</p>', NULL, 900, 2, FALSE),
(4, '流程控制', '<h2>流程控制</h2><p>if-else、switch、for、while 循环</p>', NULL, 1200, 3, FALSE),
(5, '函数定义', '<h2>函数定义</h2><p>函数声明、函数表达式、箭头函数</p>', NULL, 900, 1, FALSE),
(5, '作用域与闭包', '<h2>作用域与闭包</h2><p>词法作用域、变量提升、闭包原理</p>', NULL, 1200, 2, FALSE),
(6, 'DOM 选择器', '<h2>DOM 选择器</h2><p>getElementById、querySelector、querySelectorAll</p>', NULL, 600, 1, FALSE),
(6, 'DOM 操作与事件', '<h2>DOM 操作与事件</h2><p>创建、修改、删除元素，事件监听</p>', NULL, 900, 2, FALSE),
(7, 'Promise 基础', '<h2>Promise 基础</h2><p>理解 Promise 的概念和用法</p>', NULL, 900, 1, FALSE),
(7, 'async/await', '<h2>async/await</h2><p>使用 async/await 简化异步代码</p>', NULL, 600, 2, FALSE);

-- 课程3: Vue.js Framework
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(3, 'Vue 基础', 'Vue 核心概念和基本用法', 1),
(3, '组件化开发', '组件通信和复用', 2),
(3, 'Vue Router', '路由管理和页面跳转', 3);

INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(10, 'Vue 实例与模板语法', '<h2>Vue 实例</h2><p>创建 Vue 实例，学习模板语法和指令</p>', NULL, 900, 1, TRUE),
(10, '计算属性与侦听器', '<h2>计算属性与侦听器</h2><p>computed 和 watch 的使用</p>', NULL, 600, 2, FALSE),
(11, '组件基础', '<h2>组件基础</h2><p>组件的定义、props 和 events</p>', NULL, 900, 1, FALSE),
(11, '组件通信', '<h2>组件通信</h2><p>父子组件通信、事件总线、Vuex 状态管理</p>', NULL, 1200, 2, FALSE),
(12, '路由基础', '<h2>Vue Router 基础</h2><p>路由配置和页面导航</p>', NULL, 600, 1, FALSE);

-- 课程4: Node.js Backend
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(4, 'Node.js 入门', '安装 Node.js 和基本概念', 1),
(4, 'Express 框架', '使用 Express 构建 Web 应用', 2),
(4, '数据库集成', '连接 MongoDB 和 MySQL', 3);

INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(15, 'Node.js 简介', '<h2>Node.js 简介</h2><p>安装 Node.js，学习 CommonJS 模块系统</p>', NULL, 600, 1, TRUE),
(15, 'fs 和 path 模块', '<h2>文件操作</h2><p>使用 fs 和 path 模块进行文件读写</p>', NULL, 900, 2, FALSE),
(16, 'Express 入门', '<h2>Express 入门</h2><p>创建 Express 应用，路由和中间件</p>', NULL, 900, 1, FALSE),
(16, 'RESTful API 设计', '<h2>RESTful API</h2><p>设计 RESTful API 接口规范</p>', NULL, 1200, 2, FALSE),
(17, 'MongoDB 基础', '<h2>MongoDB 基础</h2><p>使用 Mongoose 操作 MongoDB</p>', NULL, 900, 1, FALSE);

-- 课程5: MySQL Database
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(5, '数据库基础', '数据库概念和 SQL 语言基础', 1),
(5, 'SQL 查询', 'SELECT、JOIN 和子查询', 2),
(5, '数据库设计', '范式理论和索引优化', 3);

INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(20, '数据库概述', '<h2>数据库概述</h2><p>关系型数据库和 SQL 基础</p>', NULL, 600, 1, TRUE),
(20, '安装 MySQL', '<h2>安装 MySQL</h2><p>MySQL 安装和基本配置</p>', NULL, 900, 2, FALSE),
(21, 'SELECT 查询', '<h2>SELECT 查询</h2><p>基本查询、条件过滤、排序和分组</p>', NULL, 900, 1, FALSE),
(21, 'JOIN 连接查询', '<h2>JOIN 连接查询</h2><p>INNER JOIN、LEFT JOIN、RIGHT JOIN</p>', NULL, 1200, 2, FALSE),
(22, '数据库范式', '<h2>数据库范式</h2><p>第一范式到第三范式</p>', NULL, 900, 1, FALSE);

-- 课程6: Python ML
INSERT INTO chapters (course_id, title, description, `order`) VALUES
(6, 'Python 基础', 'Python 语言基础和数据类型', 1),
(6, 'NumPy 与 Pandas', '科学计算和数据处理', 2),
(6, '机器学习基础', '常用机器学习算法', 3);

INSERT INTO lessons (chapter_id, title, content, video_url, duration, `order`, is_free) VALUES
(25, 'Python 环境搭建', '<h2>Python 环境搭建</h2><p>安装 Python 和 Jupyter Notebook</p>', NULL, 600, 1, TRUE),
(25, 'Python 基础语法', '<h2>Python 基础语法</h2><p>变量、列表、字典、条件判断和循环</p>', NULL, 900, 2, FALSE),
(26, 'NumPy 数组', '<h2>NumPy 数组</h2><p>数组创建、索引、切片和运算</p>', NULL, 900, 1, FALSE),
(26, 'Pandas 数据帧', '<h2>Pandas 数据帧</h2><p>DataFrame 操作和数据清洗</p>', NULL, 1200, 2, FALSE),
(27, '线性回归', '<h2>线性回归</h2><p>使用 scikit-learn 实现线性回归</p>', NULL, 900, 1, FALSE);

-- 插入初始题目数据
-- 两数之和
INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format, examples, test_cases, time_limit, memory_limit, template_code, created_by, status) VALUES
('两数之和', '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。', 'easy', 'array', '["array", "hash-table"]', '第一行：n 和 target，第二行：n 个整数', '输出两个下标，用空格分隔', '[{"input": "4 9 2 7 11 15", "output": "0 1"}, {"input": "3 6 3 2 4", "output": "1 2"}]', '[{"input": "4 9 2 7 11 15", "output": "0 1", "is_hidden": false}, {"input": "3 6 3 2 4", "output": "1 2", "is_hidden": false}, {"input": "2 6 3 3", "output": "0 1", "is_hidden": true}, {"input": "4 0 0 4 3 0", "output": "0 3", "is_hidden": true}, {"input": "5 -8 -1 -2 -3 -4 -5", "output": "2 4", "is_hidden": true}, {"input": "5 9 1 2 3 4 5", "output": "3 4", "is_hidden": true}, {"input": "3 5000000 1000000 2000000 3000000", "output": "1 2", "is_hidden": true}, {"input": "6 8 2 1 9 4 4 56", "output": "3 4", "is_hidden": true}, {"input": "5 12 1 3 5 7 9", "output": "1 4", "is_hidden": true}, {"input": "10 19999 1 2 3 4 5 6 7 8 9999 10000", "output": "8 9", "is_hidden": true} ]', 1000, 256, '{"javascript": "function twoSum(nums, target) {\n    // 你的代码\n}", "python": "def twoSum(nums, target):\n    # 你的代码\n    pass"}', 1, 'published');

-- 反转字符串
INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format, examples, test_cases, time_limit, memory_limit, template_code, created_by, status) VALUES
('反转字符串', '编写一个函数，其作用是将输入的字符串反转过来。', 'easy', 'string', '["string", "two-pointers"]', '输入一个字符串', '输出反转后的字符串', '[{"input": "hello", "output": "olleh"}, {"input": "world", "output": "dlrow"}]', '[{"input": "hello", "output": "olleh", "is_hidden": false}, {"input": "world", "output": "dlrow", "is_hidden": false}, {"input": "", "output": "", "is_hidden": true}, {"input": "a", "output": "a", "is_hidden": true}, {"input": "12345", "output": "54321", "is_hidden": true}, {"input": "!@#$%", "output": "%$#@!", "is_hidden": true}, {"input": "Hello World", "output": "dlroW olleH", "is_hidden": true}, {"input": "123abc", "output": "cba321", "is_hidden": true}, {"input": "   ", "output": "   ", "is_hidden": true}, {"input": "very long string", "output": "gnirts gnol yrev", "is_hidden": true} ]', 1000, 256, '{"javascript": "function reverseString(s) {\n    // 你的代码\n}", "python": "def reverseString(s):\n    # 你的代码\n    pass"}', 1, 'published');

-- 有效的括号
INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format, examples, test_cases, time_limit, memory_limit, template_code, created_by, status) VALUES
('有效的括号', '给定一个只包括括号字符的字符串，判断字符串是否有效。有效字符串需满足：左括号必须用相同类型的右括号闭合；左括号必须以正确的顺序闭合；每个右括号都有一个对应的相同类型的左括号。', 'medium', 'stack', '["stack", "string"]', '输入一个包含括号的字符串', '输出 true 或 false', '[{"input": "()[]{}", "output": "true"}, {"input": "([)]", "output": "false"}]', '[{"input": "()[]{}", "output": "true", "is_hidden": false}, {"input": "([)]", "output": "false", "is_hidden": false}, {"input": "", "output": "true", "is_hidden": true}, {"input": "()", "output": "true", "is_hidden": true}, {"input": "(", "output": "false", "is_hidden": true}, {"input": ")", "output": "false", "is_hidden": true}, {"input": "((()))", "output": "true", "is_hidden": true}, {"input": "(()))", "output": "false", "is_hidden": true}, {"input": "{[()]}", "output": "true", "is_hidden": true}, {"input": "{[}]", "output": "false", "is_hidden": true}, {"input": "{{{{}}}}}", "output": "true", "is_hidden": true}, {"input": "{{{{}}}", "output": "false", "is_hidden": true} ]', 1000, 256, '{"javascript": "function isValid(s) {\n    // 你的代码\n}", "python": "def isValid(s):\n    # 你的代码\n    pass"}', 1, 'published');

-- 插入初始帖子数据
INSERT INTO posts (title, content, author_id, category, tags, view_count, like_count, comment_count, status) VALUES
('如何高效学习编程？', '实践是学习编程的关键。从基础开始，循序渐进地构建项目，多动手写代码才能真正掌握编程技能。建议每天坚持练习，从简单的小项目做起，逐步挑战更复杂的问题。', 2, 'article', '["学习", "编程"]', 1520, 89, 23, 'published'),
('Vue3 组合式 API 入门指南', 'Vue3 引入了组合式 API，让代码组织更加灵活和清晰。相比选项式 API，组合式 API 可以更好地复用逻辑代码，提升开发效率。', 2, 'article', '["Vue", "前端"]', 890, 56, 12, 'published'),
('求助：如何优化两数之和问题？', '我用了双重循环，时间复杂度是 O(n²)，运行超时了。请问如何优化到 O(n) 的时间复杂度？听说可以用哈希表，但不太理解具体思路。', 1, 'question', '["算法", "求助"]', 456, 34, 18, 'published');