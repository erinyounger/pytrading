import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  DatePicker,
  Select,
  Tag,
  Modal,
  Row,
  Col,
  message,
  Tooltip,
  InputNumber,
  Pagination,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import {
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  ArrowRightOutlined,
  LineChartOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { BacktestResult, PaginatedApiResponse } from '../types';
import StockChart from '../components/StockChart';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 金融终端深色主题样式
const darkTheme = {
  // 背景色
  background: '#0f0f1a',
  cardBackground: '#1a1a2e',
  cardBackgroundAlt: '#15152a',
  border: '#2a2a4a',
  // 文字颜色
  textPrimary: '#e8e8e8',
  textSecondary: '#8888aa',
  textMuted: '#666680',
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
const globalDarkStyles = `
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
    background: ${darkTheme.cardBackgroundAlt} !important;
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

// 趋势类型中文映射
const TRENDING_TYPE_MAP: Record<string, string> = {
  'Unknown': '未知',
  'Observing': '关注',
  'RisingUp': '上涨',
  'ZeroAxisUp': '零轴上攻',
  'DeadXDown': '死叉下跌',
  'FallingDown': '下跌',
  'UpDown': '横盘震荡',
};

const translateTrendingType = (type: string): string => {
  return TRENDING_TYPE_MAP[type] || type;
};

const BacktestResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacktestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [compareData, setCompareData] = useState<{strategy: string; pnl: number; winRate: number; sharpe: number}[]>([]);
  // K线图表相关状态
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartName, setChartName] = useState('');
  const [klineData, setKlineData] = useState<any[]>([]);
  const [klineLoading, setKlineLoading] = useState(false);
  const [filters, setFilters] = useState({
    symbol: '',
    trending_type: '', // 改为trending_type以匹配后端API
    industry: '', // 行业筛选
    dateRange: null as any,
    pnlRange: null as any, // 收益率范围
    winRatioRange: null as any, // 胜率范围
    marketCapRange: null as any, // 市值范围（亿元）
    drawdownDurationRange: null as any, // 回撤持续时间（天）
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [sortConfig, setSortConfig] = useState<{
    field: string | null;
    order: 'asc' | 'desc' | null;
  }>({
    field: null,
    order: null
  });

  const fetchBacktestResults = useCallback(async (
    page: number = 1,
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        per_page: pageSize,
        symbol: filters.symbol || undefined,
        trending_type: filters.trending_type || undefined,
        industry: filters.industry || undefined,
        start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
        min_pnl_ratio: filters.pnlRange?.[0],
        max_pnl_ratio: filters.pnlRange?.[1],
        min_win_ratio: filters.winRatioRange?.[0],
        max_win_ratio: filters.winRatioRange?.[1],
        min_market_cap: filters.marketCapRange?.[0],
        max_market_cap: filters.marketCapRange?.[1],
        min_drawdown_duration: filters.drawdownDurationRange?.[0],
        max_drawdown_duration: filters.drawdownDurationRange?.[1],
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      };

      // 移除值为undefined的参数
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === undefined) {
          delete params[key as keyof typeof params];
        }
      });

      const response: PaginatedApiResponse<BacktestResult[]> = await apiService.getBacktestResults(params);

      setData(response.data);
      setPagination({
        current: response.page,
        pageSize: response.per_page,
        total: response.total,
        totalPages: response.total_pages
      });
    } catch (error) {
      message.error('获取回测结果失败');
      console.error('获取回测结果失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBacktestResults();
  }, [fetchBacktestResults]);

  // 监听筛选条件变化，自动重新获取数据
  // 当筛选变化时，重置到第一页并请求数据
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev !== filters) {
      prevFiltersRef.current = filters;
      fetchBacktestResults(
        1,
        pagination.pageSize,
        sortConfig.field || undefined,
        sortConfig.order || undefined
      );
    }
  }, [filters, fetchBacktestResults, pagination.pageSize, sortConfig.field, sortConfig.order]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      symbol: '',
      trending_type: '',
      industry: '',
      dateRange: null,
      pnlRange: null,
      winRatioRange: null,
      marketCapRange: null,
      drawdownDurationRange: null,
    });
    // 清除筛选后由 filters effect 触发刷新
  };

  const handleSort = (field: string) => {
    let newOrder: 'asc' | 'desc' = 'desc';
    
    // 如果点击的是当前排序字段，则切换排序方向
    if (sortConfig.field === field) {
      newOrder = sortConfig.order === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ field, order: newOrder });
    fetchBacktestResults(1, pagination.pageSize, field, newOrder);
  };



  // 获取所有可用的趋势类型（从后端获取）
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);

  // 获取所有趋势类型
  const fetchAvailableStrategies = async () => {
    try {
      const response = await apiService.getBacktestResults({ per_page: 1000 }); // 获取所有数据
      const allData = response.data;
      const strategies = new Set(allData.map(item => item.trending_type).filter(Boolean));
      setAvailableStrategies(Array.from(strategies).sort());
    } catch (error) {
      console.error('获取趋势类型失败:', error);
    }
  };

  useEffect(() => {
    fetchAvailableStrategies();
  }, []);

  // 快速筛选预设
  const quickFilters = [
    { label: '盈利策略', onClick: () => {
        setFilters(prev => ({ ...prev, pnlRange: [0, 1000] }));
      } 
    },
    { label: '亏损策略', onClick: () => {
        setFilters(prev => ({ ...prev, pnlRange: [-100, 0] }));
      } 
    },
    { label: '高胜率(>60%)', onClick: () => {
        setFilters(prev => ({ ...prev, winRatioRange: [60, 100] }));
      } 
    },
    { label: '低胜率(<40%)', onClick: () => {
        setFilters(prev => ({ ...prev, winRatioRange: [0, 40] }));
      } 
    },
  ];

  const showDetail = (record: BacktestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const exportData = () => {
    // 注意：当前导出功能仅导出当前页数据，完整导出需要后端支持
    const headers = ['股票代码', '股票名称', '策略名称', '趋势类型', '收益率', '夏普比率', '最大回撤', '胜率', '开始时间', '结束时间'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.symbol,
        item.name,
        item.strategy_name || '',  // 如果策略名称为null，导出时显示为空
        item.trending_type,
        (item.pnl_ratio * 100).toFixed(2) + '%',
        item.sharp_ratio.toFixed(2),
        (item.max_drawdown * 100).toFixed(2) + '%',
        (item.win_ratio * 100).toFixed(2) + '%',
        item.backtest_start_time,
        item.backtest_end_time
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_results_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnsType<BacktestResult> = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left' as const,
      render: (value: string, record: BacktestResult) => (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <a
          onClick={async () => {
            setChartSymbol(value);
            setChartName(record.name || '');
            setChartModalVisible(true);

            // 加载K线数据
            try {
              setKlineLoading(true);
              const response = await apiService.getKlineData(value);
              setKlineData(response.data || []);
            } catch (error) {
              console.error('获取K线数据失败:', error);
              setKlineData([]);
            } finally {
              setKlineLoading(false);
            }
          }}
          href="#"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            cursor: 'pointer',
            color: darkTheme.accent,
            fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          {value}
        </a>
      ),
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '当前股价',
      dataIndex: 'current_price',
      key: 'current_price',
      align: 'right' as const,
      render: (value?: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value != null ? value.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      title: '日均成交量',
      dataIndex: 'volume_avg_7d',
      key: 'volume_avg_7d',
      align: 'right' as const,
      render: (value?: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value != null ? value.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      title: '止损价位',
      key: 'stop_loss_price',
      align: 'right' as const,
      render: (_: any, record: BacktestResult) => {
        if (record.current_price && record.atr) {
          const stopLoss = record.current_price - (record.atr * 2);
          return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stopLoss.toFixed(2)}</span>;
        }
        return <span style={{ color: '#999' }}>-</span>;
      },
    },
    {
      title: '黑名单',
      dataIndex: 'is_blacklist',
      key: 'is_blacklist',
      align: 'center' as const,
      render: (value?: boolean) => (
        value ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>
      ),
    },
    // 行业为付费接口，暂不显示，留空以后扩展
    // {
    //   title: '行业',
    //   dataIndex: 'industry',
    //   key: 'industry',
    //   render: (value?: string) => value || '-',
    // },
    {
      title: '市值(亿)',
      dataIndex: 'market_cap',
      key: 'market_cap',
      align: 'right' as const,
      render: (value?: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value != null ? value.toFixed(0) : '-'}
        </span>
      ),
    },
    {
      title: '回撤天数',
      dataIndex: 'max_drawdown_duration',
      key: 'max_drawdown_duration',
      align: 'center' as const,
      render: (value?: number) => value != null ? value : '-',
    },
    {
      title: '策略名称',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      render: (value: string) => {
        // 如果策略名称为null、undefined或空字符串，则不显示
        if (!value || value === 'null' || value === 'undefined') {
          return '-';
        }
        return value;
      }
    },
    {
      title: '当前趋势',
      dataIndex: 'trending_type',
      key: 'trending_type',
      render: (type: string) => {
        // 这里trending_type实际上是趋势阶段，不是策略类型 - 使用渐变风格的Tag
        const typeMap: Record<string, { text: string; bg: string; color: string }> = {
          'Unknown': { text: '未识别', bg: 'rgba(136, 136, 170, 0.2)', color: '#8888aa' },
          'Observing': { text: '关注', bg: 'rgba(77, 124, 255, 0.2)', color: '#4d7cff' },
          'RisingUp': { text: '上涨', bg: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f' },
          'ZeroAxisUp': { text: '零轴上攻', bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' },
          'DeadXDown': { text: '死叉下跌', bg: 'rgba(250, 169, 22, 0.2)', color: '#faa916' },
          'FallingDown': { text: '下跌', bg: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f' },
          'UpDown': { text: '震荡', bg: 'rgba(82, 196, 26, 0.2)', color: '#52c41a' }
        };
        const config = typeMap[type] || { text: type, bg: 'rgba(136, 136, 170, 0.2)', color: '#8888aa' };
        return (
          <Tag style={{
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.color}40`,
            borderRadius: '4px',
            fontWeight: 500,
          }}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: (
        <span
          style={{ cursor: 'pointer', userSelect: 'none', color: darkTheme.textSecondary }}
          onClick={() => handleSort('pnl_ratio')}
        >
          收益率 {sortConfig.field === 'pnl_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{
          color: value >= 0 ? darkTheme.positive : darkTheme.negative,
          fontWeight: 600,
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
          textShadow: value >= 0 ? 'rgba(255, 77, 79, 0.2)' : 'rgba(82, 196, 26, 0.2)',
        }}>
          {value >= 0 ? '+' : ''}{(value * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: (
        <span
          style={{ cursor: 'pointer', userSelect: 'none', color: darkTheme.textSecondary }}
          onClick={() => handleSort('win_ratio')}
        >
          胜率 {sortConfig.field === 'win_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{
          color: value >= 0.5 ? darkTheme.positive : darkTheme.negative,
          fontWeight: 600,
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
        }}>
          {(value * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: (
        <span
          style={{ cursor: 'pointer', userSelect: 'none', color: darkTheme.textSecondary }}
          onClick={() => handleSort('sharp_ratio')}
        >
          夏普比率 {sortConfig.field === 'sharp_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{
          color: value >= 1 ? darkTheme.positive : value < 0 ? darkTheme.negative : darkTheme.textPrimary,
          fontWeight: 600,
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value.toFixed(2)}
        </span>
      ),
    },
    {
      title: (
        <span
          style={{ cursor: 'pointer', userSelect: 'none', color: darkTheme.textSecondary }}
          onClick={() => handleSort('max_drawdown')}
        >
          最大回撤 {sortConfig.field === 'max_drawdown' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{
          color: darkTheme.positive,
          fontWeight: 600,
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
          fontVariantNumeric: 'tabular-nums',
        }}>
          -{Math.abs(value * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'backtest_start_time',
      key: 'backtest_start_time',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '结束时间',
      dataIndex: 'backtest_end_time',
      key: 'backtest_end_time',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => value ? dayjs(value).format('MM-DD HH:mm') : '-',
    },
    {
      title: '开仓次数',
      dataIndex: 'open_count',
      key: 'open_count',
      align: 'center' as const,
    },
    {
      title: '平仓次数',
      dataIndex: 'close_count',
      key: 'close_count',
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      align: 'center' as const,
      width: 80,
      render: (_: any, record: BacktestResult) => (
        <Tooltip title="查看详情">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => showDetail(record)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  // 计算统计数据用于顶部展示
  const statsData = data.length > 0 ? {
    avgPnl: data.reduce((sum, item) => sum + item.pnl_ratio, 0) / data.length * 100,
    avgWinRate: data.reduce((sum, item) => sum + item.win_ratio, 0) / data.length * 100,
    avgSharpe: data.reduce((sum, item) => sum + item.sharp_ratio, 0) / data.length,
    totalCount: data.length,
  } : { avgPnl: 0, avgWinRate: 0, avgSharpe: 0, totalCount: 0 };

  // 顶部统计卡片样式
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    suffix?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    gradient: string;
  }> = ({ title, value, suffix, icon, trend = 'neutral', gradient }) => (
    <div style={{
      background: gradient,
      border: `1px solid ${darkTheme.border}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.3s ease',
      cursor: 'default',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: darkTheme.cardBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: trend === 'up' ? darkTheme.positive : trend === 'down' ? darkTheme.negative : darkTheme.accent,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: darkTheme.textSecondary, fontSize: '13px', marginBottom: '4px' }}>{title}</div>
        <div style={{
          color: trend === 'up' ? darkTheme.positive : trend === 'down' ? darkTheme.negative : darkTheme.textPrimary,
          fontSize: '24px',
          fontWeight: 600,
          fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
          lineHeight: 1.2,
        }}>
          {typeof value === 'number' ? value.toFixed(2) : value}{suffix && <span style={{ fontSize: '14px', marginLeft: '2px' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{globalDarkStyles}</style>
      <div
        className="backtest-results"
        style={{
          padding: '16px',
          background: darkTheme.background,
          minHeight: 'calc(100vh - 64px)',
        }}>
      {/* 顶部统计卡片 */}
      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="平均收益率"
              value={statsData.avgPnl}
              suffix="%"
              icon={<RiseOutlined />}
              trend={statsData.avgPnl >= 0 ? 'up' : 'down'}
              gradient={statsData.avgPnl >= 0 ? darkTheme.gradientRed : darkTheme.gradientGreen}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="平均胜率"
              value={statsData.avgWinRate}
              suffix="%"
              icon={<TrophyOutlined />}
              trend={statsData.avgWinRate >= 50 ? 'up' : 'down'}
              gradient={statsData.avgWinRate >= 50 ? darkTheme.gradientGold : darkTheme.gradientPurple}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="平均夏普比率"
              value={statsData.avgSharpe.toFixed(2)}
              icon={<LineChartOutlined />}
              trend={statsData.avgSharpe >= 1 ? 'up' : statsData.avgSharpe < 0 ? 'down' : 'neutral'}
              gradient={darkTheme.gradientBlue}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="策略数量"
              value={pagination.total}
              icon={<DollarOutlined />}
              trend="neutral"
              gradient={darkTheme.gradientPurple}
            />
          </Col>
        </Row>
      </div>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: darkTheme.textPrimary }}>回测结果</span>
            <Space size="small">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchBacktestResults(pagination.current, pagination.pageSize)}
                loading={loading}
                size="small"
                style={{ background: darkTheme.cardBackground, borderColor: darkTheme.border, color: darkTheme.textPrimary }}
              >
                刷新
              </Button>
              <Button
                onClick={clearAllFilters}
                disabled={!filters.symbol && !filters.trending_type && !filters.dateRange && !filters.pnlRange && !filters.winRatioRange}
                size="small"
                style={{ background: darkTheme.cardBackground, borderColor: darkTheme.border, color: darkTheme.textPrimary }}
              >
                清除筛选
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportData}
                disabled={data.length === 0}
                size="small"
                style={{ background: darkTheme.cardBackground, borderColor: darkTheme.border, color: darkTheme.textPrimary }}
              >
                导出
              </Button>
              <Button
                icon={<EyeOutlined />}
                onClick={async () => {
                  // 获取所有策略的统计数据
                  try {
                    const response = await apiService.getBacktestResults({ per_page: 1000 });
                    const allData = response.data;
                    // 按策略分组计算统计数据
                    const strategyStats = new Map<string, {total: number; win: number; pnl: number; sharpe: number}>();
                    allData.forEach((item: BacktestResult) => {
                      const strat = item.strategy_name || 'Unknown';
                      if (!strategyStats.has(strat)) {
                        strategyStats.set(strat, { total: 0, win: 0, pnl: 0, sharpe: 0 });
                      }
                      const stat = strategyStats.get(strat)!;
                      stat.total++;
                      if (item.win_count > 0) stat.win++;
                      stat.pnl += item.pnl_ratio;
                      stat.sharpe += item.sharp_ratio;
                    });
                    const compare = Array.from(strategyStats.entries()).map(([strategy, stat]) => ({
                      strategy,
                      pnl: stat.total > 0 ? (stat.pnl / stat.total) * 100 : 0,
                      winRate: stat.total > 0 ? (stat.win / stat.total) * 100 : 0,
                      sharpe: stat.total > 0 ? stat.sharpe / stat.total : 0,
                    }));
                    setCompareData(compare);
                    setCompareModalVisible(true);
                  } catch (error) {
                    message.error('获取策略对比数据失败');
                  }
                }}
                size="small"
                style={{ background: darkTheme.accent, borderColor: darkTheme.accent, color: '#fff' }}
              >
                策略对比
              </Button>
            </Space>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '12px 16px', background: darkTheme.cardBackground, borderRadius: '0 0 8px 8px' }}
        headStyle={{
          padding: '12px 16px',
          borderBottom: `1px solid ${darkTheme.border}`,
          background: darkTheme.cardBackground,
          borderRadius: '8px 8px 0 0',
        }}
        style={{ borderRadius: '8px', border: `1px solid ${darkTheme.border}` }}
      >
        {/* 筛选栏 - 深色主题 */}
        <div style={{
          background: darkTheme.cardBackgroundAlt,
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '12px',
          border: `1px solid ${darkTheme.border}`,
        }}>
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md={6} lg={5}>
              <div className="backtest-search">
                <Search
                  placeholder="搜索股票代码或名称"
                  allowClear
                  onSearch={(value) => {
                    handleFilterChange('symbol', value);
                  }}
                  style={{ width: '100%' }}
                  size="small"
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择趋势类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.trending_type}
                onChange={(value) => {
                  handleFilterChange('trending_type', value);
                }}
                size="small"
              >
                {availableStrategies.map(strategy => (
                  <Option key={strategy} value={strategy}>
                    {translateTrendingType(strategy)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => {
                  handleFilterChange('dateRange', dates);
                }}
                size="small"
                presets={[
                  { label: '最近一周', value: [dayjs().subtract(1, 'week'), dayjs()] },
                  { label: '最近1个月', value: [dayjs().subtract(1, 'month'), dayjs()] },
                  { label: '最近3个月', value: [dayjs().subtract(3, 'month'), dayjs()] },
                  { label: '最近半年', value: [dayjs().subtract(6, 'month'), dayjs()] },
                  { label: '最近1年', value: [dayjs().subtract(1, 'year'), dayjs()] },
                  { label: '最近2年', value: [dayjs().subtract(2, 'year'), dayjs()] },
                ]}
              />
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小收益%"
                  style={{ width: '100%' }}
                  value={filters.pnlRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.pnlRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={-100}
                  max={1000}
                  precision={2}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大收益%"
                  style={{ width: '100%' }}
                  value={filters.pnlRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.pnlRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={-100}
                  max={1000}
                  precision={2}
                  size="small"
                />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4} lg={5}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小胜率%"
                  style={{ width: '100%' }}
                  value={filters.winRatioRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.winRatioRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  max={100}
                  precision={1}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大胜率%"
                  style={{ width: '100%' }}
                  value={filters.winRatioRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.winRatioRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  max={100}
                  precision={1}
                  size="small"
                />
              </div>
            </Col>
            {/* 行业筛选 - 付费接口，暂不显示，留空以后扩展 */}
            {/* <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择行业"
                allowClear
                style={{ width: '100%' }}
                value={filters.industry || undefined}
                onChange={(value) => {
                  handleFilterChange('industry', value || '');
                }}
                size="small"
              >
                <Option value="电子">电子</Option>
                <Option value="计算机">计算机</Option>
                <Option value="医药生物">医药生物</Option>
                <Option value="机械设备">机械设备</Option>
                <Option value="化工">化工</Option>
                <Option value="汽车">汽车</Option>
                <Option value="电力设备">电力设备</Option>
                <Option value="房地产">房地产</Option>
                <Option value="银行">银行</Option>
                <Option value="非银金融">非银金融</Option>
              </Select>
            </Col> */}
            {/* 市值筛选（亿元）- 暂不使用 */}
            {/* <Col xs={12} sm={8} md={4} lg={4}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小市值"
                  style={{ width: '100%' }}
                  value={filters.marketCapRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.marketCapRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('marketCapRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  precision={0}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大市值"
                  style={{ width: '100%' }}
                  value={filters.marketCapRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.marketCapRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('marketCapRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  precision={0}
                  size="small"
                />
              </div>
            </Col> */}
            {/* 回撤持续时间筛选（天）- 暂不使用 */}
            {/* <Col xs={12} sm={8} md={4} lg={4}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小回撤天数"
                  style={{ width: '100%' }}
                  value={filters.drawdownDurationRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.drawdownDurationRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('drawdownDurationRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  precision={0}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大回撤天数"
                  style={{ width: '100%' }}
                  value={filters.drawdownDurationRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.drawdownDurationRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('drawdownDurationRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  precision={0}
                  size="small"
                />
              </div>
            </Col> */}
          </Row>
        </div>

        {/* 快速筛选和统计信息 - 深色主题 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <Space size="small" wrap>
            <span style={{ color: darkTheme.textSecondary, fontSize: '13px' }}>快速筛选:</span>
            {quickFilters.map((filter, index) => (
              <Button
                key={index}
                size="small"
                onClick={filter.onClick}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  background: darkTheme.cardBackgroundAlt,
                  borderColor: darkTheme.border,
                  color: darkTheme.textSecondary,
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: darkTheme.textSecondary }}>
              共 <span style={{ color: darkTheme.accent, fontWeight: 500 }}>{pagination.total}</span> 条
            </span>
            {data.length > 0 && (
              <>
                <span style={{ color: darkTheme.textSecondary }}>
                  平均收益: <span style={{
                    color: (data.reduce((sum, item) => sum + item.pnl_ratio, 0) / data.length) >= 0 ? darkTheme.positive : darkTheme.negative,
                    fontWeight: 500,
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
                  }}>
                    {(data.reduce((sum, item) => sum + item.pnl_ratio, 0) / data.length * 100).toFixed(2)}%
                  </span>
                </span>
                <span style={{ color: darkTheme.textSecondary }}>
                  平均胜率: <span style={{
                    color: (data.reduce((sum, item) => sum + item.win_ratio, 0) / data.length) >= 0.5 ? darkTheme.positive : darkTheme.negative,
                    fontWeight: 500,
                    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
                  }}>
                    {(data.reduce((sum, item) => sum + item.win_ratio, 0) / data.length * 100).toFixed(1)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => `${record.symbol}_${record.backtest_start_time}`}
          loading={{
            spinning: loading,
            indicator: <div style={{ color: darkTheme.accent }}>加载中...</div>,
          }}
          pagination={false}
          tableLayout="auto"
          size="small"
          scroll={{ x: 'max-content' }}
          style={{
            background: darkTheme.cardBackground,
          }}
          onRow={(record) => ({
            style: {
              background: darkTheme.cardBackground,
              color: darkTheme.textPrimary,
            },
          })}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={(page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize }));
              fetchBacktestResults(
                page, 
                pageSize, 
                sortConfig.field || undefined, 
                sortConfig.order || undefined
              );
            }}
            onShowSizeChange={(current, size) => {
              setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              fetchBacktestResults(
                1, 
                size, 
                sortConfig.field || undefined, 
                sortConfig.order || undefined
              );
            }}
            showSizeChanger
            pageSizeOptions={["10","20","50","100"]}
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
            size="small"
          />
        </div>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>回测详情</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>{selectedResult?.strategy_name}</Tag>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
        bodyStyle={{ padding: '16px', background: darkTheme.cardBackground }}
      >
        {selectedResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 头部信息卡片 */}
            <Card
              bordered={false}
              bodyStyle={{ padding: 16 }}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8 }}
            >
              <Row gutter={24} align="middle">
                <Col>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>股票信息</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                    {selectedResult.name} <span style={{ fontSize: 16, fontWeight: 'normal' }}>{selectedResult.symbol}</span>
                  </div>
                </Col>
                <Col style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>当前趋势</div>
                  <Tag
                    color={
                      selectedResult.trending_type === 'RisingUp' ? 'red' :
                      selectedResult.trending_type === 'DeadXDown' ? 'orange' :
                      selectedResult.trending_type === 'FallingDown' ? 'volcano' :
                      selectedResult.trending_type === 'Observing' ? 'blue' :
                      selectedResult.trending_type === 'UpDown' ? 'cyan' : 'default'
                    }
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {translateTrendingType(selectedResult.trending_type)}
                  </Tag>
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>收益率</div>
                  <div style={{
                    color: selectedResult.pnl_ratio >= 0 ? '#ffccc7' : '#b7eb8f',
                    fontSize: 28,
                    fontWeight: 'bold'
                  }}>
                    {selectedResult.pnl_ratio >= 0 ? '+' : ''}{(selectedResult.pnl_ratio * 100).toFixed(2)}%
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 核心指标 */}
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card title="📊 收益指标" size="small" bordered={false} bodyStyle={{ padding: 12 }}>
                  <Row gutter={[8, 12]}>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>收益率</div>
                      <div style={{
                        color: selectedResult.pnl_ratio >= 0 ? '#f5222d' : '#52c41a',
                        fontSize: 20,
                        fontWeight: 'bold'
                      }}>
                        {selectedResult.pnl_ratio >= 0 ? '+' : ''}{(selectedResult.pnl_ratio * 100).toFixed(2)}%
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>夏普比率</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: selectedResult.sharp_ratio >= 1 ? '#1890ff' : '#666' }}>
                        {selectedResult.sharp_ratio.toFixed(2)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>风险比率</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                        {selectedResult.risk_ratio.toFixed(2)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>最大回撤</div>
                      <div style={{ color: '#f5222d', fontSize: 20, fontWeight: 'bold' }}>
                        -{(selectedResult.max_drawdown * 100).toFixed(2)}%
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="📈 交易统计" size="small" bordered={false} bodyStyle={{ padding: 12 }}>
                  <Row gutter={[8, 12]}>
                    <Col span={8}>
                      <div style={{ color: '#888', fontSize: 12 }}>开仓次数</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedResult.open_count}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#888', fontSize: 12 }}>平仓次数</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{selectedResult.close_count}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#888', fontSize: 12 }}>亏损次数</div>
                      <div style={{ color: '#52c41a', fontSize: 20, fontWeight: 'bold' }}>{selectedResult.lose_count}</div>
                    </Col>
                    <Col span={24}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ color: '#888', fontSize: 12, flex: '0 0 60px' }}>胜率</div>
                        <Progress
                          percent={(selectedResult.win_ratio * 100)}
                          strokeColor={selectedResult.win_ratio >= 0.5 ? '#f5222d' : '#52c41a'}
                          trailColor="#f0f0f0"
                          size="small"
                        />
                        <span style={{ fontWeight: 'bold', color: selectedResult.win_ratio >= 0.5 ? '#f5222d' : '#52c41a' }}>
                          {(selectedResult.win_ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ color: '#888', fontSize: 12 }}>盈利次数</div>
                      <div style={{ color: '#f5222d', fontSize: 20, fontWeight: 'bold' }}>{selectedResult.win_count}</div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* 回测周期 */}
            <Card title="📅 回测周期" size="small" bordered={false} bodyStyle={{ padding: 12 }}>
              <Row gutter={24}>
                <Col>
                  <div style={{ color: '#888', fontSize: 12 }}>开始时间</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{dayjs(selectedResult.backtest_start_time).format('YYYY-MM-DD HH:mm')}</div>
                </Col>
                <Col>
                  <ArrowRightOutlined style={{ color: '#888' }} />
                </Col>
                <Col>
                  <div style={{ color: '#888', fontSize: 12 }}>结束时间</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{dayjs(selectedResult.backtest_end_time).format('YYYY-MM-DD HH:mm')}</div>
                </Col>
                <Col>
                  <div style={{ color: '#888', fontSize: 12 }}>持续天数</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {dayjs(selectedResult.backtest_end_time).diff(dayjs(selectedResult.backtest_start_time), 'day')} 天
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 附加信息 */}
            {(selectedResult.industry || selectedResult.market_cap) && (
              <Card title="🏢 基本信息" size="small" bordered={false} bodyStyle={{ padding: 12 }}>
                <Row gutter={24}>
                  {selectedResult.industry && (
                    <Col>
                      <div style={{ color: '#888', fontSize: 12 }}>所属行业</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedResult.industry}</div>
                    </Col>
                  )}
                  {selectedResult.market_cap && (
                    <Col>
                      <div style={{ color: '#888', fontSize: 12 }}>市值</div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedResult.market_cap} 亿</div>
                    </Col>
                  )}
                </Row>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* 多策略对比 Modal */}
      <Modal
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>📊 多策略对比</span>}
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ padding: '16px' }}
      >
        <Table
          dataSource={compareData}
          rowKey="strategy"
          pagination={false}
          size="small"
          columns={[
            {
              title: '策略名称',
              dataIndex: 'strategy',
              key: 'strategy',
              render: (text: string) => <Tag color="blue">{text}</Tag>,
            },
            {
              title: '平均收益率',
              dataIndex: 'pnl',
              key: 'pnl',
              align: 'right' as const,
              render: (value: number) => (
                <span style={{
                  color: value >= 0 ? '#ff4d4f' : '#52c41a',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {value.toFixed(2)}%
                </span>
              ),
            },
            {
              title: '胜率',
              dataIndex: 'winRate',
              key: 'winRate',
              align: 'right' as const,
              render: (value: number) => (
                <span style={{
                  color: value >= 50 ? '#ff4d4f' : '#52c41a',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {value.toFixed(1)}%
                </span>
              ),
            },
            {
              title: '平均夏普比率',
              dataIndex: 'sharpe',
              key: 'sharpe',
              align: 'right' as const,
              render: (value: number) => (
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {value.toFixed(2)}
                </span>
              ),
            },
          ]}
        />
      </Modal>

      {/* K线图表 Modal */}
      <Modal
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>{chartSymbol} - {chartName} K线图</span>}
        open={chartModalVisible}
        onCancel={() => {
          setChartModalVisible(false);
          setKlineData([]);
        }}
        footer={[
          <Button
            key="sync"
            type="primary"
            loading={klineLoading}
            onClick={async () => {
              if (!chartSymbol) return;
              try {
                setKlineLoading(true);
                await apiService.syncKlineData(chartSymbol);
                message.success('K线数据同步成功');
                // 重新获取数据
                const response = await apiService.getKlineData(chartSymbol);
                setKlineData(response.data || []);
              } catch (error) {
                message.error('K线数据同步失败');
              } finally {
                setKlineLoading(false);
              }
            }}
          >
            同步最新数据
          </Button>,
          <Button key="close" onClick={() => {
            setChartModalVisible(false);
            setKlineData([]);
          }}>
            关闭
          </Button>
        ]}
        width={1000}
        bodyStyle={{ padding: '16px' }}
      >
        {klineLoading && !klineData.length ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            加载中...
          </div>
        ) : (
          <StockChart
            data={klineData}
            symbol={chartSymbol}
            name={chartName}
          />
        )}
      </Modal>
    </div>
    </>
  );
};

export default BacktestResults;