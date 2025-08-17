# PyTrading 量化交易系统
Stock Trading By Python, Based on [掘金量化](https://www.myquant.cn/).  

### 一. 快速开始  

1. 安装[掘金量化3.0](https://www.myquant.cn/docs/guide/35) 
2. 安装依赖
```shell
pip install -r requirements.txt
```
3. 修改pytrading/config.py中账号信息
```python
# ------------------------ 账号设置信息 ----------------------
# 交易模式
TRADING_MODE = MODE_BACKTEST
# TRADING_MODE = MODE_LIVE

# 使用的策略ID
BACKTEST_STRATEGY_ID = '010bc4d9-8b43-11ed-8710-XXXXXX'
LIVE_STRATEGY_ID = '28de0f36-7d4f-11ed-a603-XXXXXX'

STRATEGY_ID = LIVE_STRATEGY_ID if TRADING_MODE == MODE_LIVE else BACKTEST_STRATEGY_ID
# Windows客户端连接TOKEN
TOKEN = '2cc0e5XXXXXX'
# 竞赛交易实盘账号
ACCOUNT_ID_LIVE = "75dddca9-52e8-11ed-a31f-00163e12c161"
```

5. 执行策略
```shell
python run.py
```

### 二、功能介绍 
1. 对接掘金3.0，统一执行框架，策略编写与策略执行分离； 
2. 并行回测，同一个策略在股票列表并行回测； 
3. 回测结果保存MySQL数据库； 
4. 脱离掘金GUI界面编写策略，确保策略安全； 
5. 量化策略、资金管理解耦，可继续扩展更复杂的方案；
### 三、系统设计  
TODO...