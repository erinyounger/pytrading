import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Pause,
  Square,
  Code,
  Settings,
  TrendingUp,
  Copy,
  Trash2,
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import DataTable from '@/components/common/DataTable';
import ChartContainer from '@/components/common/ChartContainer';
import { cn } from '@/utils/cn';
import { Strategy } from '@/types';
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
const mockStrategyStats = {
  total: 12,
  running: 5,
  paused: 4,
  stopped: 3,
  avgReturn: 18.56,
};

const mockStrategies: Strategy[] = [
  {
    id: 's1',
    name: 'MACD趋势策略',
    type: 'trend',
    status: 'running',
    description: '基于MACD指标的趋势跟踪策略，当MACD线上穿信号线时买入，下穿时卖出',
    parameters: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      stopLoss: 5,
    },
    stockCount: 50,
    todayReturn: 1.23,
    totalReturn: 25.67,
    sharpeRatio: 1.45,
    maxDrawdown: -8.23,
    createdAt: '2025-12-01',
    updatedAt: '2026-01-15',
  },
  {
    id: 's2',
    name: '布林带突破策略',
    type: 'breakout',
    status: 'running',
    description: '利用布林带上下轨的突破信号进行交易，价格突破上轨买入，突破下轨卖出',
    parameters: {
      period: 20,
      stdDev: 2,
      stopLoss: 3,
    },
    stockCount: 30,
    todayReturn: 0.85,
    totalReturn: 18.34,
    sharpeRatio: 1.32,
    maxDrawdown: -6.45,
    createdAt: '2025-11-15',
    updatedAt: '2026-01-14',
  },
  {
    id: 's3',
    name: '双均线交叉策略',
    type: 'momentum',
    status: 'paused',
    description: '使用5日和20日移动平均线，金叉买入，死叉卖出',
    parameters: {
      shortPeriod: 5,
      longPeriod: 20,
      stopLoss: 4,
    },
    stockCount: 80,
    todayReturn: -0.12,
    totalReturn: 15.78,
    sharpeRatio: 1.28,
    maxDrawdown: -7.12,
    createdAt: '2025-10-20',
    updatedAt: '2026-01-10',
  },
  {
    id: 's4',
    name: 'RSI反转策略',
    type: 'mean_reversion',
    status: 'running',
    description: '基于RSI指标的超买超卖反转策略，RSI低于30买入，高于70卖出',
    parameters: {
      period: 14,
      overbought: 70,
      oversold: 30,
    },
    stockCount: 40,
    todayReturn: 0.56,
    totalReturn: 12.45,
    sharpeRatio: 1.15,
    maxDrawdown: -5.67,
    createdAt: '2025-09-10',
    updatedAt: '2026-01-08',
  },
  {
    id: 's5',
    name: '海龟交易策略',
    type: 'trend',
    status: 'stopped',
    description: '经典的海龟交易法则，基于价格突破进行交易',
    parameters: {
      entryPeriod: 20,
      exitPeriod: 10,
      atrPeriod: 14,
    },
    stockCount: 20,
    todayReturn: 0,
    totalReturn: 8.92,
    sharpeRatio: 0.95,
    maxDrawdown: -12.34,
    createdAt: '2025-08-01',
    updatedAt: '2025-12-20',
  },
];

export const StrategyPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter strategies
  const filteredStrategies = useMemo(() => {
    if (filterStatus === 'all') return mockStrategies;
    return mockStrategies.filter((s) => s.status === filterStatus);
  }, [filterStatus]);

  const getStatusBadge = (status: Strategy['status']) => {
    const statusMap = {
      running: { label: '运行中', className: 'bg-green-500/20 text-green-400' },
      paused: { label: '已暂停', className: 'bg-yellow-500/20 text-yellow-400' },
      stopped: { label: '已停止', className: 'bg-gray-500/20 text-gray-400' },
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

  const getTypeLabel = (type: Strategy['type']) => {
    const typeMap = {
      trend: '趋势跟踪',
      mean_reversion: '均值回归',
      breakout: '突破交易',
      momentum: '动量交易',
    };
    return typeMap[type] || type;
  };

  const columns = [
    {
      key: 'name',
      title: '策略名称',
      width: '200px',
      render: (value: string, record: Strategy) => (
        <button
          onClick={() => {
            setSelectedStrategy(record);
            setSelectedTab('detail');
          }}
          className="text-left hover:text-[var(--brand-primary)] transition-colors"
        >
          <div className="font-medium text-[var(--text-primary)]">{value}</div>
          <div className="text-xs text-[var(--text-secondary)]">
            {getTypeLabel(record.type)}
          </div>
        </button>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (status: Strategy['status']) => getStatusBadge(status),
    },
    {
      key: 'stockCount',
      title: '股票数量',
      width: '100px',
      align: 'center' as const,
      render: (value: number) => (
        <span className="text-[var(--text-secondary)]">{value}</span>
      ),
    },
    {
      key: 'todayReturn',
      title: '今日收益',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => (
        <span
          className={cn(
            'font-mono font-medium',
            value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'
          )}
        >
          {value > 0 ? '+' : ''}
          {value.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'totalReturn',
      title: '总收益率',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => (
        <span
          className={cn(
            'font-mono font-medium',
            value > 0 ? 'text-green-400' : 'text-red-400'
          )}
        >
          {value > 0 ? '+' : ''}
          {value.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'sharpeRatio',
      title: '夏普比率',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-[var(--text-primary)]">{value.toFixed(2)}</span>
      ),
    },
    {
      key: 'maxDrawdown',
      title: '最大回撤',
      width: '120px',
      align: 'right' as const,
      render: (value: number) => (
        <span className="font-mono text-red-400">{value.toFixed(2)}%</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      render: (_: any, record: Strategy) => (
        <div className="flex items-center gap-2">
          {record.status === 'running' ? (
            <button className="p-1 hover:bg-[var(--bg-hover)] rounded">
              <Pause className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          ) : (
            <button className="p-1 hover:bg-[var(--bg-hover)] rounded">
              <Play className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}
          <button className="p-1 hover:bg-[var(--bg-hover)] rounded">
            <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button className="p-1 hover:bg-[var(--bg-hover)] rounded">
            <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button className="p-1 hover:bg-[var(--bg-hover)] rounded">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  const CreateStrategyForm = () => (
    <div className="card">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">创建新策略</h3>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              策略名称
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="请输入策略名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              策略类型
            </label>
            <select className="input w-full">
              <option value="trend">趋势跟踪</option>
              <option value="mean_reversion">均值回归</option>
              <option value="breakout">突破交易</option>
              <option value="momentum">动量交易</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            策略描述
          </label>
          <textarea
            className="input w-full h-24"
            placeholder="请输入策略描述"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            策略参数
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">快速周期</label>
              <input type="number" className="input w-full" defaultValue="12" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">慢速周期</label>
              <input type="number" className="input w-full" defaultValue="26" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">信号周期</label>
              <input type="number" className="input w-full" defaultValue="9" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">止损比例(%)</label>
              <input type="number" className="input w-full" defaultValue="5" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            策略代码
          </label>
          <textarea
            className="input w-full h-64 font-mono text-sm"
            placeholder="请输入策略代码（Python）"
            defaultValue={`def strategy_logic(data):
    """
    策略逻辑实现
    """
    # 计算MACD指标
    macd_line, signal_line, histogram = calculate_macd(data)

    # 生成交易信号
    signals = []
    for i in range(len(data)):
        if macd_line[i] > signal_line[i] and macd_line[i-1] <= signal_line[i-1]:
            signals.append({'type': 'buy', 'price': data[i]['close']})
        elif macd_line[i] < signal_line[i] and macd_line[i-1] >= signal_line[i-1]:
            signals.append({'type': 'sell', 'price': data[i]['close']})

    return signals`}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" className="btn btn-secondary">
            重置
          </button>
          <button type="button" className="btn btn-primary">
            保存策略
          </button>
        </div>
      </form>
    </div>
  );

  const StrategyDetail = () => {
    if (!selectedStrategy) return null;

    const performanceData = [
      { date: '01-01', value: 0 },
      { date: '01-08', value: 2.3 },
      { date: '01-15', value: 5.6 },
      { date: '01-22', value: 8.9 },
      { date: '01-29', value: 12.4 },
      { date: '02-05', value: 15.7 },
      { date: '02-12', value: selectedStrategy.totalReturn },
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
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{selectedStrategy.name}</h2>
            <p className="text-[var(--text-secondary)] mt-1">{getTypeLabel(selectedStrategy.type)}</p>
          </div>
          <div className="flex gap-2">
            {selectedStrategy.status === 'running' ? (
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
            ) : (
              <button className="btn btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" />
                启动
              </button>
            )}
            <button className="btn btn-secondary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              编辑
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="状态"
            value={
              selectedStrategy.status === 'running'
                ? '运行中'
                : selectedStrategy.status === 'paused'
                ? '已暂停'
                : '已停止'
            }
            icon={
              selectedStrategy.status === 'running' ? (
                <Play className="w-5 h-5" />
              ) : selectedStrategy.status === 'paused' ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )
            }
          />
          <MetricCard
            title="股票数量"
            value={selectedStrategy.stockCount.toString()}
            icon={<span className="text-lg">📊</span>}
          />
          <MetricCard
            title="总收益率"
            value={`${selectedStrategy.totalReturn.toFixed(2)}%`}
            change={`${selectedStrategy.todayReturn.toFixed(2)}%`}
            changeType={selectedStrategy.totalReturn > 0 ? 'positive' : 'negative'}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="up"
          />
          <MetricCard
            title="夏普比率"
            value={selectedStrategy.sharpeRatio.toFixed(2)}
            icon={<span className="text-lg">📈</span>}
          />
        </div>

        {/* Performance Chart */}
        <ChartContainer
          title="收益曲线"
          subtitle="策略累计收益率走势"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
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

        {/* Strategy Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">基本信息</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">策略类型</div>
                <div className="text-[var(--text-primary)] font-medium">
                  {getTypeLabel(selectedStrategy.type)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">股票数量</div>
                <div className="text-[var(--text-primary)] font-medium">
                  {selectedStrategy.stockCount}只
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">创建时间</div>
                <div className="text-[var(--text-primary)] font-medium">{selectedStrategy.createdAt}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">更新时间</div>
                <div className="text-[var(--text-primary)] font-medium">{selectedStrategy.updatedAt}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">策略参数</h4>
            <div className="space-y-2">
              {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">{key}</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">策略描述</h4>
          <p className="text-[var(--text-primary)] leading-relaxed">{selectedStrategy.description}</p>
        </div>
      </div>
    );
  };

  if (selectedTab === 'create') {
    return <CreateStrategyForm />;
  }

  if (selectedTab === 'detail') {
    return <StrategyDetail />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">策略管理</h1>
          <p className="text-[var(--text-secondary)] mt-1">创建和管理量化交易策略</p>
        </div>
        <button
          onClick={() => setSelectedTab('create')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建策略
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="总策略数"
          value={mockStrategyStats.total.toString()}
          icon={<Code className="w-5 h-5" />}
        />
        <MetricCard
          title="运行中"
          value={mockStrategyStats.running.toString()}
          icon={<Play className="w-5 h-5" />}
          changeType="positive"
        />
        <MetricCard
          title="已暂停"
          value={mockStrategyStats.paused.toString()}
          icon={<Pause className="w-5 h-5" />}
          changeType="neutral"
        />
        <MetricCard
          title="已停止"
          value={mockStrategyStats.stopped.toString()}
          icon={<Square className="w-5 h-5" />}
          changeType="negative"
        />
        <MetricCard
          title="平均收益"
          value={`${mockStrategyStats.avgReturn.toFixed(2)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="positive"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          className="input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="running">运行中</option>
          <option value="paused">已暂停</option>
          <option value="stopped">已停止</option>
        </select>
      </div>

      {/* Strategy List */}
      <DataTable
        columns={columns}
        data={filteredStrategies}
        loading={false}
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default StrategyPage;
