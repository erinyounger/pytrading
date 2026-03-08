-- 股票关注列表表
-- 功能: 002-stock-watchlist
-- 创建时间: 2026-03-07

CREATE TABLE IF NOT EXISTS watchlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
    symbol VARCHAR(20) NOT NULL COMMENT '股票代码',
    name VARCHAR(255) COMMENT '股票名称',
    strategy_id INT NOT NULL COMMENT '关联策略ID',
    watch_type VARCHAR(20) NOT NULL DEFAULT '无状态' COMMENT '关注类型',
    previous_watch_type VARCHAR(20) COMMENT '上一次关注类型',
    type_changed BOOLEAN NOT NULL DEFAULT FALSE COMMENT '关注类型是否发生变化',
    type_changed_at DATETIME COMMENT '关注类型变化时间',
    last_backtest_task_id VARCHAR(255) COMMENT '最近回测任务ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    -- 唯一约束: 同一股票同一策略只能关注一次
    UNIQUE KEY uk_symbol_strategy (symbol, strategy_id),

    -- 索引
    INDEX idx_watch_type (watch_type),
    INDEX idx_type_changed (type_changed),
    INDEX idx_strategy_id (strategy_id),

    -- 外键约束 (如果需要可启用)
    -- FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='股票关注列表';
