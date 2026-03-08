-- 迁移: 移除 watchlist_items 中冗余的回测指标字段
-- 原因: 这些指标直接从 backtest_results 表 JOIN 获取，不再冗余保存
-- 日期: 2026-03-08

ALTER TABLE watchlist_items
    DROP COLUMN IF EXISTS pnl_ratio,
    DROP COLUMN IF EXISTS sharp_ratio,
    DROP COLUMN IF EXISTS max_drawdown,
    DROP COLUMN IF EXISTS win_ratio,
    DROP COLUMN IF EXISTS current_price,
    DROP COLUMN IF EXISTS last_backtest_time;
