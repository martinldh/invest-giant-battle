# Invest Giant Battle - AI投资大师辩论助手

基于 [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) 开源项目构建的前端应用，让12位传奇投资大师围绕任意股票展开实时AI辩论。

## 快速开始

### 1. 安装依赖

```bash
cd "Invest Giant Battle"
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key
```

### 3. 启动后端服务

```bash
python server.py
```

后端将在 http://localhost:8000 启动

### 4. 启动前端服务

```bash
python -m http.server 8080
```

前端将在 http://localhost:8080 启动

### 5. 访问应用

打开浏览器访问 http://localhost:8080

## 使用说明

### 后端连接状态

页面顶部会显示后端连接状态：
- ✅ **后端已连接（AI动态评论模式）** - 支持任意股票/ETF代码
- ⚠️ **后端未启动（静态演示模式）** - 仅支持预设的6个标的

### 发起辩论

1. 在输入框中输入股票代码（如 `AAPL`、`TSLA`、`NVDA`）
2. 点击"发起大师辩论"按钮
3. 等待实时股价数据加载
4. 观看12位大师基于当前数据生成的AI评论
5. 查看三行布局的辩论结果（看多/看空/持有）

## 配置说明

### 股价数据源

支持四种数据提供商，按优先级自动降级：

| 提供商 | 免费额度 | API Key | 说明 |
|---|---|---|---|
| `twelvedata` | 800次/天 | [免费申请](https://twelvedata.com/pricing) | **推荐**，数据最准确 |
| `alphavantage` | 25次/天 | [免费申请](https://www.alphavantage.co/support/#api-key) | 支持全球市场 |
| `finnhub` | 60次/分钟 | [免费申请](https://finnhub.io/register) | 响应速度快 |
| `yahoo` | 无限制 | 不需要 | 备选，但常被限流 |

默认使用 `twelvedata`，使用 `demo` key 即可测试。正式使用建议申请免费 API Key。

### CORS 配置

开发环境使用 `CORS_ORIGINS=*` 允许所有来源。

生产环境建议设置为具体域名：
```env
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### LLM 重试机制

内置指数退避重试策略，默认重试 3 次，延迟时间依次为 1s、2s、4s：
```env
LLM_MAX_RETRIES=3
LLM_RETRY_BASE_DELAY=1.0
```

### 行情缓存

后端会对同一标的的行情数据做短时内存缓存，默认 300 秒，减少免费行情 API 的消耗：
```env
STOCK_CACHE_TTL_SECONDS=300
```

### 大师配置

12 位投资大师的资料统一维护在 `masters.json`。前端用于头像、流派和图鉴展示；后端用于人格提示词生成。新增或修改大师时优先改这个文件，避免前后端配置不一致。

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript（模块化拆分）
- **后端**: FastAPI (Python)
- **数据**: Yahoo Finance / Alpha Vantage / Finnhub
- **AI**: OpenAI API / DeepSeek API (兼容 OpenAI 接口)
- **流式传输**: Server-Sent Events (SSE)

## 项目结构

```
Invest Giant Battle/
├── .env / .env.example      # 环境配置
├── requirements.txt         # Python 依赖
├── server.py                # FastAPI 后端
├── masters.json             # 前后端共享的大师配置
├── index.html               # 前端入口
├── style.css                # 样式文件
├── app.js                   # 前端逻辑
├── images/                  # 投资大师头像
└── README.md                # 项目文档
```

## 致谢

- 底层框架参考 [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) 开源项目
- 股价数据来自 [Yahoo Finance](https://finance.yahoo.com/) / [Alpha Vantage](https://www.alphavantage.co/) / [Finnhub](https://finnhub.io/)

## 免责声明

本工具仅用于学习和思路参考，不构成任何投资建议。投资有风险，入市需谨慎。
