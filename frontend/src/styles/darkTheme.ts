// 金融终端深色主题样式
export const darkTheme = {
  // 背景色
  background: '#0f0f1a',
  cardBackground: '#1a1a2e',
  cardBackgroundAlt: '#15152a',
  border: '#2a2a4a',
  // 文字颜色
  textPrimary: '#f0f0f5',
  textSecondary: '#b8b8c8',
  textMuted: '#8888a0',
  // 强调色
  positive: '#ff4d4f',  // 证券红 - 上涨/盈利
  negative: '#52c41a',  // 证券绿 - 下跌/亏损
  accent: '#4d7cff',    // 蓝色强调
  // 表头和行
  tableHeader: '#252545',
  tableRow: '#1a1a2e',
  tableRowAlt: '#15152a',
  tableHover: '#1f1f3a',
  // 渐变色卡片
  gradientGreen: 'linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(82, 196, 26, 0.05) 100%)',
  gradientRed: 'linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(255, 77, 79, 0.05) 100%)',
  gradientBlue: 'linear-gradient(135deg, rgba(77, 124, 255, 0.15) 0%, rgba(77, 124, 255, 0.05) 100%)',
  gradientPurple: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
  gradientGold: 'linear-gradient(135deg, rgba(250, 169, 22, 0.15) 0%, rgba(250, 169, 22, 0.05) 100%)',
};

// 注入全局深色主题样式
export const globalDarkStyles = `
  /* 表格深色主题 */
  .ant-table-thead > tr > th {
    background: ${darkTheme.tableHeader} !important;
    color: ${darkTheme.textSecondary} !important;
    border-bottom: 1px solid ${darkTheme.border} !important;
    font-weight: 600;
    padding: 10px 8px !important;
  }
  .ant-table-tbody > tr > td {
    background: ${darkTheme.cardBackground} !important;
    color: ${darkTheme.textPrimary} !important;
    border-bottom: 1px solid ${darkTheme.border} !important;
    padding: 8px !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: ${darkTheme.tableHover} !important;
  }
  .ant-table-tbody > tr:nth-child(even) > td {
    background: ${darkTheme.tableRowAlt} !important;
  }
  .ant-table-column-sorter {
    color: ${darkTheme.textMuted} !important;
  }
  .ant-table-column-sorter-up.active, .ant-table-column-sorter-down.active {
    color: ${darkTheme.accent} !important;
  }

  /* 分页深色主题 */
  .ant-pagination-item {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-pagination-item a {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-pagination-item-active {
    background: ${darkTheme.accent} !important;
    border-color: ${darkTheme.accent} !important;
  }
  .ant-pagination-item-active a {
    color: #fff !important;
  }
  .ant-pagination-prev .ant-pagination-item-link,
  .ant-pagination-next .ant-pagination-item-link {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-pagination-options .ant-select-selector {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* 输入框深色主题 */
  .ant-input, .ant-input-number, .ant-picker {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-input::placeholder, .ant-picker-input input::placeholder {
    color: ${darkTheme.textMuted} !important;
  }
  .ant-input:hover, .ant-input-number:hover, .ant-picker:hover {
    border-color: ${darkTheme.accent} !important;
  }
  .ant-input:focus, .ant-input-number:focus, .ant-picker-focused {
    border-color: ${darkTheme.accent} !important;
    box-shadow: 0 0 0 2px ${darkTheme.accent}20 !important;
  }

  /* 选择器深色主题 */
  .ant-select-selector {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-select-dropdown {
    background: ${darkTheme.cardBackground} !important;
    border: 1px solid ${darkTheme.border} !important;
  }
  .ant-select-item {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-select-item-option-active {
    background: ${darkTheme.tableHover} !important;
  }
  .ant-select-item-option-selected {
    background: ${darkTheme.accent}30 !important;
  }

  /* 模态框深色主题 */
  .ant-modal-content {
    background: ${darkTheme.cardBackground} !important;
    border: 1px solid ${darkTheme.border};
  }
  .ant-modal-header {
    background: ${darkTheme.cardBackground} !important;
    border-bottom: 1px solid ${darkTheme.border} !important;
  }
  .ant-modal-title {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-modal-close {
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-modal-body {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-modal-footer {
    border-top: 1px solid ${darkTheme.border} !important;
  }

  /* 按钮深色主题 */
  .ant-btn {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-btn:hover {
    border-color: ${darkTheme.accent} !important;
    color: ${darkTheme.accent} !important;
  }

  /* 工具提示深色主题 */
  .ant-tooltip-inner {
    background: ${darkTheme.tableHeader} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-tooltip-arrow::before {
    background: ${darkTheme.tableHeader} !important;
  }

  /* 空状态深色主题 */
  .ant-empty-description {
    color: ${darkTheme.textSecondary} !important;
  }

  /* 搜索输入框深色主题 */
  .ant-input-search .ant-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-input-search .ant-input-search-button {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-input-search .ant-input-search-button .anticon {
    color: ${darkTheme.textSecondary} !important;
  }

  /* 表格滚动条深色主题 */
  .ant-table-body::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .ant-table-body::-webkit-scrollbar-track {
    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  .ant-table-body::-webkit-scrollbar-thumb {
    background: ${darkTheme.border} !important;
    border-radius: 4px;
  }
  .ant-table-body::-webkit-scrollbar-thumb:hover {
    background: ${darkTheme.textMuted} !important;
  }

  /* 表格容器滚动条 */
  .ant-table-scroll {
    overflow: auto;
  }
  .ant-table-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .ant-table-scroll::-webkit-scrollbar-track {
ant-table-scroll::-    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  .ant-table-scroll::-webkit-scrollbar-thumb {
    background: ${darkTheme.border} !important;
    border-radius: 4px;
  }
  .ant-table-scroll::-webkit-scrollbar-thumb:hover {
    background: ${darkTheme.textMuted} !important;
  }

  /* 固定列滚动条 */
  .ant-table-cell-fix-left, .ant-table-cell-fix-right {
    background: ${darkTheme.cardBackground} !important;
  }

  /* 表格横向滚动条 */
  .ant-table-h_scroll .ant-table {
    overflow-x: auto;
  }
  .ant-table-h_scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .ant-table-h_scroll::-webkit-scrollbar-track {
    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  .ant-table-h_scroll::-webkit-scrollbar-thumb {
    background: ${darkTheme.border} !important;
    border-radius: 4px;
  }

  /* 所有滚动条通用样式 */
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  *::-webkit-scrollbar-track {
    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  *::-webkit-scrollbar-thumb {
    background: ${darkTheme.border} !important;
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: ${darkTheme.textMuted} !important;
  }
`;
