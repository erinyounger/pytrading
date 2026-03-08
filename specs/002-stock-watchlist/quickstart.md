# 快速开始: 股票关注列表

**功能**: 002-stock-watchlist | **日期**: 2026-03-07

## 前置条件

- Python >= 3.11，已安装 uv
- Node.js，已安装 npm
- MySQL 运行中，已执行 `sql/backtest_management_schema.sql`
- `.env` 已配置 MySQL 连接信息

## 数据库迁移

```bash
# 执行新增表的 DDL
mysql -u root -p pytrading < sql/watchlist_schema.sql
```

## 后端启动

```bash
cd /home/eeric/code/pytrading
uv run python -m pytrading.api.main
# API 启动在 http://localhost:8000
```

## 前端启动

```bash
cd /home/eeric/code/pytrading/frontend
npm install
npm start
# 前端启动在 http://localhost:3000
```

## 验证步骤

### 1. 添加关注

```bash
# 添加一支股票到关注列表
curl -X POST http://localhost:8000/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"symbol": "SZSE.002459", "name": "晶澳科技", "strategy_id": 1}'
```

### 2. 查看关注列表

```bash
# 获取全部关注列表
curl http://localhost:8000/api/watchlist

# 按收益率排序
curl "http://localhost:8000/api/watchlist?sort_by=pnl_ratio&sort_order=desc"

# 筛选关注类型
curl "http://localhost:8000/api/watchlist?watch_type=趋势上涨"
```

### 3. 触发回测

```bash
# 对关注列表中所有股票执行回测
curl -X POST http://localhost:8000/api/watchlist/backtest
```

### 4. 标记已读

```bash
# 标记关注类型变化已读
curl -X PUT http://localhost:8000/api/watchlist/1/read
```

### 5. 取消关注

```bash
# 从关注列表移除
curl -X DELETE http://localhost:8000/api/watchlist/1
```

## 前端验证

1. 打开 http://localhost:3000
2. 侧边栏应出现"关注列表"菜单项
3. 进入"回测结果"页面 → 任意股票行应出现"关注"按钮
4. 点击"关注" → 按钮变为"已关注"
5. 进入"关注列表"页面 → 已关注股票出现在列表中
6. 点击"立即回测" → 按钮禁用，显示进度
7. 回测完成后 → 指标更新，关注类型变化的行高亮显示

## 运行测试

```bash
# 后端测试
cd /home/eeric/code/pytrading
uv run pytest tests/ -v --cov=src/pytrading

# 前端测试
cd /home/eeric/code/pytrading/frontend
npm test -- --coverage
```
