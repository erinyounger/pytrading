# API文档概览

## 概述

xTrading系统提供RESTful API和WebSocket API，支持第三方集成和外部系统对接。本文档详细介绍API设计规范、认证授权机制和所有可用的端点。

## API设计原则

### 1. RESTful设计
- **资源导向**：URL表示资源，操作通过HTTP方法表示
- **无状态**：每个请求都包含完整信息
- **统一接口**：使用标准的HTTP方法
- **可缓存**：响应包含缓存控制信息

### 2. 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2026-01-19T10:00:00Z",
  "request_id": "req_123456789"
}
```

### 3. 错误处理
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2026-01-19T10:00:00Z",
  "request_id": "req_123456789"
}
```

## 认证和授权

### 1. Bearer Token认证
```http
Authorization: Bearer <access_token>
```

### 2. API Key认证
```http
X-API-Key: <api_key>
```

### 3. 刷新令牌
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

响应：
```json
{
  "access_token": "<new_access_token>",
  "token_type": "Bearer",
  "expires_in": 1800
}
```

## 版本控制

### URL版本控制
- v1: `/api/v1/...`
- v2: `/api/v2/...`

### API版本兼容性
- 6个月维护期
- 提前3个月通知弃用
- 提供迁移指南

## 数据格式

### 1. 日期时间格式
- ISO 8601格式：`2026-01-19T10:00:00Z`
- 时区：UTC
- 响应格式：`"2026-01-19T18:00:00+08:00"`

### 2. 数值精度
- 价格：保留4位小数
- 数量：保留4位小数
- 金额：保留2位小数
- 百分比：保留2位小数

### 3. 分页参数
```http
GET /api/v1/strategies?page=1&per_page=20&sort_by=created_at&sort_order=desc
```

响应：
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2026-01-19T10:00:00Z"
}
```

### 4. 过滤参数
```http
GET /api/v1/backtests?status=completed&strategy_type=trend&start_date=2025-01-01&end_date=2025-12-31
```

## HTTP状态码

### 成功响应
- `200 OK`：请求成功
- `201 Created`：资源创建成功
- `204 No Content`：删除成功

### 客户端错误
- `400 Bad Request`：请求参数错误
- `401 Unauthorized`：未认证
- `403 Forbidden`：权限不足
- `404 Not Found`：资源不存在
- `409 Conflict`：资源冲突
- `422 Unprocessable Entity`：实体无法处理
- `429 Too Many Requests`：请求限流

### 服务器错误
- `500 Internal Server Error`：服务器内部错误
- `502 Bad Gateway`：网关错误
- `503 Service Unavailable`：服务不可用

## 速率限制

### 默认限制
- 认证用户：1000请求/小时
- 未认证用户：100请求/小时
- API Key：10000请求/小时

### 响应头
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Type: user
```

## 缓存控制

### 缓存策略
- GET请求默认可缓存
- 响应头包含ETag
- 支持If-None-Match条件请求

### 缓存头
```http
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Cache-Control: public, max-age=300
Last-Modified: Mon, 19 Jan 2026 10:00:00 GMT
```

## WebSocket API

### 认证
```javascript
// 连接时提供认证令牌
const ws = new WebSocket('wss://api.xtrading.com/ws?token=<access_token>');
```

### 消息格式
```json
{
  "type": "subscribe",
  "channel": "market_data",
  "data": {
    "symbols": ["SHSE.600000", "SHSE.600036"]
  }
}
```

### 订阅频道
- `market_data`：市场数据
- `backtest_progress`：回测进度
- `trading_signals`：交易信号
- `notifications`：系统通知

## API测试

### Postman集合
```json
{
  "info": {
    "name": "xTrading API",
    "description": "xTrading量化交易系统API集合"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  }
}
```

### cURL示例
```bash
# 获取访问令牌
curl -X POST https://api.xtrading.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# 使用令牌访问API
curl -X GET https://api.xtrading.com/api/v1/strategies \
  -H "Authorization: Bearer <access_token>"
```

## SDK和客户端库

### Python SDK
```python
from xtrading import Client

client = Client(
    base_url="https://api.xtrading.com",
    access_token="your_access_token"
)

# 获取策略列表
strategies = client.strategies.list()

# 创建回测任务
backtest = client.backtests.create(
    strategy_id="str_123",
    symbols=["SHSE.600000", "SHSE.600036"],
    start_time="2025-01-01",
    end_time="2025-12-31"
)
```

### JavaScript SDK
```javascript
import { XTradingClient } from '@xtrading/sdk';

const client = new XTradingClient({
  baseURL: 'https://api.xtrading.com',
  accessToken: 'your_access_token'
});

// 获取策略列表
const strategies = await client.strategies.list();

// 订阅市场数据
client.marketData.subscribe(['SHSE.600000'], (data) => {
  console.log('Market data:', data);
});
```

## API变更日志

### v2.0.0 (2026-01-19)
- ✨ 新增API Key认证
- ✨ 新增WebSocket API
- ✨ 新增批量操作端点
- 🔧 优化分页参数
- 🔧 改进错误响应格式

### v1.0.0 (初始版本)
- 📚 基础API功能
- 📚 用户管理
- 📚 策略管理
- 📚 回测功能

## 开发者资源

### API文档
- [OpenAPI规范](https://api.xtrading.com/openapi.json)
- [Swagger UI](https://api.xtrading.com/docs)

### 支持
- 邮箱：api-support@xtrading.com
- 文档：https://docs.xtrading.com
- 状态页：https://status.xtrading.com

### 社区
- GitHub：https://github.com/xtrading/api
- Discord：https://discord.gg/xtrading
- 论坛：https://community.xtrading.com
