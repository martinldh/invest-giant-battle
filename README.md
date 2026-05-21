# Invest Giant Battle — AI 投资大师辩论助手

<p>
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/python-3.11+-blue" alt="Python">
  <img src="https://img.shields.io/badge/frontend-vanilla%20JS-orange" alt="Frontend">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

让 **12 位传奇投资大师** 围绕任意股票/ETF 实时 AI 辩论，生成看多、看空、持有三面观点。

---

## 近期更新 (v2.0.1)

| 更新 | 说明 |
|------|------|
| 🇭🇰 **港股支持** | 支持香港股票代码（`0700.HK` / `09992`）及中文名称查询（如 `拼多多` → `PDD`） |
| 💾 **辩论缓存** | 盘后自动缓存指定标的辩论结果，减少重复 API 消耗 |
| 🔁 **自动重试** | 单卡 AI 观点超时自动重试，支持手动点击重试 |
| 🛡️ **JSON 防泄漏** | 多层过滤机制（前端 + 后端），杜绝原始 JSON 泄漏到用户界面 |
| ❄️ **冷启动容错** | Render 冷启动时自动降级等待，不阻塞页面加载 |
| ⏱ **性能监控** | 新增 Playwright 性能检测 & 辩论流耗时分析脚本 |

---

## 快速开始

```bash
# 1. 安装依赖
cd "Invest Giant Battle"
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key

# 3. 启动后端 (FastAPI)
python server.py    # http://localhost:8000

# 4. 启动前端 (静态文件服务器)
python -m http.server 8080    # http://localhost:8080
```

---

## 使用说明

### 后端连接状态

页面顶部实时显示后端连接状态：
- ✅ **已连接（AI 动态评论模式）** — 支持任意股票/ETF 代码
- ⚠️ **未启动（静态演示模式）** — 仅支持预设 6 个标的

### 发起辩论

1. 输入股票代码（如 `AAPL`、`TSLA`、`0700.HK`、`拼多多`）
2. 点击 **「发起大师辩论」**
3. 等待实时股价加载 → 12 位大师逐一亮相
4. 查看 **看多 / 看空 / 持有** 三行布局的辩论结果

### 单卡重试

如某位大师观点生成超时，卡片会显示 **「重试」** 按钮，点击后单独重试该大师的观点，无需重新发起整场辩论。

---

## 配置说明

### 股价数据源

四种数据提供商，按优先级自动降级：

| 提供商 | 免费额度 | API Key | 说明 |
|---|---|---|---|
| `twelvedata` | 800 次/天 | [免费申请](https://twelvedata.com/pricing) | **推荐**，数据最准确 |
| `alphavantage` | 25 次/天 | [免费申请](https://www.alphavantage.co/support/#api-key) | 支持全球市场 |
| `finnhub` | 60 次/分钟 | [免费申请](https://finnhub.io/register) | 响应速度快 |
| `yahoo` | 无限制 | 不需要 | 备选，但常被限流 |

默认使用 `twelvedata`，`demo` key 即可测试。

### 环境变量

```env
# LLM API
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# 股价数据商 API Key
TWELVEDATA_API_KEY=demo
ALPHAVANTAGE_API_KEY=
FINNHUB_API_KEY=

# CORS（开发环境用 *）
CORS_ORIGINS=*

# LLM 重试（指数退避）
LLM_MAX_RETRIES=3
LLM_RETRY_BASE_DELAY=1.0

# 行情缓存（秒）
STOCK_CACHE_TTL_SECONDS=300
```

### 港股特殊配置

港股代码支持两种格式：
- **后缀式**: `0700.HK`、`0005.HK`
- **数字直输**: `09992`（自动补全为港股）

中文名称查询自动映射到对应美股代码（如 `拼多多` → `PDD`）。

---

## 项目结构

```
Invest Giant Battle/
├── .env / .env.example       # 环境配置
├── requirements.txt          # Python 依赖
│
├── server.py                 # FastAPI 后端（辩论缓存、港股解析、健康检查）
├── masters.json              # 前后端共享的 12 位大师配置
│
├── index.html                # 前端入口
├── style.css                 # 样式文件
├── app.js                    # 前端逻辑（自动重试、数据源降级、缓存检测）
│
├── images/                   # 投资大师头像
│
├── perf_check_online.js      # [测试] Playwright 性能检测（DOM / 接口 / 辩论流）
├── perf_debate_breakdown.js  # [测试] 辩论流耗时拆分 & 事件计数
└── verify_online_after_kimi.js # [测试] 端到端功能验证脚本
```

---

## 性能监控工具

项目提供了 3 个 Node.js 脚本用于线上环境的质量保障：

| 脚本 | 用途 | 运行方式 |
|------|------|----------|
| `perf_check_online.js` | Playwright 测量页面加载耗时、后端健康检查延迟、辩论流首帧/完成时间 | `node perf_check_online.js` |
| `perf_debate_breakdown.js` | 直接请求辩论 SSE 流，统计各事件类型数量及关键耗时节点 | `node perf_debate_breakdown.js` |
| `verify_online_after_kimi.js` | Playwright 端到端验证：输入代码 → 点击辩论 → 等待结果全流程 | `node verify_online_after_kimi.js` |

> 依赖: `npm install playwright`

---

## 技术栈

- **前端**: HTML5 + CSS3 + Vanilla JavaScript（模块化拆分）
- **后端**: FastAPI (Python 3.11+)
- **股价数据**: Twelve Data / Alpha Vantage / Finnhub / Yahoo Finance
- **AI 模型**: OpenAI API / DeepSeek API（兼容 OpenAI 接口）
- **流式传输**: Server-Sent Events (SSE)
- **测试工具**: Playwright

---

## 致谢 & 免责声明

- 底层框架参考 [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) 开源项目
- 股价数据来自 [Twelve Data](https://twelvedata.com/) / [Alpha Vantage](https://www.alphavantage.co/) / [Finnhub](https://finnhub.io/) / [Yahoo Finance](https://finance.yahoo.com/)

**本工具仅用于学习和思路参考，不构成任何投资建议。投资有风险，入市需谨慎。**
