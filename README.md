# PyTrading 量化交易系统
Stock Trading By Python, Based on [掘金量化](https://www.myquant.cn/).  

### 一. 快速开始

#### 🚀 一键启动（推荐）

**Windows 用户:**
```cmd
start.bat
```

**Linux/Mac 用户:**
```bash
./start.sh
```

**Python 启动:**
```bash
python start.py
```

**一键启动功能特性：**
- ✅ 自动创建和管理 Python 虚拟环境（.venv）
- ✅ 自动同步 Python 依赖（使用 uv sync）
- ✅ 自动构建前端应用（npm run build）
- ✅ 支持热更新开发模式
- ✅ 智能任务调度（5秒间隔检查）
- ✅ 详细日志和错误提示

**启动方式：**

```bash
# 默认方式：后台运行（推荐）
python start.py

# 重启服务：杀掉现有进程并启动新服务（支持热加载）
python start.py --restart

# 初始化环境：安装venv、前后端依赖，构建前端
python start.py --init-all
```

启动后访问：
- **Web 界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/docs
- **API 健康检查**: http://localhost:8000/health

**热更新说明：**
- 前端修改会自动刷新浏览器
- 后端代码修改会自动重启服务器

**任务调度：**
- 系统每5秒自动检查待执行的回测任务
- 无需手动操作，任务会自动开始执行

#### 传统启动方式

1. 安装[掘金量化3.0](https://www.myquant.cn/docs/guide/35)
2. 安装依赖
```shell
pip install -r requirements.txt
```
3. 修改配置文件（使用 .env 文件或 config/settings.py）
```python
# 交易模式: backtest 或 live
TRADING_MODE = 'backtest'

# 掘金 API 配置
BACKTEST_STRATEGY_ID = 'your-backtest-strategy-id'
LIVE_STRATEGY_ID = 'your-live-strategy-id'
BACKTEST_TRADING_TOKEN = 'your-backtest-token'
LIVE_TRADING_TOKEN = 'your-live-token'
```

4. 执行策略
```shell
python run.py
```

### 二、功能介绍

1. **一键启动**: 跨平台启动脚本，自动检测环境、安装依赖、启动服务
2. **后台运行**: 服务默认在后台运行，无需用户交互，任务自动调度
3. **掘金 3.0 集成**: 统一执行框架，策略编写与执行分离
4. **并行回测**: 多股票策略并行回测，提高效率
5. **数据库存储**: 回测结果自动保存到 MySQL 数据库
6. **Web 界面**: 现代化 React UI，可视化管理回测和交易
7. **API 文档**: FastAPI 自动生成 API 文档
8. **策略解耦**: 策略与资金管理分离，支持扩展
9. **安全交易**: 脱离掘金 GUI，策略执行更安全

### 三、启动选项

#### 基本启动

```bash
# 启动所有服务（后端 + 前端，默认后台模式）
python start.py

# 重启服务（杀掉现有进程并启动新服务，支持热加载）
python start.py --restart

# 初始化环境（安装venv、前后端依赖，构建前端）
python start.py --init-all
```

#### 重启功能说明

- **自动检测并杀掉**占用端口 8000（后端）和 3000（前端）的进程
- **等待端口释放**后再启动新服务，避免端口冲突
- **重启后服务继续在后台运行**
- **支持热加载**：前后端代码修改会自动重启
- **跨平台支持**（Windows/Linux/Mac）

#### 初始化功能说明

- **重新创建虚拟环境**：删除现有的.venv并重新创建
- **安装前后端依赖**：使用uv sync同步Python依赖，npm install安装前端依赖
- **构建前端应用**：执行npm run build构建生产版本
- **一站式初始化**：一个命令完成所有环境配置

#### 查看帮助

```bash
# 查看所有可用选项
python start.py --help
```

### 四、系统设计
TODO...