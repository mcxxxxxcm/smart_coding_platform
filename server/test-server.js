const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 测试健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 测试 AI 接口
app.post('/api/ai/chat', (req, res) => {
  console.log('收到 AI 聊天请求:', req.body);

  // 模拟 AI 响应
  const mockResponse = {
    success: true,
    data: {
      response: '这是一个测试响应。如果您看到这个消息，说明 API 接口正常工作。'
    }
  };

  res.json(mockResponse);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`AI 测试接口: http://localhost:${PORT}/api/ai/chat`);
});