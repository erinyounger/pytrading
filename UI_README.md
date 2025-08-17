# PyTrading Web UI 安装和启动指南

## 环境要求

### 后端要求
- Python 3.9+
- uv 包管理器 (推荐) 或 pip

### 前端要求  
- Node.js 16+
- npm 或 yarn

## 安装步骤

### 1. 安装后端依赖

```bash
# 使用 uv (推荐)
uv sync

# 或使用 pip
pip install -r requirements.txt
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
```

### 3. 配置环境变量

复制并编辑环境配置文件：

```bash
cp .env.example .env
```

在 `.env` 文件中配置：

```env
# 掘金量化配置
BACKTEST_STRATEGY_ID=your_backtest_strategy_id
LIVE_STRATEGY_ID=your_live_strategy_id
BACKTEST_TRADING_TOKEN=your_backtest_token
LIVE_TRADING_TOKEN=your_live_token
TRADING_MODE=backtest

# 数据库配置
SAVE_DB=true
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=pytrading


```

## 启动方式

### 方式一：使用启动脚本 (推荐)

```bash
# 查看帮助
python start_ui.py --help

# 启动后端服务
python start_ui.py --service backend

# 在新终端启动前端服务
python start_ui.py --service frontend
```

### 方式二：手动启动

**启动后端API服务：**

```bash
# 方法1: 使用uvicorn直接启动
uvicorn src.pytrading.api.main:app --host 0.0.0.0 --port 8000 --reload

# 方法2: 运行Python文件
python src/pytrading/api/main.py
```

**启动前端服务：**

```bash
cd frontend
npm start
```

## 访问地址

- **前端界面**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs

## 功能特性

### 📊 仪表板
- 策略收益率统计
- 实时性能指标展示
- 最佳/最差表现分析
- 收益率对比图表

### 📈 回测结果
- 回测数据表格展示
- 多维度筛选和排序
- 详细回测报告查看
- 数据导出功能

### ⚙️ 策略管理
- 可用策略列表
- 新建回测任务
- 任务状态监控
- 策略参数配置

### 📡 实时监控
- 实时价格和持仓监控
- 策略运行状态管理
- 盈亏实时统计
- 系统状态监控

### 🔧 系统设置
- 交易模式配置
- 数据库设置
- 股票池管理
- API配置管理

## 技术架构

### 后端技术栈
- **FastAPI**: 现代Python Web框架
- **SQLAlchemy**: 数据库ORM
- **Pydantic**: 数据验证
- **uvicorn**: ASGI服务器

### 前端技术栈
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全
- **Ant Design**: UI组件库
- **Chart.js**: 图表库
- **Axios**: HTTP客户端

### 设计特点
- 🎨 现代化Material Design风格
- 📱 响应式设计，支持移动端
- ⚡ 实时数据更新
- 🔒 类型安全的API接口
- 📊 丰富的数据可视化

## 故障排除

### 后端启动问题

1. **端口被占用**
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python依赖问题**
   ```bash
   # 重新安装依赖
   uv sync --reinstall
   ```

### 前端启动问题

1. **Node.js版本过低**
   ```bash
   node --version  # 确保 >= 16.0.0
   ```

2. **依赖安装失败**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **端口冲突**
   ```bash
   # 修改package.json中的启动端口
   "start": "PORT=3001 react-scripts start"
   ```

## 开发说明

### 添加新的API接口

1. 在 `src/pytrading/api/main.py` 中添加路由
2. 在 `src/pytrading/api/models.py` 中定义数据模型
3. 在前端 `src/services/api.ts` 中添加对应的API调用

### 添加新的页面

1. 在 `src/pages/` 中创建新的React组件
2. 在 `src/App.tsx` 中添加路由配置
3. 在侧边栏菜单中添加导航项

## 注意事项

⚠️ **重要提醒**

1. **实盘交易**: 实盘模式下请谨慎操作，建议先在回测模式下充分测试
2. **数据安全**: 请妥善保管API Token和数据库密码
3. **性能优化**: 大量数据时建议启用数据库分页和缓存
4. **网络安全**: 生产环境下请配置HTTPS和防火墙规则

## 更新日志

### v1.0.0 (2025-08-16)
- ✨ 初始版本发布
- 🎨 现代化Web界面
- 📊 完整的数据可视化
- ⚙️ 策略管理和监控功能
- 🔧 系统配置管理