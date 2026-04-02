document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initCourseFilters();
    initPracticeSection();
    initPlayground();
    initSmoothScroll();
});

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initCourseFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            courseCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    const courseButtons = document.querySelectorAll('.course-card .btn-primary');
    courseButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const progressBar = card.querySelector('.progress-bar');
            
            if (progressBar.style.width === '0%') {
                progressBar.style.width = '15%';
                this.textContent = '继续学习';
                showNotification('已开始学习课程！', 'success');
            } else {
                const currentWidth = parseInt(progressBar.style.width);
                if (currentWidth < 100) {
                    progressBar.style.width = Math.min(currentWidth + 20, 100) + '%';
                    if (progressBar.style.width === '100%') {
                        this.textContent = '已完成';
                        showNotification('恭喜完成课程！', 'success');
                    }
                }
            }
        });
    });
}

function initPracticeSection() {
    const problemItems = document.querySelectorAll('.problem-item');
    const difficultyFilter = document.getElementById('difficulty-filter');
    const runBtn = document.getElementById('run-btn');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearOutputBtn = document.getElementById('clear-output');
    const codeInput = document.getElementById('code-input');
    const outputContent = document.getElementById('output-content');
    const languageSelect = document.getElementById('language-select');
    
    const problems = {
        1: {
            title: '两数之和',
            difficulty: 'easy',
            description: `<p>给定一个整数数组 <code>nums</code> 和一个整数目标值 <code>target</code>，请你在该数组中找出和为目标值的那两个整数，并返回它们的数组下标。</p>
                <p>你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。</p>
                <h4>示例：</h4>
                <pre><code>输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。</code></pre>`,
            template: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // 在这里编写你的代码
    
}`
        },
        2: {
            title: '反转字符串',
            difficulty: 'easy',
            description: `<p>编写一个函数，其作用是将输入的字符串反转过来。输入字符串以字符数组 <code>s</code> 的形式给出。</p>
                <h4>示例：</h4>
                <pre><code>输入：s = ["h","e","l","l","o"]
输出：["o","l","l","e","h"]</code></pre>`,
            template: `/**
 * @param {character[]} s
 * @return {void}
 */
function reverseString(s) {
    // 在这里编写你的代码
    
}`
        },
        3: {
            title: '有效的括号',
            difficulty: 'medium',
            description: `<p>给定一个只包括 <code>'('</code>，<code>')'</code>，<code>'{'</code>，<code>'}'</code>，<code>'['</code>，<code>']'</code> 的字符串 <code>s</code> ，判断字符串是否有效。</p>
                <h4>示例：</h4>
                <pre><code>输入：s = "()[]{}"
输出：true</code></pre>`,
            template: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // 在这里编写你的代码
    
}`
        },
        4: {
            title: '最长回文子串',
            difficulty: 'medium',
            description: `<p>给你一个字符串 <code>s</code>，找到 <code>s</code> 中最长的回文子串。</p>
                <h4>示例：</h4>
                <pre><code>输入：s = "babad"
输出："bab"
解释："aba" 同样是符合题意的答案。</code></pre>`,
            template: `/**
 * @param {string} s
 * @return {string}
 */
function longestPalindrome(s) {
    // 在这里编写你的代码
    
}`
        },
        5: {
            title: '合并K个排序链表',
            difficulty: 'hard',
            description: `<p>给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中，返回合并后的链表。</p>
                <h4>示例：</h4>
                <pre><code>输入：lists = [[1,4,5],[1,3,4],[2,6]]
输出：[1,1,2,3,4,4,5,6]</code></pre>`,
            template: `/**
 * @param {ListNode[]} lists
 * @return {ListNode}
 */
function mergeKLists(lists) {
    // 在这里编写你的代码
    
}`
        }
    };
    
    problemItems.forEach(item => {
        item.addEventListener('click', function() {
            problemItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const problemId = this.dataset.id;
            const problem = problems[problemId];
            
            const descriptionEl = document.querySelector('.problem-description');
            descriptionEl.innerHTML = `
                <h3>${problem.title}</h3>
                <span class="difficulty ${problem.difficulty}">${getDifficultyText(problem.difficulty)}</span>
                <div class="problem-content">${problem.description}</div>
            `;
            
            codeInput.value = problem.template;
            updateLineNumbers();
            outputContent.innerHTML = '<span class="placeholder">点击"运行"查看结果...</span>';
        });
    });
    
    difficultyFilter.addEventListener('change', function() {
        const filter = this.value;
        problemItems.forEach(item => {
            if (filter === 'all' || item.dataset.difficulty === filter) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    runBtn.addEventListener('click', function() {
        const code = codeInput.value;
        outputContent.innerHTML = '<span class="success">代码运行中...</span>';
        
        setTimeout(() => {
            try {
                outputContent.innerHTML = `
                    <div class="success">✓ 编译成功</div>
                    <div>执行时间: ${Math.floor(Math.random() * 100)}ms</div>
                    <div>内存消耗: ${Math.floor(Math.random() * 10 + 5)}MB</div>
                    <div class="success">测试用例通过: ${Math.floor(Math.random() * 3 + 1)}/3</div>
                `;
            } catch (e) {
                outputContent.innerHTML = `<span class="error">错误: ${e.message}</span>`;
            }
        }, 500);
    });
    
    submitBtn.addEventListener('click', function() {
        outputContent.innerHTML = '<span>提交中...</span>';
        
        setTimeout(() => {
            const passed = Math.random() > 0.3;
            if (passed) {
                outputContent.innerHTML = `
                    <div class="success">✓ 提交成功！</div>
                    <div class="success">通过所有测试用例</div>
                    <div>执行时间: ${Math.floor(Math.random() * 100)}ms</div>
                    <div>内存消耗: ${Math.floor(Math.random() * 10 + 5)}MB</div>
                `;
                showNotification('恭喜！题目解答正确！', 'success');
            } else {
                outputContent.innerHTML = `
                    <div class="error">✗ 提交失败</div>
                    <div class="error">测试用例未全部通过</div>
                    <div>请检查代码逻辑后重试</div>
                `;
            }
        }, 1000);
    });
    
    resetBtn.addEventListener('click', function() {
        const activeProblem = document.querySelector('.problem-item.active');
        if (activeProblem) {
            const problemId = activeProblem.dataset.id;
            codeInput.value = problems[problemId].template;
            updateLineNumbers();
        }
    });
    
    clearOutputBtn.addEventListener('click', function() {
        outputContent.innerHTML = '<span class="placeholder">点击"运行"查看结果...</span>';
    });
    
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', function() {
        document.querySelector('.line-numbers').scrollTop = this.scrollTop;
    });
    
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        const lineNumbers = document.querySelector('.line-numbers');
        lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => `<span>${i + 1}</span>`).join('');
    }
    
    updateLineNumbers();
}

function initPlayground() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const editors = {
        html: document.getElementById('html-editor'),
        css: document.getElementById('css-editor'),
        js: document.getElementById('js-editor')
    };
    const runPreviewBtn = document.getElementById('run-preview');
    const previewFrame = document.getElementById('preview-frame');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const lang = this.dataset.lang;
            Object.values(editors).forEach(editor => editor.classList.remove('active'));
            editors[lang].classList.add('active');
        });
    });
    
    function updatePreview() {
        const html = editors.html.value;
        const css = editors.css.value;
        const js = editors.js.value;
        
        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*<\/head>|<body>|<\/body>/gi, '')}
                <script>${js}<\/script>
            </body>
            </html>
        `;
        
        previewFrame.srcdoc = content;
    }
    
    runPreviewBtn.addEventListener('click', updatePreview);
    
    updatePreview();
}

function getDifficultyText(difficulty) {
    const texts = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    return texts[difficulty] || difficulty;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="ri-${type === 'success' ? 'check' : 'information'}-line"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#4f46e5'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);