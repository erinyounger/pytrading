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
- ✅ 智能进程管理（重启时自动杀掉现有进程）
- ✅ 详细日志和错误提示

**高级用法：**

```bash
# 快速重启服务（先杀掉现有进程，再启动新服务）
python start.py --restart

# 仅启动后端服务
python start.py --service backend

# 仅启动前端服务
python start.py --service frontend

# 仅重启后端服务（先杀掉后端进程）
python start.py --restart --service backend

# 仅重启前端服务（先杀掉前端进程）
python start.py --restart --service frontend

# 跳过前端构建（快速启动，适用于开发环境）
python start.py --skip-build

# 跳过前端依赖安装
python start.py --no-deps

# 重新初始化 Python 虚拟环境
python start.py --init-venv

# 重新初始化前端依赖和构建
python start.py --init-frontend

# 重新初始化所有环境（虚拟环境 + 前端）
python start.py --init-all

# 组合使用
python start.py --service both --skip-build
```

启动后访问：
- **Web 界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/docs
- **API 健康检查**: http://localhost:8000/health

**热更新说明：**
- 前端修改会自动刷新浏览器
- 后端代码修改会自动重启服务器

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
2. **智能重启**: 自动检测并杀掉现有进程，避免端口冲突，支持快速重启
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
# 启动所有服务（后端 + 前端，默认快速重启模式）
python start.py

# 快速重启服务（先杀掉现有进程，再启动新服务）
python start.py --restart
```

#### 服务选择

```bash
# 仅启动后端服务
python start.py --service backend

# 仅启动前端服务
python start.py --service frontend

# 启动所有服务（默认）
python start.py --service both
```

#### 重启服务

```bash
# 重启所有服务（先杀掉现有进程）
python start.py --restart

# 仅重启后端服务
python start.py --restart --service backend

# 仅重启前端服务
python start.py --restart --service frontend
```

**重启功能说明：**
- 自动检测并杀掉占用端口 8000（后端）和 3000（前端）的进程
- 等待端口释放后再启动新服务，避免端口冲突
- 支持跨平台（Windows/Linux/Mac）

#### 初始化选项

```bash
# 重新初始化 Python 虚拟环境
python start.py --init-venv

# 重新初始化前端依赖和构建
python start.py --init-frontend

# 重新初始化所有环境（虚拟环境 + 前端）
python start.py --init-all
```

#### 快速启动选项

```bash
# 跳过前端构建（适用于开发环境，启动更快）
python start.py --skip-build

# 跳过前端依赖安装
python start.py --no-deps

# 组合使用：快速重启并跳过构建
python start.py --restart --skip-build
```

#### 查看帮助

```bash
# 查看所有可用选项
python start.py --help
```

### 四、系统设计
TODO...