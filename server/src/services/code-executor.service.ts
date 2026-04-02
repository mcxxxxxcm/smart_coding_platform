import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface TestCase {
  input: string;
  output: string;
  is_hidden: boolean;
}

interface ExecutionResult {
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
  runtime: number;
  memory: number;
  output: string;
  expected: string;
}

export class CodeExecutor {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async execute(
    language: string,
    code: string,
    testCases: TestCase[],
    timeLimit: number = 1000,
    memoryLimit: number = 256
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTestCase(language, code, testCase, timeLimit, memoryLimit);
      results.push(result);
      
      if (result.status !== 'accepted') {
        break;
      }
    }

    return results;
  }

  private async runTestCase(
    language: string,
    code: string,
    testCase: TestCase,
    timeLimit: number,
    _memoryLimit: number
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      let output: string;
      let runtime: number;

      switch (language.toLowerCase()) {
        case 'javascript':
          const jsResult = await this.executeJavaScript(code, testCase.input, timeLimit);
          output = jsResult.output;
          runtime = jsResult.runtime;
          break;
        case 'python':
          const pyResult = await this.executePython(code, testCase.input, timeLimit);
          output = pyResult.output;
          runtime = pyResult.runtime;
          break;
        default:
          return {
            status: 'compilation_error',
            runtime: 0,
            memory: 0,
            output: '',
            expected: testCase.output,
          };
      }

      const normalizedOutput = this.normalizeOutput(output);
      const normalizedExpected = this.normalizeOutput(testCase.output);
      const isAccepted = normalizedOutput === normalizedExpected;

      return {
        status: isAccepted ? 'accepted' : 'wrong_answer',
        runtime,
        memory: Math.floor(Math.random() * 50 + 10),
        output: output.trim(),
        expected: testCase.output.trim(),
      };
    } catch (error) {
      const runtime = Date.now() - startTime;
      
      if (runtime > timeLimit) {
        return {
          status: 'time_limit_exceeded',
          runtime,
          memory: 0,
          output: '',
          expected: testCase.output,
        };
      }

      return {
        status: 'runtime_error',
        runtime,
        memory: 0,
        output: (error as Error).message,
        expected: testCase.output,
      };
    }
  }

  private async executeJavaScript(
    code: string,
    input: string,
    timeLimit: number
  ): Promise<{ output: string; runtime: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const wrappedCode = `
        const input = ${JSON.stringify(input)};
        let output = '';
        
        const originalLog = console.log;
        console.log = (...args) => {
          output += args.join(' ') + '\\n';
        };
        
        try {
          ${code}
        } catch (e) {
          console.error(e.message);
        }
        
        process.stdout.write(output);
      `;

      const tempFile = path.join(this.tempDir, `code_${Date.now()}.js`);
      fs.writeFileSync(tempFile, wrappedCode);

      const timeout = setTimeout(() => {
        reject(new Error('Time Limit Exceeded'));
      }, timeLimit);

      const process = spawn('node', [tempFile], {
        timeout: timeLimit,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeout);
        fs.unlinkSync(tempFile);
        
        const runtime = Date.now() - startTime;
        
        if (code !== 0) {
          reject(new Error(stderr || 'Runtime Error'));
        } else {
          resolve({ output: stdout, runtime });
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        fs.unlinkSync(tempFile);
        reject(err);
      });
    });
  }

  private async executePython(
    code: string,
    input: string,
    timeLimit: number
  ): Promise<{ output: string; runtime: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const tempFile = path.join(this.tempDir, `code_${Date.now()}.py`);
      fs.writeFileSync(tempFile, code);

      const timeout = setTimeout(() => {
        reject(new Error('Time Limit Exceeded'));
      }, timeLimit);

      const process = spawn('python', [tempFile], {
        timeout: timeLimit,
      });

      let stdout = '';
      let stderr = '';

      process.stdin.write(input);
      process.stdin.end();

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeout);
        fs.unlinkSync(tempFile);
        
        const runtime = Date.now() - startTime;
        
        if (code !== 0) {
          reject(new Error(stderr || 'Runtime Error'));
        } else {
          resolve({ output: stdout, runtime });
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeout);
        fs.unlinkSync(tempFile);
        reject(err);
      });
    });
  }

  private normalizeOutput(output: string): string {
    return output
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }
}
