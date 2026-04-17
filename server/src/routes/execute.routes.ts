import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { CodeExecutor } from '../services/code-executor.service';

const router = Router();
const codeExecutor = new CodeExecutor();

router.post('/', authenticate, async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: '缺少代码或语言参数'
      });
    }
    
    // 为了测试，我们使用一个简单的测试用例
    const testCases = [
      {
        input: '',
        output: 'Hello World',
        is_hidden: false
      }
    ];
    
    const results = await codeExecutor.execute(language, code, testCases, 1000, 256);
    
    const result = results[0];
    
    res.json({
      success: true,
      data: {
        output: result.output,
        expected: result.expected,
        status: result.status,
        runtime: result.runtime,
        memory: result.memory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '代码执行失败',
      error: (error as Error).message
    });
  }
});

export default router;