-- 迁移: 扩展 symbols 表，添加行业分类和概念板块字段
-- 原因: 支持更丰富的股票分类信息存储
-- 日期: 2026-05-17

ALTER TABLE symbols
    ADD COLUMN IF NOT EXISTS industry_sw VARCHAR(50) COMMENT '申万行业分类',
    ADD COLUMN IF NOT EXISTS industry_csrc VARCHAR(100) COMMENT '证监会行业分类',
    ADD COLUMN IF NOT EXISTS concept_boards JSON COMMENT '概念板块列表',
    ADD COLUMN IF NOT EXISTS list_date DATE COMMENT '上市日期',
    ADD COLUMN IF NOT EXISTS data_updated_at DATETIME COMMENT '数据更新时间';
