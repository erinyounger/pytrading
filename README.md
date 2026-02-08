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

启动后访问：
- **Web 界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/docs

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
2. **掘金 3.0 集成**: 统一执行框架，策略编写与执行分离
3. **并行回测**: 多股票策略并行回测，提高效率
4. **数据库存储**: 回测结果自动保存到 MySQL 数据库
5. **Web 界面**: 现代化 React UI，可视化管理回测和交易
6. **API 文档**: FastAPI 自动生成 API 文档
7. **策略解耦**: 策略与资金管理分离，支持扩展
8. **安全交易**: 脱离掘金 GUI，策略执行更安全

### 三、启动选项

```bash
# 启动所有服务（后端 + 前端）
python start.py

# 仅启动后端
python start.py --service backend

# 仅启动前端
python start.py --service frontend

# 跳过前端依赖安装
python start.py --no-deps

# 查看帮助
python start.py --help
```

### 四、系统设计
TODO...