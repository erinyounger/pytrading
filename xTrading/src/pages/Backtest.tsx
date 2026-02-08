import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  TrendingUp,
  TrendingDown,
  Plus,
  BarChart3,
  Clock,
  Filter,
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import DataTable from '@/components/common/DataTable';
import ChartContainer from '@/components/common/ChartContainer';
import { cn } from '@/utils/cn';
import { Backtest } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

// Mock data
const mockBacktestStats = {
  total: 156,
  running: 5,
  completed: 138,
  failed: 13,
  avgReturn: 15.67,
};

const mockBacktests: Backtest[] = [
  {
    id: '1',
    name: 'MACD策略回测-202601',
    strategyId: 's1',
    strategyName: 'MACD趋势策略',
    status: 'completed',
    progress: 100,
    startTime: '2026-01-15 09:00:00',
    endTime: '2026-01-15 09:45:23',
    duration: 2723,
    stockCount: 100,
    parameters: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    },
    results: {
      totalReturn: 18.56,
      annualizedReturn: 22.34,
      sharpeRatio: 1.45,
      maxDrawdown: -8.23,
      winRate: 65.5,
      profitLossRatio: 1.85,
      totalTrades: 234,
      avgHoldingPeriod: 5.2,
      returnData: [
        { date: '01-01', value: 0 },
        { date: '01-08', value: 2.3 },
        { date: '01-15', value: 5.6 },
        { date: '01-22', value: 8.9 },
        { date: '01-29', value: 12.4 },
        { date: '02-05', value: 15.7 },
        { date: '02-12', value: 18.56 },
      ],
    },
  },
  {
    id: '2',
    name: '布林带策略回测-202601',
    strategyId: 's2',
    strategyName: '布林带突破策略',
    status: 'completed',
    progress: 100,
    startTime: '2026-01-14 14:30:00',
    endTime: '2026-01-14 15:12:45',
    duration: 2565,
    stockCount: 50,
    parameters: {
      period: 20,
      stdDev: 2,
    },
    results: {
      totalReturn: 12.34,
      annualizedReturn: 15.78,
      sharpeRatio: 1.23,
      maxDrawdown: -6.45,
      winRate: 58.3,
      profitLossRatio: 1.62,
      totalTrades: 156,
      avgHoldingPeriod: 3.8,
      returnData: [
        { date: '01-01', value: 0 },
        { date: '01-08', value: 1.5 },
        { date: '01-15', value: 4.2 },
        { date: '01-22', value: 7.1 },
        { date: '01-29', value: 9.8 },
        { date: '02-05', value: 11.2 },
        { date: '02-12', value: 12.34 },
      ],
    },
  },
  {
    id: '3',
    name: '双均线策略回测-202601',
    strategyId: 's3',
    strategyName: '双均线交叉策略',
    status: 'running',
    progress: 67,
    startTime: '2026-01-17 10:00:00',
    stockCount: 200,
    parameters: {
      shortPeriod: 5,
      longPeriod: 20,
    },
  },
  {
    id: '4',
    name: 'RSI策略回测-202601',
    strategyId: 's4',
    strategyName: 'RSI反转策略',
    status: 'pending',
    progress: 0,
    startTime: '2026-01-17 11:00:00',
    stockCount: 80,
    parameters: {
      period: 14,
      overbought: 70,
      oversold: 30,
    },
  },
  {
    id: '5',
    name: '海龟策略回测-202601',
    strategyId: 's5',
    strategyName: '海龟交易策略',
    status: 'failed',
    progress: 0,
    startTime: '2026-01-16 09:30:00',
    stockCount: 150,
    parameters: {
      entryPeriod: 20,
      exitPeriod: 10,
      atrPeriod: 14,
    },
  },
];

export const BacktestPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedBacktest, setSelectedBacktest] = useState<Backtest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter backtests
  const filteredBacktests = useMemo(() => {
    if (filterStatus === 'all') return mockBacktests;
    return mockBacktests.filter((bt) => bt.status === filterStatus);
  }, [filterStatus]);

  const getStatusBadge = (status: Backtest['status']) => {
    const statusMap = {
      pending: { label: '等待中', className: 'bg-gray-500/20 text-gray-400' },
      running: { label: '运行中', className: 'bg-blue-500/20 text-blue-400' },
      completed: { label: '已完成', className: 'bg-green-500/20 text-green-400' },
      failed: { label: '已失败', className: 'bg-red-500/20 text-red-400' },
    };

    return (
      <span
        className={cn(
          'px-2 py-1 rounded text-xs font-medium',
          statusMap[status].className
        )}
      >
        {statusMap[status].label}
      </span>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const columns = [
    {
      key: 'name',
      title: '回测名称',
      width: '200px',
      render: (value: string, record: Backtest) => (
        <button
          onClick={() => {
            setSelectedBacktest(record);
            setSelectedTab('detail');
          }}
          className="text-left hover:text-[var(--brand-primary)] transition-colors"
        >
          <div className="font-medium text-[var(--text-primary)]">{value}</div>
          <div className="text-xs text-[var(--text-secondary)]">{record.strategyName}</div>
        </button>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (status: Backtest['status']) => getStatusBadge(status),
    },
    {
      key: 'progress',
      title: '进度',
      width: '150px',
      render: (progress: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--brand-primary)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-secondary)] w-12">{progress}%</span>
        </div>
      ),
    },
    {
      key: 'stockCount',
      title: '股票数量',
      width: '100px',
      align: 'right' as const,
      render: (value: number, _record: any) => (
        <span className="text-[var(--text-secondary)]">{value}</span>
      ),
    },
    {
      key: 'duration',
      title: '耗时',
      width: '100px',
      align: 'right' as const,
      render: (value: number, _record: any) => (
        <span className="text-[var(--text-secondary)]">
          {value ? formatDuration(value) : '-'}
        </span>
      ),
    },
    {
      key: 'totalReturn',
      title: '总收益率',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => {
        if (!value) return <span>-</span>;
        return (
          <span
            className={cn(
              'font-mono font-medium',
              value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'
            )}
          >
            {value > 0 ? '+' : ''}
            {value.toFixed(2)}%
          </span>
        );
      },
    },
    {
      key: 'sharpeRatio',
      title: '夏普比率',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => {
        if (!value) return <span>-</span>;
        return <span className="font-mono text-[var(--text-primary)]">{value.toFixed(2)}</span>;
      },
    },
    {
      key: 'maxDrawdown',
      title: '最大回撤',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => {
        if (!value) return <span>-</span>;
        return <span className="font-mono text-red-400">{value.toFixed(2)}%</span>;
      },
    },
  ];

  const CreateBacktestForm = () => (
    <div className="card">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">创建新回测</h3>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              回测名称
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="请输入回测名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              选择策略
            </label>
            <select className="input w-full">
              <option value="">请选择策略</option>
              <option value="s1">MACD趋势策略</option>
              <option value="s2">布林带突破策略</option>
              <option value="s3">双均线交叉策略</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              开始日期
            </label>
            <input type="date" className="input w-full" defaultValue="2025-01-01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              结束日期
            </label>
            <input type="date" className="input w-full" defaultValue="2025-12-31" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              股票代码
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="例如：600000,000002,600036"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              初始资金
            </label>
            <input
              type="number"
              className="input w-full"
              placeholder="1000000"
              defaultValue="1000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            策略参数
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">快线周期</label>
              <input type="number" className="input w-full" defaultValue="12" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">慢线周期</label>
              <input type="number" className="input w-full" defaultValue="26" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">信号周期</label>
              <input type="number" className="input w-full" defaultValue="9" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">手续费</label>
              <input type="number" className="input w-full" step="0.001" defaultValue="0.003" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" className="btn btn-secondary">
            重置
          </button>
          <button type="button" className="btn btn-primary">
            开始回测
          </button>
        </div>
      </form>
    </div>
  );

  const BacktestDetail = () => {
    if (!selectedBacktest) return null;

    const monthlyReturnData = [
      { month: '1月', return: 2.3, benchmark: 1.8 },
      { month: '2月', return: 3.2, benchmark: 2.1 },
      { month: '3月', return: -1.2, benchmark: -0.8 },
      { month: '4月', return: 4.5, benchmark: 3.2 },
      { month: '5月', return: 2.8, benchmark: 2.5 },
      { month: '6月', return: 3.1, benchmark: 2.9 },
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedTab('list')}
              className="text-[var(--brand-primary)] hover:underline mb-2"
            >
              ← 返回列表
            </button>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedBacktest.name}</h2>
            <p className="text-[var(--text-secondary)] mt-1">{selectedBacktest.strategyName}</p>
          </div>
          <div className="flex gap-2">
            {selectedBacktest.status === 'running' && (
              <>
                <button className="btn btn-secondary flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  暂停
                </button>
                <button className="btn btn-danger flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  停止
                </button>
              </>
            )}
            {selectedBacktest.status === 'pending' && (
              <button className="btn btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" />
                开始
              </button>
            )}
          </div>
        </div>

        {/* Backtest Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="状态"
            value={selectedBacktest.status === 'completed' ? '已完成' : selectedBacktest.status === 'running' ? '运行中' : '等待中'}
            icon={
              selectedBacktest.status === 'completed' ? (
                <BarChart3 className="w-5 h-5" />
              ) : selectedBacktest.status === 'running' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )
            }
          />
          <MetricCard
            title="股票数量"
            value={selectedBacktest.stockCount.toString()}
            icon={<span className="text-lg">📊</span>}
          />
          <MetricCard
            title="总收益率"
            value={selectedBacktest.results ? `${selectedBacktest.results.totalReturn.toFixed(2)}%` : '-'}
            change={selectedBacktest.results ? selectedBacktest.results.totalReturn.toFixed(2) + '%' : undefined}
            changeType={selectedBacktest.results && selectedBacktest.results.totalReturn > 0 ? 'positive' : 'neutral'}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            title="夏普比率"
            value={selectedBacktest.results ? selectedBacktest.results.sharpeRatio.toFixed(2) : '-'}
            icon={<span className="text-lg">📈</span>}
          />
        </div>

        {/* Results */}
        {selectedBacktest.results && (
          <>
            {/* Return Curve */}
            <ChartContainer
              title="收益曲线"
              subtitle="回测期间累计收益率走势"
              height="350px"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedBacktest.results.returnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" />
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
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    name="收益率(%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Monthly Returns */}
            <ChartContainer
              title="月度收益"
              subtitle="各月收益率对比"
              height="300px"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReturnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="return" fill="#4f46e5" name="策略收益(%)" />
                  <Bar dataKey="benchmark" fill="#06b6d4" name="基准收益(%)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">收益指标</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">总收益率</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.totalReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">年化收益率</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.annualizedReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">最大回撤</span>
                    <span className="font-mono font-medium text-red-400">
                      {selectedBacktest.results.maxDrawdown.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">风险指标</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">夏普比率</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">胜率</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.winRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">盈亏比</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.profitLossRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">交易统计</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">总交易次数</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.totalTrades}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">平均持仓周期</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.avgHoldingPeriod.toFixed(1)}天
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">平均持仓周期</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {selectedBacktest.results.avgHoldingPeriod.toFixed(1)}天
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (selectedTab === 'create') {
    return <CreateBacktestForm />;
  }

  if (selectedTab === 'detail') {
    return <BacktestDetail />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">回测管理</h1>
          <p className="text-[var(--text-secondary)] mt-1">创建和管理量化策略回测</p>
        </div>
        <button
          onClick={() => setSelectedTab('create')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建回测
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="总回测数"
          value={mockBacktestStats.total.toString()}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <MetricCard
          title="运行中"
          value={mockBacktestStats.running.toString()}
          icon={<Clock className="w-5 h-5" />}
          changeType="neutral"
        />
        <MetricCard
          title="已完成"
          value={mockBacktestStats.completed.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="positive"
        />
        <MetricCard
          title="已失败"
          value={mockBacktestStats.failed.toString()}
          icon={<TrendingDown className="w-5 h-5" />}
          changeType="negative"
        />
        <MetricCard
          title="平均收益"
          value={`${mockBacktestStats.avgReturn.toFixed(2)}%`}
          icon={<span className="text-lg">💰</span>}
          changeType="positive"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="pending">等待中</option>
          <option value="running">运行中</option>
          <option value="completed">已完成</option>
          <option value="failed">已失败</option>
        </select>
      </div>

      {/* Backtest List */}
      <DataTable
        columns={columns}
        data={filteredBacktests}
        loading={false}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default BacktestPage;
