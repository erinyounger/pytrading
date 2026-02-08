import React, { useState, useMemo } from 'react';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Search,
  Volume2,
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import DataTable from '@/components/common/DataTable';
import { cn } from '@/utils/cn';
import { Signal } from '@/types';

// Mock data
const mockSignalStats = {
  total: 1245,
  today: 23,
  buy: 12,
  sell: 11,
  strong: 8,
  medium: 10,
  weak: 5,
};

const mockSignals: Signal[] = [
  {
    id: '1',
    symbol: '600000',
    name: '浦发银行',
    type: 'buy',
    strength: 0.85,
    strategy: 'MACD趋势策略',
    price: 8.95,
    volume: 123456789,
    timestamp: '2026-01-17 14:35:22',
    reason: 'MACD线上穿信号线，金叉形成，成交量放大',
    isRead: false,
  },
  {
    id: '2',
    symbol: '000002',
    name: '万科A',
    type: 'sell',
    strength: 0.72,
    strategy: '布林带突破策略',
    price: 15.60,
    volume: 98765432,
    timestamp: '2026-01-17 14:32:15',
    reason: '价格跌破布林带下轨，超卖信号',
    isRead: false,
  },
  {
    id: '3',
    symbol: '600036',
    name: '招商银行',
    type: 'buy',
    strength: 0.91,
    strategy: '双均线交叉策略',
    price: 42.35,
    volume: 76543210,
    timestamp: '2026-01-17 14:28:33',
    reason: '5日线上穿20日线，金叉确认，MACD多头排列',
    isRead: true,
  },
  {
    id: '4',
    symbol: '000858',
    name: '五粮液',
    type: 'sell',
    strength: 0.65,
    strategy: 'RSI反转策略',
    price: 168.50,
    volume: 34567890,
    timestamp: '2026-01-17 14:25:44',
    reason: 'RSI超过70，超买信号出现',
    isRead: true,
  },
  {
    id: '5',
    symbol: '600519',
    name: '贵州茅台',
    type: 'buy',
    strength: 0.78,
    strategy: 'MACD趋势策略',
    price: 1780.00,
    volume: 12345678,
    timestamp: '2026-01-17 14:20:55',
    reason: 'MACD柱状线翻红，量价齐升',
    isRead: false,
  },
  {
    id: '6',
    symbol: '000001',
    name: '平安银行',
    type: 'buy',
    strength: 0.88,
    strategy: '海龟交易策略',
    price: 12.34,
    volume: 156789012,
    timestamp: '2026-01-17 14:18:12',
    reason: '突破20日高点，买入信号确认',
    isRead: true,
  },
  {
    id: '7',
    symbol: '002415',
    name: '海康威视',
    type: 'sell',
    strength: 0.56,
    strategy: '布林带突破策略',
    price: 35.67,
    volume: 67890123,
    timestamp: '2026-01-17 14:15:33',
    reason: '跌破布林带中轨，趋势转弱',
    isRead: true,
  },
  {
    id: '8',
    symbol: '600887',
    name: '伊利股份',
    type: 'buy',
    strength: 0.73,
    strategy: '双均线交叉策略',
    price: 28.90,
    volume: 89012345,
    timestamp: '2026-01-17 14:10:21',
    reason: '短期均线向上穿越长期均线',
    isRead: false,
  },
];

export const SignalPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterStrength, setFilterStrength] = useState<'all' | 'strong' | 'medium' | 'weak'>('all');
  const [filterStrategy, setFilterStrategy] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter signals
  const filteredSignals = useMemo(() => {
    let data = [...mockSignals];

    // Search filter
    if (searchTerm) {
      data = data.filter(
        (signal) =>
          signal.symbol.includes(searchTerm) ||
          signal.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      data = data.filter((signal) => signal.type === filterType);
    }

    // Strength filter
    if (filterStrength !== 'all') {
      data = data.filter((signal) => {
        if (filterStrength === 'strong') return signal.strength >= 0.8;
        if (filterStrength === 'medium') return signal.strength >= 0.6 && signal.strength < 0.8;
        if (filterStrength === 'weak') return signal.strength < 0.6;
        return true;
      });
    }

    // Strategy filter
    if (filterStrategy !== 'all') {
      data = data.filter((signal) => signal.strategy === filterStrategy);
    }

    // Sort by timestamp (latest first)
    data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return data;
  }, [searchTerm, filterType, filterStrength, filterStrategy]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredSignals.slice(start, end);
  }, [filteredSignals, currentPage]);

  const getStrengthBadge = (strength: number) => {
    if (strength >= 0.8) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">强</span>;
    } else if (strength >= 0.6) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">中</span>;
    } else {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-400">弱</span>;
    }
  };

  const columns = [
    {
      key: 'timestamp',
      title: '时间',
      width: '150px',
      render: (value: string, record: Signal) => (
        <div className="flex items-center gap-2">
          {!record.isRead && <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />}
          <span className="text-[var(--text-secondary)] text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'symbol',
      title: '股票',
      width: '120px',
      render: (value: string, record: Signal) => (
        <div>
          <div className="font-mono font-medium text-[var(--text-primary)]">{value}</div>
          <div className="text-xs text-[var(--text-secondary)]">{record.name}</div>
        </div>
      ),
    },
    {
      key: 'type',
      title: '信号类型',
      width: '100px',
      render: (value: Signal['type']) => (
        <div className="flex items-center gap-2">
          {value === 'buy' ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-green-400" />
          )}
          <span className={cn('font-medium', value === 'buy' ? 'text-red-400' : 'text-green-400')}>
            {value === 'buy' ? '买入' : '卖出'}
          </span>
        </div>
      ),
    },
    {
      key: 'strength',
      title: '信号强度',
      width: '100px',
      render: (strength: number) => (
        <div className="flex items-center gap-2">
          {getStrengthBadge(strength)}
          <span className="text-[var(--text-secondary)] text-sm">
            {(strength * 100).toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      title: '价格',
      width: '100px',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-primary)]">¥{value.toFixed(2)}</span>
      ),
    },
    {
      key: 'volume',
      title: '成交量',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => (
        <span className="text-[var(--text-secondary)]">
          {(value / 10000).toFixed(0)}万
        </span>
      ),
    },
    {
      key: 'strategy',
      title: '策略',
      width: '150px',
      render: (value: string) => (
        <span className="text-[var(--text-secondary)]">{value}</span>
      ),
    },
    {
      key: 'reason',
      title: '信号原因',
      width: '300px',
      render: (value: string) => (
        <div className="text-[var(--text-secondary)] text-sm truncate" title={value}>
          {value}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">交易信号</h1>
          <p className="text-[var(--text-secondary)] mt-1">实时监控和查看交易信号</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            声音提醒
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="今日信号"
          value={mockSignalStats.today.toString()}
          icon={<Bell className="w-5 h-5" />}
          change={`买入 ${mockSignalStats.buy} | 卖出 ${mockSignalStats.sell}`}
          changeType="neutral"
        />
        <MetricCard
          title="强信号"
          value={mockSignalStats.strong.toString()}
          icon={<span className="text-lg">🔥</span>}
          changeType="positive"
        />
        <MetricCard
          title="中信号"
          value={mockSignalStats.medium.toString()}
          icon={<span className="text-lg">⚡</span>}
          changeType="neutral"
        />
        <MetricCard
          title="弱信号"
          value={mockSignalStats.weak.toString()}
          icon={<span className="text-lg">💡</span>}
          changeType="neutral"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="搜索股票代码或名称..."
              className="input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">全部类型</option>
            <option value="buy">买入信号</option>
            <option value="sell">卖出信号</option>
          </select>
          <select
            className="input"
            value={filterStrength}
            onChange={(e) => setFilterStrength(e.target.value as any)}
          >
            <option value="all">全部强度</option>
            <option value="strong">强信号</option>
            <option value="medium">中信号</option>
            <option value="weak">弱信号</option>
          </select>
          <select
            className="input"
            value={filterStrategy}
            onChange={(e) => setFilterStrategy(e.target.value)}
          >
            <option value="all">全部策略</option>
            <option value="MACD趋势策略">MACD趋势策略</option>
            <option value="布林带突破策略">布林带突破策略</option>
            <option value="双均线交叉策略">双均线交叉策略</option>
            <option value="RSI反转策略">RSI反转策略</option>
            <option value="海龟交易策略">海龟交易策略</option>
          </select>
        </div>

        {/* Signal List */}
        <DataTable
          columns={columns}
          data={paginatedData}
          loading={false}
          pagination={true}
          pageSize={pageSize}
          currentPage={currentPage}
          total={filteredSignals.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default SignalPage;
