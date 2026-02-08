import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import DataTable from '@/components/common/DataTable';
import ChartContainer from '@/components/common/ChartContainer';
import { cn } from '@/utils/cn';
import { MarketData } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// Mock data
const mockMarketOverview = {
  totalStocks: 5234,
  upStocks: 3245,
  downStocks: 1789,
  flatStocks: 200,
  limitUp: 45,
  limitDown: 12,
  totalVolume: 1234567890000,
  totalTurnover: 8765432100000,
};

const mockMarketTrend = [
  { time: '09:30', up: 3200, down: 1900, flat: 300 },
  { time: '10:00', up: 3150, down: 1950, flat: 250 },
  { time: '10:30', up: 3100, down: 2000, flat: 200 },
  { time: '11:00', up: 3180, down: 1920, flat: 230 },
  { time: '11:30', up: 3220, down: 1880, flat: 210 },
  { time: '13:00', up: 3245, down: 1789, flat: 200 },
];

const mockStockList: MarketData[] = [
  {
    symbol: '600000',
    name: '浦发银行',
    price: 8.95,
    change: 0.45,
    changePercent: 5.28,
    volume: 123456789,
    turnover: 1104567890,
    high: 9.12,
    low: 8.76,
    open: 8.82,
    prevClose: 8.50,
    timestamp: Date.now(),
  },
  {
    symbol: '000002',
    name: '万科A',
    price: 15.60,
    change: -0.34,
    changePercent: -2.13,
    volume: 98765432,
    turnover: 1543210987,
    high: 16.00,
    low: 15.45,
    open: 15.89,
    prevClose: 15.94,
    timestamp: Date.now(),
  },
  {
    symbol: '600036',
    name: '招商银行',
    price: 42.35,
    change: 1.23,
    changePercent: 2.99,
    volume: 76543210,
    turnover: 3245678901,
    high: 42.80,
    low: 41.90,
    open: 42.10,
    prevClose: 41.12,
    timestamp: Date.now(),
  },
  {
    symbol: '000858',
    name: '五粮液',
    price: 168.50,
    change: -3.50,
    changePercent: -2.04,
    volume: 34567890,
    turnover: 5823456789,
    high: 172.00,
    low: 167.80,
    open: 171.20,
    prevClose: 172.00,
    timestamp: Date.now(),
  },
  {
    symbol: '600519',
    name: '贵州茅台',
    price: 1780.00,
    change: 25.00,
    changePercent: 1.42,
    volume: 12345678,
    turnover: 21876543210,
    high: 1795.00,
    low: 1765.00,
    open: 1770.00,
    prevClose: 1755.00,
    timestamp: Date.now(),
  },
  {
    symbol: '000001',
    name: '平安银行',
    price: 12.34,
    change: 0.56,
    changePercent: 4.76,
    volume: 156789012,
    turnover: 1934567890,
    high: 12.50,
    low: 12.00,
    open: 12.10,
    prevClose: 11.78,
    timestamp: Date.now(),
  },
  {
    symbol: '002415',
    name: '海康威视',
    price: 35.67,
    change: -0.89,
    changePercent: -2.44,
    volume: 67890123,
    turnover: 2423456789,
    high: 36.50,
    low: 35.40,
    open: 36.20,
    prevClose: 36.56,
    timestamp: Date.now(),
  },
  {
    symbol: '600887',
    name: '伊利股份',
    price: 28.90,
    change: 0.78,
    changePercent: 2.77,
    volume: 89012345,
    turnover: 2573456789,
    high: 29.20,
    low: 28.50,
    open: 28.70,
    prevClose: 28.12,
    timestamp: Date.now(),
  },
];

export const Market: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'up' | 'down'>('all');
  const [sortField, setSortField] = useState<string>('changePercent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter and sort data
  const filteredData = useMemo(() => {
    let data = [...mockStockList];

    // Search filter
    if (searchTerm) {
      data = data.filter(
        (stock) =>
          stock.symbol.includes(searchTerm) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType === 'up') {
      data = data.filter((stock) => stock.changePercent > 0);
    } else if (filterType === 'down') {
      data = data.filter((stock) => stock.changePercent < 0);
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[sortField as keyof MarketData] as number;
      const bVal = b[sortField as keyof MarketData] as number;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [searchTerm, filterType, sortField, sortOrder]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'symbol',
      title: '代码',
      width: '100px',
      sortable: true,
      render: (value: string) => (
        <span className="font-mono font-medium text-[var(--text-primary)]">{value}</span>
      ),
    },
    {
      key: 'name',
      title: '名称',
      width: '150px',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-[var(--text-primary)]">{value}</span>
      ),
    },
    {
      key: 'price',
      title: '最新价',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono font-medium text-[var(--text-primary)]">
          ¥{value.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'change',
      title: '涨跌额',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span
          className={cn(
            'font-mono font-medium',
            value > 0 ? 'text-red-400' : value < 0 ? 'text-green-400' : 'text-[var(--text-secondary)]'
          )}
        >
          {value > 0 ? '+' : ''}
          {value.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'changePercent',
      title: '涨跌幅',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <div className="flex items-center justify-end gap-1">
          {value > 0 ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : value < 0 ? (
            <TrendingDown className="w-4 h-4 text-green-400" />
          ) : null}
          <span
            className={cn(
              'font-mono font-medium',
              value > 0 ? 'text-red-400' : value < 0 ? 'text-green-400' : 'text-[var(--text-secondary)]'
            )}
          >
            {value > 0 ? '+' : ''}
            {value.toFixed(2)}%
          </span>
        </div>
      ),
    },
    {
      key: 'volume',
      title: '成交量',
      width: '120px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-secondary)]">
          {(value / 10000).toFixed(0)}万
        </span>
      ),
    },
    {
      key: 'turnover',
      title: '成交额',
      width: '120px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-secondary)]">
          {(value / 100000000).toFixed(2)}亿
        </span>
      ),
    },
    {
      key: 'high',
      title: '最高',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-secondary)]">¥{value.toFixed(2)}</span>
      ),
    },
    {
      key: 'low',
      title: '最低',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-secondary)]">¥{value.toFixed(2)}</span>
      ),
    },
    {
      key: 'open',
      title: '今开',
      width: '100px',
      sortable: true,
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-secondary)]">¥{value.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">实时行情</h1>
          <p className="text-[var(--text-secondary)] mt-1">沪深A股实时市场数据</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">最后更新</p>
          <p className="text-sm font-mono text-[var(--text-primary)]">
            {new Date().toLocaleTimeString('zh-CN')}
          </p>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="上涨家数"
          value={mockMarketOverview.upStocks.toString()}
          change={`${((mockMarketOverview.upStocks / mockMarketOverview.totalStocks) * 100).toFixed(1)}%`}
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="up"
        />
        <MetricCard
          title="下跌家数"
          value={mockMarketOverview.downStocks.toString()}
          change={`${((mockMarketOverview.downStocks / mockMarketOverview.totalStocks) * 100).toFixed(1)}%`}
          changeType="negative"
          icon={<TrendingDown className="w-5 h-5" />}
          trend="down"
        />
        <MetricCard
          title="涨停数量"
          value={mockMarketOverview.limitUp.toString()}
          changeType="positive"
          icon={<span className="text-lg">🚀</span>}
          trend="up"
        />
        <MetricCard
          title="跌停数量"
          value={mockMarketOverview.limitDown.toString()}
          changeType="negative"
          icon={<span className="text-lg">📉</span>}
          trend="down"
        />
      </div>

      {/* Market Trend Chart */}
      <ChartContainer
        title="市场涨跌家数趋势"
        subtitle="实时跟踪市场整体走势"
        height="300px"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockMarketTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
            <XAxis dataKey="time" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="up"
              stroke="#00d084"
              strokeWidth={2}
              name="上涨"
            />
            <Line
              type="monotone"
              dataKey="down"
              stroke="#ff4757"
              strokeWidth={2}
              name="下跌"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Stock List */}
      <div className="card">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="搜索股票代码或名称..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
            <select
              className="input"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="all">全部</option>
              <option value="up">上涨</option>
              <option value="down">下跌</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          loading={false}
          pagination={true}
          pageSize={pageSize}
          currentPage={currentPage}
          total={filteredData.length}
          onSort={handleSort}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Market;
