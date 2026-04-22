// 调试端口占用问题的脚本
const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.once('close', () => resolve(false))
          .close();
      })
      .listen(port);
  });
}

async function findProcessUsingPort(port) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);

  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.split('\n');
    const listeningLine = lines.find(line => line.includes('LISTENING'));
    if (listeningLine) {
      const pid = listeningLine.trim().split(/\s+/)[4];
      return pid;
    }
  } catch (e) {
    console.log(`无法找到使用端口 ${port} 的进程`);
  }
  return null;
}

async function main() {
  const port = 3000;
  console.log(`检查端口 ${port} 是否被占用...`);

  const isPortAvailable = await checkPort(port);
  if (isPortAvailable) {
    console.log(`端口 ${port} 可用`);
  } else {
    console.log(`端口 ${port} 被占用`);
    const pid = await findProcessUsingPort(port);
    if (pid) {
      console.log(`进程 PID: ${pid} 正在使用端口 ${port}`);
      console.log(`请使用以下命令关闭进程:`);
      console.log(`taskkill //F //PID ${pid}`);
    }
  }
}

main();