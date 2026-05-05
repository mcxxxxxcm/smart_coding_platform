import { DeepSeekService } from './deepseek.service';
import { problemRepository } from '../repositories/problem.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { userRepository } from '../repositories/user.repository';
import { examRepository } from '../repositories/exam.repository';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { AppError } from '../middleware/error.middleware';

const deepseekService = new DeepSeekService();

const aiCache = new Map<string, { data: any; expireAt: number }>();

const getCached = (key: string): any | null => {
  const cached = aiCache.get(key);
  if (cached && cached.expireAt > Date.now()) return cached.data;
  if (cached) aiCache.delete(key);
  return null;
};

const setCache = (key: string, data: any, ttlMs: number = 5 * 60 * 1000) => {
  aiCache.set(key, { data, expireAt: Date.now() + ttlMs });
};

export class AiService {
  async chat(userId: number, message: string, problemId?: number, code?: string) {
    if (!message) throw new AppError('消息不能为空', 400);

    let context = '';
    if (problemId) {
      const problem = await problemRepository.findById(problemId, true) as any;
      if (problem) {
        context = `当前题目：${problem.title}\n难度：${problem.difficulty}\n描述：${problem.description}`;
      }
    }
    if (code) {
      context += `\n\n用户当前代码：\n\`\`\`\n${code}\n\`\`\``;
    }

    const reply = await deepseekService.chat(message, context);
    return { reply };
  }

  async explainCode(userId: number, code: string, language: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    const reply = await deepseekService.chat(
      `请解释以下${language}代码的作用和逻辑：\n\`\`\`${language}\n${code}\n\`\`\``,
      '你是一个专业的代码解释助手，请用中文详细解释代码的功能、逻辑和关键点。'
    );
    return { reply };
  }

  async debugCode(userId: number, code: string, language: string, errorMessage?: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    let prompt = `请帮我审查并调试以下${language}代码，指出可能存在的问题和改进建议：\n\`\`\`${language}\n${code}\n\`\`\``;
    if (errorMessage) {
      prompt += `\n\n错误信息：${errorMessage}`;
    }

    const reply = await deepseekService.chat(prompt, '你是一个专业的代码调试助手，请用中文帮助找出代码中的错误并提供修复建议。');
    return { reply };
  }

  async optimizeCode(userId: number, code: string, language: string) {
    if (!code) throw new AppError('代码不能为空', 400);

    const reply = await deepseekService.chat(
      `请帮我优化以下${language}代码，提升性能和可读性：\n\`\`\`${language}\n${code}\n\`\`\``,
      '你是一个专业的代码优化助手，请用中文提供优化建议和改进后的代码。'
    );
    return { reply };
  }

  async getHint(userId: number, problemId: number) {
    const problem = await problemRepository.findById(problemId, true) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    const reply = await deepseekService.chat(
      `请根据题目"${problem.title}"，题目描述：${problem.description}，给我一些解题思路和提示。不要直接给出完整代码答案，只给提示。`,
      '你是一个编程教学助手，请用中文给出解题提示，不要直接给出完整答案。'
    );
    return { reply };
  }

  async getLearningPath(userId: number) {
    const cacheKey = `learning_path_${userId}`;
    const cached = getCached(cacheKey);
    if (cached) return { data: cached };

    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT s.problem_id, s.status, s.language, s.submitted_at,
        p.title as problem_title, p.difficulty, p.category, p.tags
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? ORDER BY s.submitted_at DESC`,
      [userId]
    );

    const [enrollments] = await pool.execute<RowDataPacket[]>(
      `SELECT ue.course_id, c.title as course_title, ue.progress, ue.completed
       FROM user_enrollments ue JOIN courses c ON ue.course_id = c.id
       WHERE ue.user_id = ?`,
      [userId]
    );

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('用户不存在', 404);

    const difficultyStats: Record<string, { attempted: number; accepted: number }> = { easy: { attempted: 0, accepted: 0 }, medium: { attempted: 0, accepted: 0 }, hard: { attempted: 0, accepted: 0 } };
    const categoryStats: Record<string, { attempted: number; accepted: number }> = {};
    const problemSet = new Set<number>();

    for (const sub of submissions as RowDataPacket[]) {
      if (!problemSet.has(sub.problem_id)) {
        problemSet.add(sub.problem_id);
        const diff = sub.difficulty || 'easy';
        if (difficultyStats[diff]) {
          difficultyStats[diff].attempted++;
          if (sub.status === 'accepted') difficultyStats[diff].accepted++;
        }
        const cat = sub.category || '其他';
        if (!categoryStats[cat]) categoryStats[cat] = { attempted: 0, accepted: 0 };
        categoryStats[cat].attempted++;
        if (sub.status === 'accepted') categoryStats[cat].accepted++;
      }
    }

    const [availableProblems] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, difficulty, category FROM problems WHERE status = 'published' LIMIT 50`
    );

    const context = JSON.stringify({
      user: { level: user.level, experience: user.experience, points: user.points },
      difficultyStats,
      categoryStats,
      enrollments: (enrollments as RowDataPacket[]).map(e => ({ title: e.course_title, progress: e.progress, completed: e.completed })),
      availableProblems: (availableProblems as RowDataPacket[]).map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, category: p.category }))
    });

    const reply = await deepseekService.chat(
      `基于以下学生的学习数据，生成个性化的学习路径推荐。包括：1) 当前薄弱知识点分析 2) 推荐的学习顺序 3) 推荐练习的具体题目ID 4) 本周学习建议。请用JSON格式返回：{"weakness_analysis": "...", "recommended_path": [...], "recommended_problems": [...], "weekly_plan": "..."}\n\n学习数据：${context}`,
      '你是一个专业的编程教育顾问，根据学生的学习数据生成个性化学习路径。用中文回答，返回有效的JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { weakness_analysis: reply, recommended_path: [], recommended_problems: [], weekly_plan: '' };
    } catch {
      parsed = { weakness_analysis: reply, recommended_path: [], recommended_problems: [], weekly_plan: '' };
    }

    setCache(cacheKey, parsed, 10 * 60 * 1000);
    return { data: parsed };
  }

  async analyzeWrongAnswers(userId: number) {
    const cacheKey = `wrong_analysis_${userId}`;
    const cached = getCached(cacheKey);
    if (cached) return { data: cached };

    const [wrongSubs] = await pool.execute<RowDataPacket[]>(
      `SELECT s.problem_id, s.status, s.code, s.language, s.submitted_at, s.error_message,
        p.title as problem_title, p.difficulty, p.category, p.description
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? AND s.status != 'accepted'
       ORDER BY s.submitted_at DESC LIMIT 30`,
      [userId]
    );

    const [examWrong] = await pool.execute<RowDataPacket[]>(
      `SELECT es.problem_id, es.status, es.code, es.score,
        p.title as problem_title, p.difficulty, p.category, p.description,
        e.title as exam_title
       FROM exam_submissions es
       JOIN problems p ON es.problem_id = p.id
       JOIN exams e ON es.exam_id = e.id
       WHERE es.user_id = ? AND es.status IN ('wrong_answer', 'partial_correct', 'runtime_error')
       ORDER BY es.submitted_at DESC LIMIT 20`,
      [userId]
    );

    if ((wrongSubs as RowDataPacket[]).length === 0 && (examWrong as RowDataPacket[]).length === 0) {
      return { data: { error_patterns: [], analysis: '暂无错题记录', suggestions: [], error_type_distribution: {} } };
    }

    const context = JSON.stringify({
      practiceWrong: (wrongSubs as RowDataPacket[]).map(s => ({
        problem: s.problem_title, difficulty: s.difficulty, category: s.category,
        status: s.status, code: s.code?.substring(0, 200), error: s.error_message
      })),
      examWrong: (examWrong as RowDataPacket[]).map(s => ({
        problem: s.problem_title, difficulty: s.difficulty, category: s.category,
        status: s.status, score: s.score, exam: s.exam_title, code: s.code?.substring(0, 200)
      }))
    });

    const reply = await deepseekService.chat(
      `分析以下学生的错题数据，识别错误模式并给出针对性建议。返回JSON格式：{"error_patterns": [{"pattern": "错误模式名称", "count": 出现次数, "description": "描述", "examples": ["示例题目"]}], "analysis": "总体分析", "suggestions": [{"target": "改进方向", "action": "具体行动", "problems_to_practice": "推荐练习类型"}], "error_type_distribution": {"类型": 次数}}\n\n错题数据：${context}`,
      '你是一个专业的编程教育分析师，擅长从错题中发现学习模式。用中文回答，返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error_patterns: [], analysis: reply, suggestions: [], error_type_distribution: {} };
    } catch {
      parsed = { error_patterns: [], analysis: reply, suggestions: [], error_type_distribution: {} };
    }

    setCache(cacheKey, parsed, 10 * 60 * 1000);
    return { data: parsed };
  }

  async generateProblem(userId: number, params: { category: string; difficulty: string; language: string; topic?: string }) {
    const langLabel = params.language === 'cpp' ? 'C/C++' : 'Python';
    const diffLabel = { easy: '简单', medium: '中等', hard: '困难' }[params.difficulty] || params.difficulty;

    const prompt = `你是一位资深的编程竞赛题目设计专家。请严格按照以下要求生成一道完整的编程练习题：

【题目要求】
- 知识点分类：${params.category}
- 难度等级：${diffLabel}（对应字段值：${params.difficulty}）
- 目标语言：${langLabel}
${params.topic ? `- 具体主题：${params.topic}` : '- 自选一个有趣的题目主题'}

【严格规则】
1. 题目描述必须清晰完整，包含背景、要求、输入输出格式说明
2. 必须提供至少2个输入输出示例，每个示例包含input、output和explanation
3. 必须提供至少5个测试用例（test_cases），覆盖：正常情况、边界情况、极端情况
4. 测试用例的input和expected必须是纯文本，不要包含额外说明
5. template_code必须包含完整的输入读取和输出代码框架
6. reference_solution必须是能通过所有测试用例的完整正确代码
7. 所有字符串值不要包含换行符，用空格代替

【返回JSON格式】（严格按此格式，不要添加任何其他字段）
{
  "title": "题目标题（简洁明了）",
  "description": "题目描述。包含：1)问题描述 2)输入格式 3)输出格式 4)数据范围",
  "difficulty": "${params.difficulty}",
  "category": "${params.category}",
  "input_format": "第一行输入一个整数n，第二行输入n个整数...",
  "output_format": "输出一个整数，表示...",
  "examples": [
    {"input": "5\\n1 2 3 4 5", "output": "15", "explanation": "1+2+3+4+5=15"},
    {"input": "3\\n10 20 30", "output": "60", "explanation": "10+20+30=60"}
  ],
  "constraints": "1 <= n <= 1000, 1 <= ai <= 10000",
  "test_cases": [
    {"input": "5\\n1 2 3 4 5", "expected": "15"},
    {"input": "3\\n10 20 30", "expected": "60"},
    {"input": "1\\n100", "expected": "100"},
    {"input": "2\\n0 0", "expected": "0"},
    {"input": "4\\n-1 -2 -3 -4", "expected": "-10"}
  ],
  "hints": ["提示1：考虑使用循环累加", "提示2：注意边界情况"],
  "template_code": {"${params.language}": "${params.language === 'python' ? '# 读取输入\\nn = int(input())\\narr = list(map(int, input().split()))\\n\\n# 在此处编写你的代码\\n\\n# 输出结果\\nprint(result)' : '#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nint main() {\\n    int n;\\n    cin >> n;\\n    vector<int> arr(n);\\n    for (int i = 0; i < n; i++) cin >> arr[i];\\n\\n    // 在此处编写你的代码\\n\\n    cout << result << endl;\\n    return 0;\\n}'}"},
  "reference_solution": {"${params.language}": "${params.language === 'python' ? 'n = int(input())\\narr = list(map(int, input().split()))\\nprint(sum(arr))' : '#include <iostream>\\n#include <vector>\\nusing namespace std;\\n\\nint main() {\\n    int n;\\n    cin >> n;\\n    vector<int> arr(n);\\n    for (int i = 0; i < n; i++) cin >> arr[i];\\n    long long sum = 0;\\n    for (int x : arr) sum += x;\\n    cout << sum << endl;\\n    return 0;\\n}'}"}
}

注意：上面的示例是以求和为例，你需要生成一道${diffLabel}难度的${params.category}题目，不要生成求和题。确保test_cases中的expected值与reference_solution的运行结果完全一致。`;

    const systemPrompt = `你是一个专业的编程题目设计专家。你必须返回有效的JSON，不要包含任何Markdown标记、注释或额外文本。确保：
1. JSON格式严格合法，所有字符串正确转义
2. test_cases至少5个，覆盖各种边界
3. reference_solution代码完整可运行
4. examples和test_cases中的input格式必须一致（都用\\n表示换行）
5. 用中文描述题目，代码用${langLabel}`;

    const reply = await deepseekService.chat(prompt, systemPrompt);

    let parsed;
    try {
      let jsonStr = reply;
      const codeBlockMatch = reply.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) jsonStr = codeBlockMatch[1];
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      throw new AppError('AI生成的题目格式异常，请重试', 500);
    }

    if (!parsed.test_cases || parsed.test_cases.length < 3) {
      parsed.test_cases = parsed.examples?.map((e: any) => ({
        input: e.input, expected: e.output
      })) || [];
    }

    if (!parsed.template_code || typeof parsed.template_code === 'string') {
      const pyTemplate = '# 读取输入\nn = int(input())\n\n# 在此处编写你的代码\n\n# 输出结果\nprint(result)';
      const cppTemplate = '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    // 在此处编写你的代码\n\n    cout << result << endl;\n    return 0;\n}';
      parsed.template_code = { python: pyTemplate, cpp: cppTemplate };
    }

    return { data: parsed };
  }

  async smartSearch(userId: number, query: string) {
    const [posts] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.title, p.content, p.category, p.tags, p.like_count, p.comment_count,
        u.username as author_name
       FROM posts p LEFT JOIN users u ON p.author_id = u.id
       WHERE p.status = 'published'
       ORDER BY p.like_count DESC, p.created_at DESC LIMIT 50`
    );

    const [problems] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, difficulty, category, tags FROM problems WHERE status = 'published' LIMIT 50`
    );

    const context = JSON.stringify({
      query,
      posts: (posts as RowDataPacket[]).map(p => ({ id: p.id, title: p.title, content: p.content?.substring(0, 100), category: p.category })),
      problems: (problems as RowDataPacket[]).map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty, category: p.category }))
    });

    const reply = await deepseekService.chat(
      `用户搜索："${query}"。从以下已有内容中找到最相关的，并生成AI回答。返回JSON：{"related_posts": [{"id": 帖子ID, "relevance": "相关性说明"}], "related_problems": [{"id": 题目ID, "relevance": "相关性说明"}], "ai_answer": "AI生成的回答", "suggested_tags": ["推荐标签"]}\n\n已有内容：${context}`,
      '你是一个智能搜索助手，帮助用户找到最相关的内容并生成回答。用中文回答，返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { related_posts: [], related_problems: [], ai_answer: reply, suggested_tags: [] };
    } catch {
      parsed = { related_posts: [], related_problems: [], ai_answer: reply, suggested_tags: [] };
    }

    return { data: parsed };
  }

  async moderateContent(content: string, type: string) {
    const reply = await deepseekService.chat(
      `请审核以下${type}内容，判断是否合规。返回JSON：{"is_safe": true/false, "risk_level": "low/medium/high", "flags": ["标记1"], "suggestion": "处理建议", "categories": {"violence": false, "spam": false, "hate_speech": false, "personal_info": false, "inappropriate": false}}\n\n内容：${content}`,
      '你是一个内容审核助手，判断内容是否合规。返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { is_safe: true, risk_level: 'low', flags: [], suggestion: '', categories: {} };
    } catch {
      parsed = { is_safe: true, risk_level: 'low', flags: [], suggestion: '', categories: {} };
    }

    return { data: parsed };
  }

  async getOperationsAnalytics() {
    const cacheKey = 'operations_analytics';
    const cached = getCached(cacheKey);
    if (cached) return { data: cached };
    const [userGrowth] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM users GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`
    );
    const [submissionGrowth] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(submitted_at) as date, COUNT(*) as count FROM submissions GROUP BY DATE(submitted_at) ORDER BY date DESC LIMIT 30`
    );
    const [courseStats] = await pool.execute<RowDataPacket[]>(
      `SELECT c.title, c.enrollment_count, c.rating,
        (SELECT COUNT(*) FROM user_enrollments WHERE course_id = c.id AND completed = 1) as completed_count
       FROM courses c WHERE c.status = 'published' ORDER BY c.enrollment_count DESC LIMIT 10`
    );
    const [activeUsers] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(submitted_at) as date, COUNT(DISTINCT user_id) as count
       FROM submissions GROUP BY DATE(submitted_at) ORDER BY date DESC LIMIT 30`
    );
    const [roleDistribution] = await pool.execute<RowDataPacket[]>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    const [problemDifficulty] = await pool.execute<RowDataPacket[]>(
      `SELECT difficulty, COUNT(*) as count, AVG(accepted_count / NULLIF(submission_count, 0)) as avg_pass_rate
       FROM problems WHERE status = 'published' GROUP BY difficulty`
    );

    const context = JSON.stringify({
      userGrowth: (userGrowth as RowDataPacket[]).slice(0, 7),
      submissionGrowth: (submissionGrowth as RowDataPacket[]).slice(0, 7),
      courseStats: (courseStats as RowDataPacket[]).map(c => ({ title: c.title, enrollment: c.enrollment_count, rating: c.rating, completed: c.completed_count })),
      activeUsers: (activeUsers as RowDataPacket[]).slice(0, 7),
      roleDistribution: (roleDistribution as RowDataPacket[]).map(r => ({ role: r.role, count: r.count })),
      problemDifficulty: (problemDifficulty as RowDataPacket[]).map(p => ({ difficulty: p.difficulty, count: p.count, passRate: Math.round((p.avg_pass_rate || 0) * 100) }))
    });

    const reply = await deepseekService.chat(
      `基于以下平台运营数据，生成AI运营分析报告。返回JSON：{"overview": "总体概述", "trends": [{"name": "趋势名称", "description": "描述", "direction": "up/down/stable"}], "insights": ["洞察1", "洞察2"], "recommendations": [{"area": "改进领域", "action": "具体行动", "priority": "high/medium/low"}], "risk_alerts": [{"type": "风险类型", "description": "描述", "severity": "high/medium/low"}], "weekly_summary": "周报摘要"}\n\n运营数据：${context}`,
      '你是一个专业的平台运营分析师，擅长从数据中发现趋势和问题。用中文回答，返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { overview: reply, trends: [], insights: [], recommendations: [], risk_alerts: [], weekly_summary: '' };
    } catch {
      parsed = { overview: reply, trends: [], insights: [], recommendations: [], risk_alerts: [], weekly_summary: '' };
    }

    setCache(cacheKey, parsed, 30 * 60 * 1000);
    return { data: parsed };
  }

  async checkProblemQuality(problemId: number) {
    const problem = await problemRepository.findById(problemId, false) as any;
    if (!problem) throw new AppError('题目不存在', 404);

    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM submissions WHERE problem_id = ? GROUP BY status`,
      [problemId]
    );

    const context = JSON.stringify({
      problem: {
        title: problem.title,
        description: problem.description?.substring(0, 500),
        difficulty: problem.difficulty,
        category: problem.category,
        examples: problem.examples,
        test_cases_count: Array.isArray(problem.test_cases) ? problem.test_cases.length : 0,
        hints: problem.hints,
        template_code: problem.template_code,
        submission_count: problem.submission_count,
        accepted_count: problem.accepted_count,
        acceptance_rate: problem.submission_count > 0 ? (problem.accepted_count / problem.submission_count * 100).toFixed(1) : 0
      },
      submissionDistribution: (submissions as RowDataPacket[]).map(s => ({ status: s.status, count: s.count }))
    });

    const reply = await deepseekService.chat(
      `请检测以下编程题目的质量，从多个维度评估。返回JSON：{"overall_score": 0-100, "dimensions": {"clarity": {"score": 0-100, "issues": ["问题"]}, "test_coverage": {"score": 0-100, "issues": ["问题"]}, "difficulty_accuracy": {"score": 0-100, "issues": ["问题"]}, "completeness": {"score": 0-100, "issues": ["问题"]}}, "critical_issues": ["严重问题"], "improvement_suggestions": ["改进建议"], "is_valid": true/false}\n\n题目数据：${context}`,
      '你是一个编程题目质量审核专家，从多个维度评估题目质量。用中文回答，返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { overall_score: 0, dimensions: {}, critical_issues: [], improvement_suggestions: [], is_valid: true };
    } catch {
      parsed = { overall_score: 0, dimensions: {}, critical_issues: [], improvement_suggestions: [], is_valid: true };
    }

    return { data: parsed };
  }

  async batchCheckProblemQuality() {
    const cacheKey = 'batch_problem_quality';
    const cached = getCached(cacheKey);
    if (cached) return { data: cached };
    const [problems] = await pool.execute<RowDataPacket[]>(
      `SELECT id, title, difficulty, category, submission_count, accepted_count,
        ROUND(accepted_count / NULLIF(submission_count, 0) * 100, 1) as acceptance_rate
       FROM problems WHERE status = 'published' LIMIT 50`
    );

    const context = JSON.stringify({
      problems: (problems as RowDataPacket[]).map(p => ({
        id: p.id, title: p.title, difficulty: p.difficulty, category: p.category,
        submission_count: p.submission_count, accepted_count: p.accepted_count,
        acceptance_rate: p.acceptance_rate
      }))
    });

    const reply = await deepseekService.chat(
      `基于以下题库统计数据，快速评估题目质量。返回JSON：{"results": [{"id": 题目ID, "quality": "good/warning/poor", "issues": ["问题"]}], "summary": {"total": 总数, "good": 良好数, "warning": 警告数, "poor": 较差数}, "recommendations": ["建议"]}\n\n题库数据：${context}`,
      '你是一个题库质量审核专家，根据统计数据快速识别质量有问题的题目。用中文回答，返回有效JSON。'
    );

    let parsed;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [], summary: { total: 0, good: 0, warning: 0, poor: 0 }, recommendations: [] };
    } catch {
      parsed = { results: [], summary: { total: 0, good: 0, warning: 0, poor: 0 }, recommendations: [] };
    }

    setCache(cacheKey, parsed, 30 * 60 * 1000);
    return { data: parsed };
  }

  async getStudentDashboard(userId: number) {
    const cacheKey = `student_dashboard_${userId}`;
    const cached = getCached(cacheKey);
    if (cached) return { data: cached };
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('用户不存在', 404);

    const [submissions] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(submitted_at) as date, COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
       FROM submissions WHERE user_id = ? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(submitted_at) ORDER BY date`,
      [userId]
    );

    const [difficultyStats] = await pool.execute<RowDataPacket[]>(
      `SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as attempted,
        SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as solved
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? GROUP BY p.difficulty`,
      [userId]
    );

    const [categoryStats] = await pool.execute<RowDataPacket[]>(
      `SELECT p.category, COUNT(DISTINCT s.problem_id) as attempted,
        SUM(CASE WHEN s.status = 'accepted' THEN 1 ELSE 0 END) as solved
       FROM submissions s JOIN problems p ON s.problem_id = p.id
       WHERE s.user_id = ? GROUP BY p.category`,
      [userId]
    );

    const [streakData] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(submitted_at) as date FROM submissions
       WHERE user_id = ? AND submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(submitted_at) ORDER BY date DESC`,
      [userId]
    );

    const [totalStats] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT problem_id) as total_problems,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        COUNT(*) as total_submissions
       FROM submissions WHERE user_id = ?`,
      [userId]
    );

    const [enrollmentStats] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        AVG(progress) as avg_progress
       FROM user_enrollments WHERE user_id = ?`,
      [userId]
    );

    let streak = 0;
    const streakDates = (streakData as RowDataPacket[]).map(r => r.date);
    if (streakDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      for (const dateStr of streakDates) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (d.getTime() < checkDate.getTime()) {
          break;
        }
      }
    }

    const stats = (totalStats as RowDataPacket[])[0] || {};
    const enrollStats = (enrollmentStats as RowDataPacket[])[0] || {};

    const dashboardData = {
      user: { level: user.level, experience: user.experience, points: user.points },
      overview: {
        totalProblems: stats.total_problems || 0,
        acceptedProblems: stats.accepted_count || 0,
        totalSubmissions: stats.total_submissions || 0,
        enrolledCourses: enrollStats.total || 0,
        completedCourses: enrollStats.completed || 0,
        avgCourseProgress: Math.round(enrollStats.avg_progress || 0),
        streak
      },
      dailyActivity: (submissions as RowDataPacket[]).map(s => ({
        date: s.date, total: s.total, accepted: s.accepted
      })),
      difficultyStats: (difficultyStats as RowDataPacket[]).map(d => ({
        difficulty: d.difficulty, attempted: d.attempted, solved: d.solved,
        rate: d.attempted > 0 ? Math.round(d.solved / d.attempted * 100) : 0
      })),
      categoryStats: (categoryStats as RowDataPacket[]).map(c => ({
        category: c.category, attempted: c.attempted, solved: c.solved,
        rate: c.attempted > 0 ? Math.round(c.solved / c.attempted * 100) : 0
      }))
    };

    const reply = await deepseekService.chat(
      `基于以下学生学习数据，生成AI学习报告和建议。返回JSON：{"knowledge_radar": {"数组": 0-100, "字符串": 0-100, "链表": 0-100, "树": 0-100, "动态规划": 0-100, "图": 0-100, "排序": 0-100, "搜索": 0-100}, "learning_style": "学习风格描述", "strengths": ["优势1"], "weaknesses": ["不足1"], "suggestions": ["建议1"], "weekly_report": "本周学习总结", "next_goals": ["下一步目标"]}\n\n学习数据：${JSON.stringify(dashboardData)}`,
      '你是一个专业的学习分析顾问，根据数据生成学习报告。用中文回答，返回有效JSON。'
    );

    let aiReport;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      aiReport = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      aiReport = {};
    }

    const result = { ...dashboardData, aiReport };
    setCache(cacheKey, result, 5 * 60 * 1000);
    return { data: result };
  }
}

export const aiService = new AiService();
