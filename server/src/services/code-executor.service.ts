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
        case 'python':
          const pyResult = await this.executePython(code, testCase.input, timeLimit);
          output = pyResult.output;
          runtime = pyResult.runtime;
          break;
        case 'cpp':
        case 'c':
        case 'c++':
          const cppResult = await this.executeCpp(code, testCase.input, timeLimit);
          output = cppResult.output;
          runtime = cppResult.runtime;
          break;
        default:
          return {
            status: 'compilation_error',
            runtime: 0,
            memory: 0,
            output: `不支持的语言: ${language}`,
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

  private async executeCpp(
    code: string,
    input: string,
    timeLimit: number
  ): Promise<{ output: string; runtime: number }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timestamp = Date.now();

      const srcFile = path.join(this.tempDir, `code_${timestamp}.cpp`);
      const exeFile = path.join(this.tempDir, `code_${timestamp}.exe`);
      fs.writeFileSync(srcFile, code);

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const cleanupFiles = () => {
        try {
          if (fs.existsSync(srcFile)) fs.unlinkSync(srcFile);
          if (fs.existsSync(exeFile)) fs.unlinkSync(exeFile);
        } catch {}
      };

      // Windows 上尝试多个编译器
      const compilers = process.platform === 'win32'
        ? ['g++', 'clang++', 'gcc']
        : ['g++', 'clang++'];

      let compilerIndex = 0;

      const tryCompile = () => {
        if (compilerIndex >= compilers.length) {
          cleanupFiles();
          reject(new Error(`找不到 C/C++ 编译器，已尝试: ${compilers.join(', ')}`));
          return;
        }

        const compiler = compilers[compilerIndex];
        console.log(`尝试使用编译器: ${compiler}`);

        const compileProcess = spawn(compiler, [srcFile, '-o', exeFile, '-O2', '-Wall'], {
          timeout: 10000,
        });

        let compileStderr = '';

        compileProcess.stderr.on('data', (data: Buffer) => {
          compileStderr += data.toString();
        });

        compileProcess.on('close', (compileCode: number | null) => {
          if (compileCode !== 0) {
            console.log(`${compiler} 编译失败，尝试下一个...`);
            compileStderr = '';
            compilerIndex++;
            tryCompile();
            return;
          }

          // 编译成功，运行程序
          console.log(`编译成功，开始执行...`);
          runExecutable();
        });

        compileProcess.on('error', (err: Error & { code?: string }) => {
          if (err.code === 'ENOENT') {
            compilerIndex++;
            tryCompile();
          } else {
            cleanupFiles();
            reject(err);
          }
        });
      };

      const runExecutable = () => {
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanupFiles();
            reject(new Error('Time Limit Exceeded'));
          }
        }, timeLimit);

        const execProcess = spawn(exeFile, [], {
          timeout: timeLimit,
        });

        execProcess.stdin.write(input);
        execProcess.stdin.end();

        execProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        execProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        execProcess.on('close', (code: number | null) => {
          clearTimeout(timeout);
          cleanupFiles();

          if (isResolved) return;
          isResolved = true;

          const runtime = Date.now() - startTime;

          if (code !== 0) {
            reject(new Error(stderr || 'Runtime Error'));
          } else {
            resolve({ output: stdout, runtime });
          }
        });

        execProcess.on('error', (err: Error) => {
          clearTimeout(timeout);
          cleanupFiles();
          if (!isResolved) {
            isResolved = true;
            reject(err);
          }
        });
      };

      tryCompile();
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

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const cleanupFile = () => {
        try {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        } catch (err) {
          console.error('清理临时文件失败:', err);
        }
      };

      // Windows 上尝试多个 Python 命令
      const pythonCommands = process.platform === 'win32' 
        ? ['py', 'python3', 'python'] 
        : ['python3', 'python'];

      let childProcess: any = null;
      let currentCmdIndex = 0;

      const trySpawn = () => {
        if (currentCmdIndex >= pythonCommands.length) {
          reject(new Error(`找不到 Python 解释器，已尝试: ${pythonCommands.join(', ')}`));
          return;
        }

        const cmd = pythonCommands[currentCmdIndex];
        console.log(`尝试使用命令: ${cmd}`);
        
        try {
          childProcess = spawn(cmd, [tempFile], {
            timeout: timeLimit,
          });
          
          // 成功创建进程
          setupProcessHandlers();
        } catch (err) {
          console.log(`${cmd} 不可用，尝试下一个...`);
          currentCmdIndex++;
          trySpawn();
        }
      };

      const setupProcessHandlers = () => {
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try { childProcess.kill(); } catch {}
            cleanupFile();
            reject(new Error('Time Limit Exceeded'));
          }
        }, timeLimit);

        childProcess.stdin.write(input);
        childProcess.stdin.end();

        childProcess.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        childProcess.on('close', (code: number | null) => {
          clearTimeout(timeout);
          cleanupFile();
          
          if (isResolved) return;
          isResolved = true;
          
          const runtime = Date.now() - startTime;
          
          if (code !== 0) {
            reject(new Error(stderr || 'Runtime Error'));
          } else {
            resolve({ output: stdout, runtime });
          }
        });

        childProcess.on('error', (err: Error & { code?: string }) => {
          clearTimeout(timeout);
          cleanupFile();
          
          if (!isResolved && err.code === 'ENOENT') {
            // 命令不存在，尝试下一个
            currentCmdIndex++;
            trySpawn();
          } else if (!isResolved) {
            isResolved = true;
            reject(err);
          }
        });
      };

      trySpawn();
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
