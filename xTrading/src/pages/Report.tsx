import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Target,
  Award,
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import ChartContainer from '@/components/common/ChartContainer';
import { PerformanceMetrics, MonthlyReturn, TradeStatistic } from '@/types';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const mockPerformanceMetrics: PerformanceMetrics = {
  totalReturn: 23.45,
  annualizedReturn: 28.67,
  sharpeRatio: 1.52,
  sortinoRatio: 2.15,
  maxDrawdown: -8.23,
  volatility: 15.67,
  winRate: 68.5,
  profitLossRatio: 1.85,
  totalTrades: 234,
  avgHoldingPeriod: 5.2,
};

const mockMonthlyReturns: MonthlyReturn[] = [
  { month: '1月', return: 3.2, benchmark: 2.1 },
  { month: '2月', return: -1.5, benchmark: -0.8 },
  { month: '3月', return: 4.5, benchmark: 3.2 },
  { month: '4月', return: 2.8, benchmark: 2.5 },
  { month: '5月', return: 5.6, benchmark: 4.1 },
  { month: '6月', return: -2.1, benchmark: -1.2 },
  { month: '7月', return: 3.8, benchmark: 2.9 },
  { month: '8月', return: 1.9, benchmark: 1.5 },
  { month: '9月', return: 4.2, benchmark: 3.6 },
  { month: '10月', return: 2.5, benchmark: 2.0 },
  { month: '11月', return: 3.1, benchmark: 2.7 },
  { month: '12月', return: 1.8, benchmark: 1.3 },
];

const mockTradeStats: TradeStatistic = {
  totalTrades: 234,
  winningTrades: 160,
  losingTrades: 74,
  winRate: 68.5,
  avgWinningTrade: 3.45,
  avgLosingTrade: -1.87,
  profitLossRatio: 1.85,
};

const mockReturnDistribution = [
  { range: '>5%', count: 45, percentage: 19.2 },
  { range: '2%~5%', count: 78, percentage: 33.3 },
  { range: '0%~2%', count: 37, percentage: 15.8 },
  { range: '-2%~0%', count: 28, percentage: 12.0 },
  { range: '-5%~-2%', count: 32, percentage: 13.7 },
  { range: '<-5%', count: 14, percentage: 6.0 },
];

export const ReportPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  const cumulativeReturns = useMemo(() => {
    let cumulative = 0;
    return mockMonthlyReturns.map((item) => {
      cumulative += item.return;
      return {
        ...item,
        cumulative,
        cumulativeBenchmark: mockMonthlyReturns
          .slice(0, mockMonthlyReturns.indexOf(item) + 1)
          .reduce((sum, m) => sum + m.benchmark, 0),
      };
    });
  }, []);

  const maxDrawdownData = [
    { date: '01-01', drawdown: 0, value: 100 },
    { date: '01-15', drawdown: -2.3, value: 97.7 },
    { date: '02-01', drawdown: -5.1, value: 94.9 },
    { date: '02-15', drawdown: -3.2, value: 96.8 },
    { date: '03-01', drawdown: -8.2, value: 91.8 },
    { date: '03-15', drawdown: -6.5, value: 93.5 },
    { date: '04-01', drawdown: -4.1, value: 95.9 },
    { date: '04-15', drawdown: -2.8, value: 97.2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">性能报告</h1>
          <p className="text-[var(--text-secondary)] mt-1">全面的投资组合绩效分析报告</p>
        </div>
        <div className="flex gap-2">
          <select
            className="input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="month">月度</option>
            <option value="quarter">季度</option>
            <option value="year">年度</option>
          </select>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="总收益率"
          value={`${mockPerformanceMetrics.totalReturn.toFixed(2)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          changeType="positive"
        />
        <MetricCard
          title="年化收益率"
          value={`${mockPerformanceMetrics.annualizedReturn.toFixed(2)}%`}
          icon={<Award className="w-5 h-5" />}
          changeType="positive"
        />
        <MetricCard
          title="夏普比率"
          value={mockPerformanceMetrics.sharpeRatio.toFixed(2)}
          icon={<Target className="w-5 h-5" />}
          changeType="positive"
        />
        <MetricCard
          title="最大回撤"
          value={`${mockPerformanceMetrics.maxDrawdown.toFixed(2)}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          changeType="negative"
        />
      </div>

      {/* Return vs Benchmark */}
      <ChartContainer
        title="收益曲线"
        subtitle="策略收益与基准对比"
        height="400px"
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--brand-primary)]" />
              <span className="text-sm text-[var(--text-secondary)]">策略收益</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--brand-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">基准收益</span>
            </div>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={cumulativeReturns}>
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
            <Bar dataKey="return" fill="#4f46e5" name="月度收益(%)" />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#4f46e5"
              strokeWidth={2}
              name="累计收益(%)"
            />
            <Line
              type="monotone"
              dataKey="cumulativeBenchmark"
              stroke="#06b6d4"
              strokeWidth={2}
              name="基准累计收益(%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">收益指标</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">总收益率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.totalReturn.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">年化收益率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.annualizedReturn.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">波动率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.volatility.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">风险指标</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">最大回撤</span>
              <span className="font-mono font-medium text-red-400">
                {mockPerformanceMetrics.maxDrawdown.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">夏普比率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">索提诺比率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.sortinoRatio.toFixed(2)}
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
                {mockPerformanceMetrics.totalTrades}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">胜率</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.winRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">平均持仓周期</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockPerformanceMetrics.avgHoldingPeriod.toFixed(1)}天
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">盈亏统计</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">盈利交易</span>
              <span className="font-mono font-medium text-green-400">
                {mockTradeStats.winningTrades}笔
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">亏损交易</span>
              <span className="font-mono font-medium text-red-400">
                {mockTradeStats.losingTrades}笔
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">盈亏比</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {mockTradeStats.profitLossRatio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawdown and Monthly Returns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="回撤分析"
          subtitle="历史最大回撤和净值走势"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={maxDrawdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--text-secondary)"
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                }}
              />
              <Bar yAxisId="right" dataKey="drawdown" fill="#ff4757" name="回撤(%)" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                strokeWidth={2}
                name="净值"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="月度收益分布"
          subtitle="各月收益率统计"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockMonthlyReturns}>
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
      </div>

      {/* Return Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="收益分布"
          subtitle="交易收益率分布统计"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockReturnDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis type="number" stroke="var(--text-secondary)" />
              <YAxis dataKey="range" type="category" stroke="var(--text-secondary)" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#4f46e5" name="交易次数" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="胜率分析"
          subtitle="盈利交易占比"
          height="350px"
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '盈利交易', value: mockTradeStats.winningTrades, color: '#00d084' },
                        { name: '亏损交易', value: mockTradeStats.losingTrades, color: '#ff4757' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#00d084" />
                      <Cell fill="#ff4757" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-3xl font-bold text-[var(--text-primary)]">
                      {mockTradeStats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">胜率</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    盈利 {mockTradeStats.winningTrades}笔
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    亏损 {mockTradeStats.losingTrades}笔
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">报告摘要</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            本期投资组合总收益率为{' '}
            <span className="text-green-400 font-mono font-medium">
              {mockPerformanceMetrics.totalReturn.toFixed(2)}%
            </span>
            ，年化收益率{' '}
            <span className="text-green-400 font-mono font-medium">
              {mockPerformanceMetrics.annualizedReturn.toFixed(2)}%
            </span>
            ，显著跑赢基准指数。策略表现出良好的风险调整后收益，夏普比率为{' '}
            <span className="font-mono font-medium">{mockPerformanceMetrics.sharpeRatio.toFixed(2)}</span>
            ，索提诺比率为{' '}
            <span className="font-mono font-medium">{mockPerformanceMetrics.sortinoRatio.toFixed(2)}</span>
            。
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            总计执行了 <span className="font-mono font-medium">{mockPerformanceMetrics.totalTrades}</span>{' '}
            笔交易，胜率为{' '}
            <span className="text-green-400 font-mono font-medium">
              {mockPerformanceMetrics.winRate.toFixed(2)}%
            </span>
            ，盈亏比为{' '}
            <span className="font-mono font-medium">{mockTradeStats.profitLossRatio.toFixed(2)}</span>
            ，显示策略具有良好的盈利能力和稳定性。
          </p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            最大回撤为{' '}
            <span className="text-red-400 font-mono font-medium">
              {mockPerformanceMetrics.maxDrawdown.toFixed(2)}%
            </span>
            ，在可控范围内。建议继续保持当前策略配置，并根据市场变化适时调整仓位。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
