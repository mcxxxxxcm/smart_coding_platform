CREATE DATABASE IF NOT EXISTS smart_coding_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE smart_coding_platform;

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

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post (post_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (comment_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, email, password, role, level, experience, points, bio) VALUES
('admin', 'admin@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'admin', 10, 10000, 5000, '系统管理员'),
('teacher1', 'teacher1@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'teacher', 8, 8000, 3000, '资深前端开发工程师'),
('teacher2', 'teacher2@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYqVqxqZ', 'teacher', 7, 7000, 2500, '后端架构师');

INSERT INTO courses (title, description, category, difficulty, teacher_id, duration, price, status, enrollment_count, rating) VALUES
('HTML5 + CSS3 基础入门', '从零开始学习网页开发，掌握HTML和CSS核心技术', 'frontend', 'beginner', 2, 20, 0, 'published', 2300, 4.8),
('JavaScript 编程基础', '学习JavaScript核心语法，掌握网页交互开发技能', 'frontend', 'beginner', 2, 30, 0, 'published', 1800, 4.7),
('Vue.js 框架实战', '深入学习Vue.js框架，构建现代化前端应用', 'frontend', 'intermediate', 2, 40, 99.00, 'published', 1200, 4.9),
('Node.js 后端开发', '使用Node.js构建高性能服务端应用', 'backend', 'intermediate', 3, 35, 129.00, 'published', 980, 4.6),
('MySQL 数据库入门', '学习数据库基础知识，掌握SQL查询技能', 'database', 'beginner', 3, 25, 0, 'published', 1500, 4.5),
('Python 机器学习', '使用Python进行机器学习和数据分析', 'ai', 'advanced', 3, 50, 199.00, 'published', 860, 4.8);

INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format, examples, test_cases, time_limit, memory_limit, template_code, created_by, status) VALUES
('两数之和', '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值的那两个整数，并返回它们的数组下标。你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。', 'easy', 'array', '["数组", "哈希表"]', '第一行输入数组长度n和目标值target，第二行输入n个整数', '输出两个下标', '[{"input": "4 9\\n2 7 11 15", "output": "0 1", "explanation": "因为 nums[0] + nums[1] == 9 ，返回 [0, 1]"}]', '[{"input": "4 9\\n2 7 11 15", "output": "0 1", "is_hidden": false}, {"input": "3 6\\n3 2 4", "output": "1 2", "is_hidden": false}, {"input": "2 6\\n3 3", "output": "0 1", "is_hidden": true}]', 1000, 256, '{"javascript": "/**\\n * @param {number[]} nums\\n * @param {number} target\\n * @return {number[]}\\n */\\nfunction twoSum(nums, target) {\\n    // 在这里编写你的代码\\n}", "python": "def twoSum(nums, target):\\n    # 在这里编写你的代码\\n    pass"}', 1, 'published'),
('反转字符串', '编写一个函数，其作用是将输入的字符串反转过来。输入字符串以字符数组 s 的形式给出。', 'easy', 'string', '["字符串", "双指针"]', '输入一个字符串', '输出反转后的字符串', '[{"input": "hello", "output": "olleh"}]', '[{"input": "hello", "output": "olleh", "is_hidden": false}, {"input": "world", "output": "dlrow", "is_hidden": true}]', 1000, 256, '{"javascript": "function reverseString(s) {\\n    // 在这里编写你的代码\\n}", "python": "def reverseString(s):\\n    # 在这里编写你的代码\\n    pass"}', 1, 'published'),
('有效的括号', '给定一个只包括 (, ), {, }, [, ] 的字符串 s ，判断字符串是否有效。有效字符串需满足：左括号必须用相同类型的右括号闭合。左括号必须以正确的顺序闭合。', 'medium', 'stack', '["栈", "字符串"]', '输入一个只包含括号的字符串', '输出 true 或 false', '[{"input": "()[]{}", "output": "true"}, {"input": "(]", "output": "false"}]', '[{"input": "()[]{}", "output": "true", "is_hidden": false}, {"input": "(]", "output": "false", "is_hidden": false}, {"input": "([)]", "output": "false", "is_hidden": true}]', 1000, 256, '{"javascript": "function isValid(s) {\\n    // 在这里编写你的代码\\n}", "python": "def isValid(s):\\n    # 在这里编写你的代码\\n    pass"}', 1, 'published'),
('最长回文子串', '给你一个字符串 s，找到 s 中最长的回文子串。', 'medium', 'dynamic-programming', '["动态规划", "字符串"]', '输入一个字符串', '输出最长回文子串', '[{"input": "babad", "output": "bab", "explanation": "aba 同样是符合题意的答案"}]', '[{"input": "babad", "output": "bab", "is_hidden": false}, {"input": "cbbd", "output": "bb", "is_hidden": true}]', 1000, 256, '{"javascript": "function longestPalindrome(s) {\\n    // 在这里编写你的代码\\n}", "python": "def longestPalindrome(s):\\n    # 在这里编写你的代码\\n    pass"}', 1, 'published'),
('合并K个排序链表', '给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中，返回合并后的链表。', 'hard', 'linked-list', '["链表", "分治", "堆"]', '输入K个有序链表', '输出合并后的链表', '[{"input": "[[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]"}]', '[{"input": "[[1,4,5],[1,3,4],[2,6]]", "output": "[1,1,2,3,4,4,5,6]", "is_hidden": false}]', 2000, 256, '{"javascript": "function mergeKLists(lists) {\\n    // 在这里编写你的代码\\n}", "python": "def mergeKLists(lists):\\n    # 在这里编写你的代码\\n    pass"}', 1, 'published');

INSERT INTO posts (title, content, author_id, category, tags, view_count, like_count, comment_count, status) VALUES
('如何高效学习编程？', '作为一个有多年编程经验的开发者，我想分享一些学习编程的心得体会：\n\n1. **实践为主**：编程是一门实践性很强的技能，光看书是不够的，一定要动手写代码。\n\n2. **循序渐进**：从基础开始，不要急于求成。先掌握一门语言的基础语法，再学习框架和工具。\n\n3. **项目驱动**：通过做项目来学习，这样能更好地理解知识的应用场景。\n\n4. **持续学习**：技术更新很快，保持学习的习惯很重要。\n\n希望这些建议对大家有帮助！', 2, 'article', '["学习经验", "编程"]', 1520, 89, 23, 'published'),
('Vue3 组合式 API 详解', 'Vue3 引入了组合式 API，这是一种全新的组件逻辑组织方式。相比选项式 API，它有以下优势：\n\n## 更好的逻辑复用\n\n组合式 API 允许我们将相关的逻辑放在一起，而不是分散在不同的选项中。\n\n## 更好的类型推断\n\n使用 TypeScript 时，组合式 API 提供了更好的类型推断支持。\n\n## 更灵活的代码组织\n\n我们可以根据功能来组织代码，而不是根据选项类型。\n\n```javascript\nimport { ref, computed } from \'vue\'\n\nexport default {\n  setup() {\n    const count = ref(0)\n    const doubled = computed(() => count.value * 2)\n    \n    return { count, doubled }\n  }\n}\n```', 2, 'article', '["Vue", "前端"]', 890, 56, 12, 'published'),
('求助：两数之和问题怎么优化？', '我在做两数之和这道题时，用了双重循环的方法，时间复杂度是 O(n²)，但是看到别人的解法有 O(n) 的。请问怎么优化呢？\n\n我的代码：\n```javascript\nfunction twoSum(nums, target) {\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] + nums[j] === target) {\n                return [i, j];\n            }\n        }\n    }\n}\n```\n\n请大佬们指点一下！', 1, 'question', '["算法", "求助"]', 456, 34, 18, 'published');
