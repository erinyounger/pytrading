-- 为backtest_results表添加strategy_name字段
USE pytrading;

-- 添加strategy_name字段
ALTER TABLE backtest_results 
ADD COLUMN strategy_name VARCHAR(50) COMMENT '策略名称' 
AFTER name;

-- 更新现有数据，将trending_type的值复制到strategy_name
UPDATE backtest_results 
SET strategy_name = trending_type 
WHERE strategy_name IS NULL;

-- 显示更新后的表结构
DESCRIBE backtest_results;
