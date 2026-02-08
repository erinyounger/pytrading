import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import MetricCard from '@/components/common/MetricCard';
import ChartContainer from '@/components/common/ChartContainer';
import { cn } from '@/utils/cn';

// Mock data
const mockPortfolioData = {
  totalValue: 1234567.89,
  dayReturn: 12345.67,
  dayReturnPercent: 2.45,
  totalReturn: 234567.89,
  totalReturnPercent: 23.45,
};

const mockReturnData = [
  { date: '12-11', value: 1200000 },
  { date: '12-12', value: 1210000 },
  { date: '12-13', value: 1195000 },
  { date: '12-14', value: 1220000 },
  { date: '12-15', value: 1234567 },
];

const mockPositionData = [
  { name: '浦发银行', value: 35, amount: 432000 },
  { name: '招商银行', value: 28, amount: 345600 },
  { name: '万科A', value: 20, amount: 246900 },
  { name: '贵州茅台', value: 12, amount: 148100 },
  { name: '其他', value: 5, amount: 61700 },
];

const mockRecentTrades = [
  {
    id: '1',
    symbol: '600000',
    name: '浦发银行',
    side: 'buy',
    price: 8.95,
    quantity: 10000,
    timestamp: '2026-01-17 14:30:25',
  },
  {
    id: '2',
    symbol: '000002',
    name: '万科A',
    side: 'sell',
    price: 15.60,
    quantity: 5000,
    timestamp: '2026-01-17 14:25:12',
  },
  {
    id: '3',
    symbol: '600036',
    name: '招商银行',
    side: 'buy',
    price: 42.35,
    quantity: 2000,
    timestamp: '2026-01-17 13:45:33',
  },
];

const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#00d084', '#ffa502'];

export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '1y'>('30d');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            早上好，xTrader
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            今日是 2026年1月17日，以下是您的交易概览
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">市场状态</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-medium">开盘中</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="总资产"
          value={`¥${mockPortfolioData.totalValue.toLocaleString()}`}
          change={`+${mockPortfolioData.dayReturnPercent}%`}
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
          trend="up"
          data={[1200000, 1210000, 1195000, 1220000, 1234567]}
        />
        <MetricCard
          title="今日收益"
          value={`¥${mockPortfolioData.dayReturn.toLocaleString()}`}
          change={`+${mockPortfolioData.dayReturnPercent}%`}
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="up"
        />
        <MetricCard
          title="总收益率"
          value={`${mockPortfolioData.totalReturnPercent}%`}
          change={`+¥${mockPortfolioData.totalReturn.toLocaleString()}`}
          changeType="positive"
          icon={<BarChart3 className="w-5 h-5" />}
          trend="up"
        />
        <MetricCard
          title="活跃策略"
          value="5个"
          change="运行中"
          changeType="neutral"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Return Chart */}
      <ChartContainer
        title="收益曲线"
        subtitle="过去30天收益走势"
        actions={
          <div className="flex items-center gap-2">
            {(['7d', '30d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  timeRange === range
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {range === '7d' && '7天'}
                {range === '30d' && '30天'}
                {range === '1y' && '1年'}
              </button>
            ))}
          </div>
        }
        height="350px"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockReturnData}>
            <defs>
              <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#returnGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Position Distribution */}
        <ChartContainer
          title="持仓分布"
          subtitle="按股票分类的资产配置"
          height="300px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={mockPositionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {mockPositionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {mockPositionData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {item.value}% • ¥{item.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Recent Trades */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              最近交易
            </h3>
            <button className="text-[var(--brand-primary)] text-sm hover:underline">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {mockRecentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {trade.name} ({trade.symbol})
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {trade.timestamp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {trade.side === 'buy' ? '买入' : '卖出'} {trade.quantity.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    ¥{trade.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="btn btn-primary flex items-center gap-2 justify-center">
          <Zap className="w-4 h-4" />
          快速回测
        </button>
        <button className="btn btn-secondary flex items-center gap-2 justify-center">
          <BarChart3 className="w-4 h-4" />
          查看报告
        </button>
        <button className="btn btn-secondary flex items-center gap-2 justify-center">
          <Target className="w-4 h-4" />
          新建策略
        </button>
        <button className="btn btn-secondary flex items-center gap-2 justify-center">
          <PieChart className="w-4 h-4" />
          风险分析
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
