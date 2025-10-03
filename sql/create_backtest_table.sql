-- 创建pytrading数据库
CREATE DATABASE IF NOT EXISTS pytrading 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用pytrading数据库
USE pytrading;

-- 创建回测结果表
CREATE TABLE IF NOT EXISTS backtest_results (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX idx_symbol (symbol),
    INDEX idx_backtest_time (backtest_start_time, backtest_end_time),
    INDEX idx_created_at (created_at),
    
    -- 唯一约束：同一股票同一时间段只能有一条回测记录
    UNIQUE KEY uq_symbol_time (symbol, backtest_start_time, backtest_end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回测结果表';

-- 创建查询视图（可选）
CREATE OR REPLACE VIEW v_backtest_summary AS
SELECT 
    symbol,
    name,
    trending_type,
    backtest_start_time,
    backtest_end_time,
    ROUND(pnl_ratio * 100, 2) as pnl_ratio_percent,
    ROUND(sharp_ratio, 4) as sharp_ratio,
    ROUND(max_drawdown * 100, 2) as max_drawdown_percent,
    ROUND(risk_ratio, 4) as risk_ratio,
    open_count,
    close_count,
    win_count,
    lose_count,
    ROUND(win_ratio * 100, 2) as win_ratio_percent,
    created_at,
    updated_at
FROM backtest_results
ORDER BY created_at DESC;

-- 显示表结构
DESCRIBE backtest_results;