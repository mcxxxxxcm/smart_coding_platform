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
('admin', 'admin@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8LeX4.VTtYqVqxqZa', 'admin', 10, 10000, 5000, 'System Admin'),
('teacher1', 'teacher1@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8LeX4.VTtYqVqxqZa', 'teacher', 8, 8000, 3000, 'Frontend Developer'),
('teacher2', 'teacher2@smartcoding.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8LeX4.VTtYqVqxqZa', 'teacher', 7, 7000, 2500, 'Backend Developer');

INSERT INTO courses (title, description, category, difficulty, teacher_id, duration, price, status, enrollment_count, rating) VALUES
('HTML5 CSS3 Basic', 'Learn web development from scratch', 'frontend', 'beginner', 2, 20, 0, 'published', 2300, 4.8),
('JavaScript Basic', 'Learn JavaScript core syntax', 'frontend', 'beginner', 2, 30, 0, 'published', 1800, 4.7),
('Vue.js Framework', 'Learn Vue.js framework', 'frontend', 'intermediate', 2, 40, 99.00, 'published', 1200, 4.9),
('Node.js Backend', 'Build backend with Node.js', 'backend', 'intermediate', 3, 35, 129.00, 'published', 980, 4.6),
('MySQL Database', 'Learn database basics', 'database', 'beginner', 3, 25, 0, 'published', 1500, 4.5),
('Python ML', 'Machine learning with Python', 'ai', 'advanced', 3, 50, 199.00, 'published', 860, 4.8);

INSERT INTO problems (title, description, difficulty, category, tags, input_format, output_format, examples, test_cases, time_limit, memory_limit, template_code, created_by, status) VALUES
('Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'easy', 'array', '["array", "hash-table"]', 'First line: n and target, Second line: n integers', 'Output two indices', '[{"input": "4 9\\n2 7 11 15", "output": "0 1"}]', '[{"input": "4 9\\n2 7 11 15", "output": "0 1", "is_hidden": false}]', 1000, 256, '{"javascript": "function twoSum(nums, target) {\\n    // Your code here\\n}", "python": "def twoSum(nums, target):\\n    # Your code here\\n    pass"}', 1, 'published'),
('Reverse String', 'Write a function that reverses a string.', 'easy', 'string', '["string", "two-pointers"]', 'Input a string', 'Output reversed string', '[{"input": "hello", "output": "olleh"}]', '[{"input": "hello", "output": "olleh", "is_hidden": false}]', 1000, 256, '{"javascript": "function reverseString(s) {\\n    // Your code here\\n}", "python": "def reverseString(s):\\n    # Your code here\\n    pass"}', 1, 'published'),
('Valid Parentheses', 'Given a string containing just the characters parentheses, determine if the input string is valid.', 'medium', 'stack', '["stack", "string"]', 'Input a string with parentheses', 'Output true or false', '[{"input": "()[]{}", "output": "true"}]', '[{"input": "()[]{}", "output": "true", "is_hidden": false}]', 1000, 256, '{"javascript": "function isValid(s) {\\n    // Your code here\\n}", "python": "def isValid(s):\\n    # Your code here\\n    pass"}', 1, 'published');

INSERT INTO posts (title, content, author_id, category, tags, view_count, like_count, comment_count, status) VALUES
('How to learn programming efficiently?', 'Practice is the key to learning programming. Start with basics and build projects.', 2, 'article', '["learning", "programming"]', 1520, 89, 23, 'published'),
('Vue3 Composition API Guide', 'Vue3 introduces Composition API for better code organization.', 2, 'article', '["Vue", "frontend"]', 890, 56, 12, 'published'),
('Help: How to optimize Two Sum?', 'I used double loop with O(n2) complexity. How to optimize to O(n)?', 1, 'question', '["algorithm", "help"]', 456, 34, 18, 'published');
