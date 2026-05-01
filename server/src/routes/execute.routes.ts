import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { CodeExecutor } from '../services/code-executor.service';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../middleware/async.middleware';

const router = Router();
const codeExecutor = new CodeExecutor();

router.post('/', authenticate,
  validate([
    body('code').trim().notEmpty().withMessage('代码不能为空'),
    body('language').isIn(['python', 'cpp', 'c', 'c++']).withMessage('不支持的语言')
  ]),
  asyncHandler(async (req, res) => {
    const { code, language } = req.body;
    const testCases = [{ input: '', output: 'Hello World', is_hidden: false }];
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
  })
);

export default router;
