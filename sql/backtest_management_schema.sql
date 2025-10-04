-- 回测管理模块数据库架构
-- 设计原则：简化、实用、兼容现有代码

USE pytrading;

-- 1. 策略表 (strategies)
CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '策略ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '策略代码',
    display_name VARCHAR(100) NOT NULL COMMENT '策略显示名称',
    description TEXT COMMENT '策略描述',
    strategy_type VARCHAR(50) NOT NULL COMMENT '策略类型',
    parameters JSON COMMENT '策略参数配置',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_strategy_type (strategy_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='策略表';

-- 2. 股票池表 (symbols)
CREATE TABLE IF NOT EXISTS symbols (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '股票ID',
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '股票代码',
    name VARCHAR(100) NOT NULL COMMENT '股票名称',
    market VARCHAR(10) DEFAULT 'A' COMMENT '市场类型',
    industry VARCHAR(50) COMMENT '所属行业',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_market (market),
    INDEX idx_industry (industry),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='股票池表';

-- 3. 回测任务表 (backtest_tasks)
CREATE TABLE IF NOT EXISTS backtest_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    task_id VARCHAR(50) NOT NULL UNIQUE COMMENT '任务唯一标识',
    strategy_id INT NOT NULL COMMENT '策略ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    start_time DATETIME NOT NULL COMMENT '回测开始时间',
    end_time DATETIME NOT NULL COMMENT '回测结束时间',
    status ENUM('pending', 'running', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
    progress INT DEFAULT 0 COMMENT '进度百分比',
    parameters JSON COMMENT '任务参数',
    result_summary JSON COMMENT '结果摘要',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    INDEX idx_task_id (task_id),
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回测任务表';

-- 4. 回测结果表 (backtest_results) - 兼容现有结构
CREATE TABLE IF NOT EXISTS backtest_results (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    task_id VARCHAR(50) COMMENT '任务ID',
    strategy_id INT COMMENT '策略ID',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    name VARCHAR(50) COMMENT '股票名称',
    trending_type VARCHAR(50) COMMENT '趋势类型',
    strategy_name VARCHAR(50) COMMENT '策略名称',
    backtest_start_time DATETIME COMMENT '回测开始时间',
    backtest_end_time DATETIME COMMENT '回测结束时间',
    pnl_ratio DECIMAL(10,4) COMMENT '累计收益率',
    sharp_ratio DECIMAL(10,4) COMMENT '夏普比率',
    max_drawdown DECIMAL(10,4) COMMENT '最大回撤',
    risk_ratio DECIMAL(10,4) COMMENT '风险比率',
    open_count INT COMMENT '开仓次数',
    close_count INT COMMENT '平仓次数',
    win_count INT COMMENT '盈利次数',
    lose_count INT COMMENT '亏损次数',
    win_ratio DECIMAL(6,4) COMMENT '胜率',
    total_trades INT COMMENT '总交易次数',
    win_trades INT COMMENT '盈利交易次数',
    current_price DECIMAL(10,2) COMMENT '当前股价',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 外键约束（可选，避免数据不一致时的问题）
    -- FOREIGN KEY (task_id) REFERENCES backtest_tasks(task_id) ON DELETE CASCADE,
    -- FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
    
    -- 索引
    INDEX idx_task_id (task_id),
    INDEX idx_strategy_id (strategy_id),
    INDEX idx_symbol (symbol),
    INDEX idx_backtest_time (backtest_start_time, backtest_end_time),
    INDEX idx_created_at (created_at),
    
    -- 唯一约束：同一股票同一时间段只能有一条回测记录
    UNIQUE KEY uq_symbol_time (symbol, backtest_start_time, backtest_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回测结果表';

-- 5. 系统配置表 (system_config)
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(20) DEFAULT 'string' COMMENT '配置类型',
    description VARCHAR(200) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认数据
INSERT INTO strategies (name, display_name, description, strategy_type, parameters) VALUES
('bollinger_bands', '布林带策略', '基于布林带指标的趋势跟踪策略', 'trend_following', '{"period": 20, "std_dev": 2}'),
('macd', 'MACD策略', '基于MACD指标的趋势跟踪策略', 'trend_following', '{"fast_period": 12, "slow_period": 26, "signal_period": 9}'),
('turtle', '海龟策略', '经典的海龟交易策略', 'trend_following', '{"entry_period": 20, "exit_period": 10}');

INSERT INTO symbols (symbol, name, market, industry) VALUES
('000001', '平安银行', 'A', '银行'),
('000002', '万科A', 'A', '房地产'),
('000858', '五粮液', 'A', '食品饮料'),
('600036', '招商银行', 'A', '银行'),
('600519', '贵州茅台', 'A', '食品饮料');

INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('trading_mode', 'backtest', 'string', '交易模式：backtest/paper/live'),
('max_concurrent_tasks', '5', 'integer', '最大并发任务数'),
('data_source', 'tushare', 'string', '数据源：tushare/akshare'),
('cache_enabled', 'true', 'boolean', '是否启用缓存');

-- 创建查询视图 - 兼容现有结构
CREATE OR REPLACE VIEW v_backtest_summary AS
SELECT 
    br.id,
    br.symbol,
    br.name,
    br.trending_type,
    br.strategy_name,
    br.backtest_start_time,
    br.backtest_end_time,
    ROUND(br.pnl_ratio * 100, 2) as pnl_ratio_percent,
    ROUND(br.sharp_ratio, 4) as sharp_ratio,
    ROUND(br.max_drawdown * 100, 2) as max_drawdown_percent,
    ROUND(br.risk_ratio, 4) as risk_ratio,
    br.open_count,
    br.close_count,
    br.win_count,
    br.lose_count,
    ROUND(br.win_ratio * 100, 2) as win_ratio_percent,
    br.total_trades,
    br.win_trades,
    br.current_price,
    br.task_id,
    br.strategy_id,
    br.created_at,
    br.updated_at
FROM backtest_results br
ORDER BY br.created_at DESC;

-- 显示表结构
DESCRIBE strategies;
DESCRIBE symbols;
DESCRIBE backtest_tasks;
DESCRIBE backtest_results;
DESCRIBE system_config;

-- 兼容性说明：
-- 1. backtest_results表保留了所有现有字段，新增了task_id、strategy_id、total_trades、win_trades、current_price
-- 2. 外键约束被注释掉，避免数据不一致时的问题
-- 3. 视图v_backtest_summary兼容现有API，包含所有原有字段
-- 4. 新增的strategies、symbols、backtest_tasks表支持新的回测管理功能
-- 5. system_config表提供系统配置管理功能
