# 数据库设计

## 概述

本文档详细介绍了xTrading系统的数据库设计，包括关系型数据库（MySQL/PostgreSQL）、时序数据库（InfluxDB）和缓存数据库（Redis）的设计方案。

## 数据库选型

### 主数据库：PostgreSQL
- **选择理由**：功能强大、ACID支持完善、性能优秀
- **用途**：存储业务数据、用户信息、策略配置等
- **版本**：PostgreSQL 15+

### 时序数据库：InfluxDB
- **选择理由**：专业的时序数据处理、高压缩比、快速查询
- **用途**：存储行情数据、交易数据、性能指标等
- **版本**：InfluxDB 2.x

### 缓存数据库：Redis
- **选择理由**：高性能、丰富的数据结构、持久化支持
- **用途**：缓存、会话存储、实时数据、消息队列
- **版本**：Redis 7.x

## 关系型数据库设计

### 1. 用户服务数据库 (user_service)

#### 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('admin', 'trader', 'researcher', 'viewer');

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

#### 用户角色表 (user_roles)
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认角色
INSERT INTO user_roles (name, description, permissions) VALUES
('admin', '系统管理员', '["user:*", "strategy:*", "backtest:*", "trading:*"]'::jsonb),
('trader', '交易员', '["strategy:read", "strategy:execute", "backtest:read", "trading:execute"]'::jsonb),
('researcher', '研究员', '["strategy:read", "strategy:write", "backtest:read", "backtest:create"]'::jsonb),
('viewer', '观察员', '["strategy:read", "backtest:read"]'::jsonb);
```

#### 用户会话表 (user_sessions)
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

### 2. 策略服务数据库 (strategy_service)

#### 策略表 (strategies)
```sql
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    strategy_type strategy_type_enum NOT NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'python',
    source_code TEXT NOT NULL,
    compiled_code TEXT,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    status strategy_status_enum NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    fork_from_strategy_id UUID REFERENCES strategies(id),
    git_commit_hash VARCHAR(40),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE strategy_type_enum AS ENUM ('trend', 'mean_reversion', 'momentum', 'arbitrage', 'custom');
CREATE TYPE strategy_status_enum AS ENUM ('draft', 'testing', 'active', 'paused', 'archived', 'deleted');

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_type ON strategies(strategy_type);
CREATE INDEX idx_strategies_status ON strategies(status);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategies_created_at ON strategies(created_at);
```

#### 策略版本表 (strategy_versions)
```sql
CREATE TABLE strategy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    source_code TEXT NOT NULL,
    changes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(strategy_id, version_number)
);

CREATE INDEX idx_strategy_versions_strategy_id ON strategy_versions(strategy_id);
```

#### 策略性能表 (strategy_performances)
```sql
CREATE TABLE strategy_performances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    period_type performance_period_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_return DECIMAL(10, 4),
    annualized_return DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    sortino_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    win_rate DECIMAL(6, 4),
    profit_factor DECIMAL(10, 4),
    total_trades INTEGER,
    avg_trade_return DECIMAL(10, 4),
    volatility DECIMAL(10, 4),
    beta DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(strategy_id, period_type, start_date, end_date)
);

CREATE TYPE performance_period_enum AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom');

CREATE INDEX idx_strategy_performances_strategy_id ON strategy_performances(strategy_id);
CREATE INDEX idx_strategy_performances_period ON strategy_performances(period_type);
```

### 3. 回测服务数据库 (backtest_service)

#### 回测任务表 (backtest_tasks)
```sql
CREATE TABLE backtest_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_id UUID NOT NULL REFERENCES strategies(id),
    name VARCHAR(255),
    description TEXT,
    status backtest_status_enum NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority INTEGER NOT NULL DEFAULT 0,
    symbols JSONB NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_summary JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    resource_usage JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE backtest_status_enum AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled', 'timeout');

CREATE INDEX idx_backtest_tasks_user_id ON backtest_tasks(user_id);
CREATE INDEX idx_backtest_tasks_strategy_id ON backtest_tasks(strategy_id);
CREATE INDEX idx_backtest_tasks_status ON backtest_tasks(status);
CREATE INDEX idx_backtest_tasks_created_at ON backtest_tasks(created_at);
```

#### 回测结果表 (backtest_results)
```sql
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES backtest_tasks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    strategy_name VARCHAR(255) NOT NULL,
    backtest_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    backtest_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_capital DECIMAL(15, 2) NOT NULL DEFAULT 1000000.00,
    final_capital DECIMAL(15, 2),
    total_return DECIMAL(10, 4),
    annualized_return DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    sortino_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    max_drawdown_duration INTEGER,
    calmar_ratio DECIMAL(10, 4),
    win_rate DECIMAL(6, 4),
    profit_factor DECIMAL(10, 4),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    avg_trade_return DECIMAL(10, 4),
    avg_winning_trade DECIMAL(10, 4),
    avg_losing_trade DECIMAL(10, 4),
    largest_winning_trade DECIMAL(15, 2),
    largest_losing_trade DECIMAL(15, 2),
    volatility DECIMAL(10, 4),
    beta DECIMAL(10, 4),
    alpha DECIMAL(10, 4),
    information_ratio DECIMAL(10, 4),
    tracking_error DECIMAL(10, 4),
    treynor_ratio DECIMAL(10, 4),
    jensen_alpha DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backtest_results_task_id ON backtest_results(task_id);
CREATE INDEX idx_backtest_results_symbol ON backtest_results(symbol);
CREATE INDEX idx_backtest_results_strategy_name ON backtest_results(strategy_name);
CREATE INDEX idx_backtest_results_total_return ON backtest_results(total_return);
CREATE INDEX idx_backtest_results_sharpe_ratio ON backtest_results(sharpe_ratio);
```

#### 交易记录表 (trades)
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES backtest_tasks(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    trade_type trade_type_enum NOT NULL,
    side trade_side_enum NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    price DECIMAL(15, 4) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(10, 4) NOT NULL DEFAULT 0,
    execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
    strategy_signal JSONB,
    execution_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE trade_type_enum AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE trade_side_enum AS ENUM ('buy', 'sell');

CREATE INDEX idx_trades_task_id ON trades(task_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_execution_time ON trades(execution_time);
```

### 4. 交易服务数据库 (trading_service)

#### 交易信号表 (trading_signals)
```sql
CREATE TABLE trading_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id),
    symbol VARCHAR(20) NOT NULL,
    signal_type signal_type_enum NOT NULL,
    strength DECIMAL(4, 3) NOT NULL CHECK (strength >= 0 AND strength <= 1),
    price DECIMAL(15, 4) NOT NULL,
    quantity DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    take_profit DECIMAL(15, 4),
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE signal_type_enum AS ENUM ('buy', 'sell', 'hold', 'close');

CREATE INDEX idx_trading_signals_strategy_id ON trading_signals(strategy_id);
CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_trading_signals_signal_type ON trading_signals(signal_type);
CREATE INDEX idx_trading_signals_created_at ON trading_signals(created_at);
CREATE INDEX idx_trading_signals_is_processed ON trading_signals(is_processed);
```

#### 订单表 (orders)
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    strategy_id UUID NOT NULL REFERENCES strategies(id),
    signal_id UUID REFERENCES trading_signals(id),
    symbol VARCHAR(20) NOT NULL,
    order_type order_type_enum NOT NULL,
    side order_side_enum NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    price DECIMAL(15, 4),
    stop_price DECIMAL(15, 4),
    status order_status_enum NOT NULL DEFAULT 'pending',
    filled_quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
    avg_fill_price DECIMAL(15, 4),
    commission DECIMAL(10, 4) NOT NULL DEFAULT 0,
    time_in_force time_in_force_enum NOT NULL DEFAULT 'day',
    expire_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE order_type_enum AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE order_side_enum AS ENUM ('buy', 'sell');
CREATE TYPE order_status_enum AS ENUM ('pending', 'accepted', 'working', 'filled', 'partially_filled', 'cancelled', 'rejected', 'expired');
CREATE TYPE time_in_force_enum AS ENUM ('day', 'gtc', 'ioc', 'fok');

CREATE INDEX idx_orders_strategy_id ON orders(strategy_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

#### 持仓表 (positions)
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES strategies(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    avg_cost DECIMAL(15, 4) NOT NULL,
    market_value DECIMAL(15, 2),
    unrealized_pnl DECIMAL(15, 2),
    realized_pnl DECIMAL(15, 2) NOT NULL DEFAULT 0,
    last_price DECIMAL(15, 4),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(strategy_id, symbol)
);

CREATE INDEX idx_positions_strategy_id ON positions(strategy_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
```

### 5. 数据服务数据库 (data_service)

#### 股票代码表 (stock_symbols)
```sql
CREATE TABLE stock_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    market VARCHAR(10) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    lot_size INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    listed_date DATE,
    delisted_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_symbols_market ON stock_symbols(market);
CREATE INDEX idx_stock_symbols_exchange ON stock_symbols(exchange);
CREATE INDEX idx_stock_symbols_sector ON stock_symbols(sector);
CREATE INDEX idx_stock_symbols_is_active ON stock_symbols(is_active);
```

#### 指数成分股表 (index_constituents)
```sql
CREATE TABLE index_constituents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_symbol VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    weight DECIMAL(8, 4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(index_symbol, symbol, effective_date)
);

CREATE INDEX idx_index_constituents_index_symbol ON index_constituents(index_symbol);
CREATE INDEX idx_index_constituents_symbol ON index_constituents(symbol);
CREATE INDEX idx_index_constituents_effective_date ON index_constituents(effective_date);
```

## 时序数据库设计

### InfluxDB 数据模型

#### 行情数据 (market_data)
```influxdb
measurement: market_data
tags:
  - symbol: 股票代码
  - exchange: 交易所
fields:
  - open: float 开盘价
  - high: float 最高价
  - low: float 最低价
  - close: float 收盘价
  - volume: float 成交量
  - amount: float 成交额
  - turnover: float 换手率
time: 时间戳

# 示例查询
from(bucket: "trading_data")
  |> range(start: -30d)
  |> filter(fn: (r) => r._measurement == "market_data" and r.symbol == "SHSE.600000")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
```

#### 交易数据 (trades)
```influxdb
measurement: trades
tags:
  - symbol: 股票代码
  - strategy_id: 策略ID
  - trade_type: 交易类型
fields:
  - price: float 成交价格
  - quantity: float 成交量
  - amount: float 成交金额
  - pnl: float 盈亏
time: 成交时间
```

#### 性能指标 (performance_metrics)
```influxdb
measurement: performance_metrics
tags:
  - strategy_id: 策略ID
  - period: 统计周期
fields:
  - return: float 收益率
  - sharpe_ratio: float 夏普比率
  - max_drawdown: float 最大回撤
  - volatility: float 波动率
  - win_rate: float 胜率
time: 统计时间
```

## Redis 缓存设计

### 缓存键值约定
```python
CACHE_KEYS = {
    # 用户相关
    USER_INFO: "user:info:{user_id}",
    USER_TOKEN: "user:token:{token}",
    USER_PERMISSIONS: "user:permissions:{user_id}",
    USER_SESSION: "user:session:{session_id}",

    # 策略相关
    STRATEGY_LIST: "strategy:list:{user_id}",
    STRATEGY_INFO: "strategy:info:{strategy_id}",
    STRATEGY_CODE: "strategy:code:{strategy_id}",
    STRATEGY_PERFORMANCE: "strategy:perf:{strategy_id}",

    # 回测相关
    BACKTEST_TASK: "backtest:task:{task_id}",
    BACKTEST_RESULT: "backtest:result:{task_id}",
    BACKTEST_PROGRESS: "backtest:progress:{task_id}",
    BACKTEST_QUEUE: "backtest:queue",

    # 市场数据
    MARKET_DATA: "market:data:{symbol}:{timeframe}",
    INDEX_CONSTITUENTS: "index:constituents:{index_symbol}",
    REAL_TIME_QUOTE: "realtime:quote:{symbol}",
    KLINE_DATA: "kline:{symbol}:{timeframe}:{interval}",

    # 系统状态
    SYSTEM_STATUS: "system:status",
    ACTIVE_USERS: "system:active_users",
    SERVICE_HEALTH: "system:health:{service_name}",
}

# 缓存过期时间配置
CACHE_TTL = {
    USER_INFO: 3600,  # 1小时
    STRATEGY_LIST: 1800,  # 30分钟
    MARKET_DATA: 300,  # 5分钟
    REAL_TIME_QUOTE: 30,  # 30秒
    BACKTEST_PROGRESS: 60,  # 1分钟
}
```

### 缓存使用示例
```python
# Redis缓存管理器
class CacheManager:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def get_market_data(self, symbol: str, timeframe: str) -> Optional[pd.DataFrame]:
        """获取市场数据缓存"""
        key = CACHE_KEYS['MARKET_DATA'].format(symbol=symbol, timeframe=timeframe)
        data = await self.redis.get(key)
        if data:
            return pd.read_json(data)
        return None

    async def set_market_data(self, symbol: str, timeframe: str,
                              data: pd.DataFrame, expire: int = 300) -> None:
        """设置市场数据缓存"""
        key = CACHE_KEYS['MARKET_DATA'].format(symbol=symbol, timeframe=timeframe)
        await self.redis.setex(key, expire, data.to_json())

    async def get_backtest_progress(self, task_id: str) -> Optional[int]:
        """获取回测进度"""
        key = CACHE_KEYS['BACKTEST_PROGRESS'].format(task_id=task_id)
        progress = await self.redis.get(key)
        return int(progress) if progress else 0

    async def set_backtest_progress(self, task_id: str, progress: int) -> None:
        """设置回测进度"""
        key = CACHE_KEYS['BACKTEST_PROGRESS'].format(task_id=task_id)
        await self.redis.setex(key, CACHE_TTL['BACKTEST_PROGRESS'], str(progress))

    async def publish_real_time_data(self, symbol: str, data: dict) -> None:
        """发布实时数据"""
        channel = f"market:{symbol}"
        await self.redis.publish(channel, json.dumps(data))

    async def subscribe_real_time_data(self, symbol: str, callback: Callable) -> None:
        """订阅实时数据"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"market:{symbol}")

        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                await callback(data)
```

## 数据同步和备份

### 主从复制配置
```sql
-- PostgreSQL 主从复制配置
-- 主库配置 (postgresql.conf)
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64
hot_standby = on
max_standby_streaming_delay = 30s
wal_receiver_status_interval = 10s

-- 从库配置 (postgresql.conf)
hot_standby = on
max_standby_streaming_delay = 30s
wal_receiver_status_interval = 10s
```

### 备份策略
```bash
#!/bin/bash
# backup_database.sh

# PostgreSQL备份
pg_dump -h localhost -U pytrading -d pytrading \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="backup_$(date +%Y%m%d_%H%M%S).dump"

# InfluxDB备份
influx backup /path/to/backup \
    --bucket trading_data \
    --host localhost:8086

# Redis备份
redis-cli --rdb backup_$(date +%Y%m%d_%H%M%S).rdb
```

### 数据恢复
```bash
#!/bin/bash
# restore_database.sh

# PostgreSQL恢复
pg_restore --host localhost --username pytrading \
    --dbname pytrading \
    --verbose \
    backup_file.dump

# InfluxDB恢复
influx restore /path/to/backup \
    --bucket trading_data \
    --host localhost:8086

# Redis恢复
cp backup.rdb /var/lib/redis/dump.rdb
systemctl restart redis
```

## 性能优化

### 数据库索引优化
```sql
-- 复合索引优化查询性能
CREATE INDEX CONCURRENTLY idx_backtest_results_composite
ON backtest_results (strategy_id, backtest_start_time, backtest_end_time, total_return DESC);

-- 部分索引优化
CREATE INDEX CONCURRENTLY idx_active_strategies
ON strategies (user_id, strategy_type)
WHERE is_active = true;

-- 表达式索引
CREATE INDEX CONCURRENTLY idx_strategies_lower_name
ON strategies (LOWER(name));
```

### 查询优化
```python
# 分页查询优化
async def get_paginated_results(page: int, per_page: int, filters: dict):
    offset = (page - 1) * per_page

    # 使用CTE优化复杂查询
    query = """
    WITH filtered_results AS (
        SELECT *
        FROM backtest_results
        WHERE strategy_id = $1
          AND backtest_start_time >= $2
          AND backtest_end_time <= $3
    )
    SELECT *, COUNT(*) OVER() as total_count
    FROM filtered_results
    ORDER BY created_at DESC
    LIMIT $4 OFFSET $5
    """

    results = await db.fetch_all(query, [
        filters['strategy_id'],
        filters['start_date'],
        filters['end_date'],
        per_page,
        offset
    ])

    return results
```

## 数据迁移

### Alembic配置
```python
# alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = postgresql://user:password@localhost/dbname

[post_write_hooks]
hooks = black
black.type = console_scripts
black.entrypoint = black
black.options = -l 88 REVISION_SCRIPT_FILENAME
```

### 迁移脚本示例
```python
# alembic/versions/001_initial_schema.py

"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-01-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 创建枚举类型
    user_role = postgresql.ENUM('admin', 'trader', 'researcher', 'viewer', name='user_role')
    user_role.create(op.get_bind())

    strategy_type = postgresql.ENUM('trend', 'mean_reversion', 'momentum', 'arbitrage', 'custom', name='strategy_type_enum')
    strategy_type.create(op.get_bind())

    # 创建用户表
    op.create_table('users',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('username', sa.String(50), nullable=True),
        sa.Column('role', user_role, nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )

    # 创建索引
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

def downgrade():
    # 删除所有表
    op.drop_index('idx_users_role', 'users')
    op.drop_index('idx_users_email', 'users')
    op.drop_table('users')

    # 删除枚举类型
    op.execute('DROP TYPE IF EXISTS user_role')
    op.execute('DROP TYPE IF EXISTS strategy_type_enum')
```

## 监控和告警

### 数据库监控查询
```sql
-- 监控慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 监控连接数
SELECT count(*) as active_connections,
       state
FROM pg_stat_activity
GROUP BY state;

-- 监控表大小
SELECT schemaname,
       tablename,
       attname,
       n_distinct,
       correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

### 自动告警配置
```yaml
# prometheus-alerts.yml
groups:
  - name: database
    rules:
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connections are high"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
```

## 总结

数据库设计是xTrading系统的核心基础，我们采用了多数据库混合架构：

1. **PostgreSQL**：作为主数据库，提供强一致性和复杂查询能力
2. **InfluxDB**：专门处理时序数据，优化行情数据存储和查询
3. **Redis**：提供高性能缓存和实时数据支持

通过合理的表设计、索引优化、缓存策略和监控告警，确保了系统的高性能、高可用性和可扩展性。
