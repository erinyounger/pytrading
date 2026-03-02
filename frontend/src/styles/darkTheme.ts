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

  /* 所有可能的输入框样式 */
  input.ant-input, textarea.ant-input, .ant-input-number-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* 选择器深色主题 */
  .ant-select-selector {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-select-focused .ant-select-selector {
    border-color: ${darkTheme.accent} !important;
    box-shadow: 0 0 0 2px ${darkTheme.accent}20 !important;
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
  .ant-btn-primary {
    background: ${darkTheme.accent} !important;
    border-color: ${darkTheme.accent} !important;
    color: #fff !important;
  }
  .ant-btn-primary:hover {
    background: ${darkTheme.accent} !important;
    border-color: ${darkTheme.accent} !important;
    opacity: 0.9;
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
    border-color: ${darkTheme.border} !important;
  }
  .ant-input-search .ant-input:hover {
    border-color: ${darkTheme.accent} !important;
  }
  .ant-input-search .ant-input:focus {
    border-color: ${darkTheme.accent} !important;
    box-shadow: 0 0 0 2px ${darkTheme.accent}20 !important;
  }
  .ant-input-search .ant-input-search-button {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-input-search .ant-input-search-button:hover {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.accent} !important;
  }
  .ant-input-search .ant-input-search-button .anticon {
    color: ${darkTheme.textSecondary} !important;
  }

  /* 表格内搜索输入框 */
  .ant-table-filter-dropdown .ant-input-search .ant-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* Select 组件内部搜索框 */
  .ant-select-focused .ant-select-selection-search-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-select-selection-search-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* Input 组件（带搜索图标的） */
  .ant-input[prefix] {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-input[prefix]:hover {
    border-color: ${darkTheme.accent} !important;
  }
  .ant-input[prefix]:focus {
    border-color: ${darkTheme.accent} !important;
    box-shadow: 0 0 0 2px ${darkTheme.accent}20 !important;
  }

  /* Select 下拉搜索框 */
  .ant-select-dropdown .ant-select-selector {
    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  .ant-select-dropdown-search {
    background: ${darkTheme.cardBackgroundAlt} !important;
  }
  .ant-select-dropdown-search .ant-select-search-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* 过滤器中的 Select 和 InputNumber */
  .ant-filter-dropdown .ant-select-selector,
  .ant-table-filter-dropdown .ant-select-selector {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
    border-color: ${darkTheme.border} !important;
  }

  /* InputNumber 深色主题 */
  .ant-input-number {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-input-number:hover {
    border-color: ${darkTheme.accent} !important;
  }
  .ant-input-number:focus, .ant-input-number-focused {
    border-color: ${darkTheme.accent} !important;
    box-shadow: 0 0 0 2px ${darkTheme.accent}20 !important;
  }
  .ant-input-number-input {
    background: ${darkTheme.cardBackgroundAlt} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-input-number-handler-wrap {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-input-number-handler {
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-input-number-handler-up-inner,
  .ant-input-number-handler-down-inner {
    color: ${darkTheme.textSecondary} !important;
  }

  /* Radio Button 深色主题 */
  .ant-radio-wrapper {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-radio-button-wrapper {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-radio-button-wrapper:hover {
    color: ${darkTheme.accent} !important;
  }
  .ant-radio-button-wrapper-checked {
    background: ${darkTheme.accent} !important;
    border-color: ${darkTheme.accent} !important;
    color: #fff !important;
  }

  /* Form Item Label */
  .ant-form-item-label > label {
    color: ${darkTheme.textSecondary} !important;
  }

  /* Select 占位符颜色 */
  .ant-select-selection-placeholder {
    color: ${darkTheme.textMuted} !important;
  }

  /* 表格过滤器下拉框 */
  .ant-table-filter-dropdown {
    background: ${darkTheme.cardBackground} !important;
    border: 1px solid ${darkTheme.border} !important;
  }
  .ant-table-filter-dropdown-btns {
    border-top-color: ${darkTheme.border} !important;
  }

  /* Select placeholder 颜色 */
  .ant-select-selection-placeholder {
    color: ${darkTheme.textMuted} !important;
  }

  /* 修复所有 Select 的 placeholder */
  .ant-select:not(.ant-select-disabled) .ant-select-selection-placeholder,
  .ant-select-selection-placeholder {
    color: ${darkTheme.textMuted} !important;
  }

  /* 修复 Input placeholder */
  .ant-input::placeholder {
    color: ${darkTheme.textMuted} !important;
  }

  /* 修复 DatePicker placeholder */
  .ant-picker-input input::placeholder {
    color: ${darkTheme.textMuted} !important;
  }

  /* 表格内所有过滤元素 */
  .ant-table-filter-column {
    color: ${darkTheme.textSecondary} !important;
  }

  /* Select 组件更强样式覆盖 */
  .ant-select {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-select .ant-select-selector {
    background-color: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textPrimary} !important;
    height: 22px !important;
    min-height: 22px !important;
  }
  .ant-select .ant-select-selection-item {
    color: ${darkTheme.textPrimary} !important;
    line-height: 22px !important;
  }
  .ant-select .ant-select-selection-placeholder {
    color: ${darkTheme.textMuted} !important;
    line-height: 22px !important;
    -webkit-text-fill-color: ${darkTheme.textMuted} !important;
  }

  /* Select 内部占位符更强样式 */
  div.ant-select-selector span.ant-select-selection-placeholder {
    color: ${darkTheme.textMuted} !important;
    -webkit-text-fill-color: ${darkTheme.textMuted} !important;
  }
  .ant-select-arrow {
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-select-selection-item::after {
    display: none !important;
  }
  /* Select small size */
  .ant-select-sm .ant-select-selector {
    height: 22px !important;
    min-height: 22px !important;
    padding: 0 8px !important;
  }
  .ant-select-sm .ant-select-selection-search-input {
    height: 22px !important;
  }
  /* Select 多选模式垂直居中 */
  .ant-select-multiple .ant-select-selector {
    min-height: 24px !important;
    height: auto !important;
    padding: 1px 4px !important;
  }
  .ant-select-multiple .ant-select-selection-item {
    line-height: 20px !important;
    height: 20px !important;
    margin-top: 1px !important;
    margin-bottom: 1px !important;
  }
  .ant-select-multiple .ant-select-selection-placeholder {
    line-height: 22px !important;
  }
  .ant-select-selection-search-input {
    height: 22px !important;
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
  .ant-table-cell-fix-right-first,
  .ant-table-cell-fix-left-first {
    background: ${darkTheme.cardBackground} !important;
  }
  .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right,
  .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left {
    background: ${darkTheme.tableHover} !important;
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

  /* 日志查看器滚动条 */
  .ant-card-body > div::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .ant-card-body > div::-webkit-scrollbar-track {
    background: #2d2d2d !important;
    border-radius: 5px;
  }
  .ant-card-body > div::-webkit-scrollbar-thumb {
    background: #555 !important;
    border-radius: 5px;
  }
  .ant-card-body > div::-webkit-scrollbar-thumb:hover {
    background: #666 !important;
  }

  /* 卡片标题深色主题 */
  .ant-card-head {
    background: ${darkTheme.cardBackground} !important;
    border-bottom: 1px solid ${darkTheme.border} !important;
  }
  .ant-card-head-title {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-card-body {
    background: ${darkTheme.cardBackground} !important;
    color: ${darkTheme.textPrimary} !important;
  }

  /* 统计卡片深色主题 */
  .ant-statistic-title {
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-statistic-content {
    color: ${darkTheme.textPrimary} !important;
  }

  /* 提示信息深色主题 */
  .ant-alert-success {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-alert-success .ant-alert-message {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-alert-warning {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-alert-warning .ant-alert-message {
    color: ${darkTheme.textPrimary} !important;
  }
  .ant-alert-info {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.border} !important;
  }
  .ant-alert-info .ant-alert-message {
    color: ${darkTheme.textPrimary} !important;
  }

  /* 分割线深色主题 */
  .ant-divider {
    border-top-color: ${darkTheme.border} !important;
  }
  .ant-divider-inner-text {
    color: ${darkTheme.textSecondary} !important;
  }

  /* Tabs深色主题 */
  .ant-tabs-tab {
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: ${darkTheme.accent} !important;
  }
  .ant-tabs-ink-bar {
    background: ${darkTheme.accent} !important;
  }
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
    background: ${darkTheme.cardBackgroundAlt} !important;
    border-color: ${darkTheme.border} !important;
    color: ${darkTheme.textSecondary} !important;
  }
  .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
    background: ${darkTheme.cardBackground} !important;
    border-color: ${darkTheme.accent} !important;
  }
`;
