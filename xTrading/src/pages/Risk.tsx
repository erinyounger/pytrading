import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import MetricCard from '@/components/common/MetricCard';
import DataTable from '@/components/common/DataTable';
import ChartContainer from '@/components/common/ChartContainer';
import { cn } from '@/utils/cn';
import { RiskMetric, RiskAlert } from '@/types';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const mockRiskStats = {
  totalMetrics: 8,
  safeMetrics: 5,
  warningMetrics: 2,
  dangerMetrics: 1,
  activeAlerts: 3,
  resolvedAlerts: 12,
};

const mockRiskMetrics: RiskMetric[] = [
  {
    id: '1',
    name: '最大回撤',
    value: 8.23,
    threshold: 10,
    status: 'safe',
    unit: '%',
  },
  {
    id: '2',
    name: '夏普比率',
    value: 1.45,
    threshold: 1.0,
    status: 'safe',
    unit: '',
  },
  {
    id: '3',
    name: '波动率',
    value: 15.6,
    threshold: 20,
    status: 'safe',
    unit: '%',
  },
  {
    id: '4',
    name: '仓位集中度',
    value: 45.8,
    threshold: 30,
    status: 'warning',
    unit: '%',
  },
  {
    id: '5',
    name: '持仓股票数量',
    value: 8,
    threshold: 10,
    status: 'safe',
    unit: '只',
  },
  {
    id: '6',
    name: '单股最大仓位',
    value: 25.6,
    threshold: 20,
    status: 'warning',
    unit: '%',
  },
  {
    id: '7',
    name: '日VaR',
    value: 3.2,
    threshold: 5,
    status: 'safe',
    unit: '%',
  },
  {
    id: '8',
    name: '贝塔系数',
    value: 1.35,
    threshold: 1.2,
    status: 'danger',
    unit: '',
  },
];

const mockRiskAlerts: RiskAlert[] = [
  {
    id: '1',
    type: 'position',
    level: 'medium',
    title: '仓位集中度超限',
    message: '当前仓位集中度为45.8%，超过阈值30%，建议调整持仓结构',
    timestamp: '2026-01-17 14:30:00',
    isRead: false,
    actionRequired: true,
  },
  {
    id: '2',
    type: 'concentration',
    level: 'medium',
    title: '单股仓位过高',
    message: '浦发银行仓位达到25.6%，超过建议阈值20%',
    timestamp: '2026-01-17 13:45:00',
    isRead: false,
    actionRequired: true,
  },
  {
    id: '3',
    type: 'drawdown',
    level: 'high',
    title: '回撤接近阈值',
    message: '当前回撤8.23%，接近止损阈值10%',
    timestamp: '2026-01-17 10:20:00',
    isRead: true,
    actionRequired: true,
  },
  {
    id: '4',
    type: 'stop_loss',
    level: 'low',
    title: '止损策略触发',
    message: '海康威视触发止损，已自动平仓',
    timestamp: '2026-01-16 15:30:00',
    isRead: true,
    actionRequired: false,
  },
];

export const RiskPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'settings'>('overview');

  const getStatusBadge = (status: RiskMetric['status']) => {
    const statusMap = {
      safe: { label: '正常', className: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      warning: { label: '警告', className: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
      danger: { label: '危险', className: 'bg-red-500/20 text-red-400', icon: XCircle },
    };

    const config = statusMap[status];
    const Icon = config.icon;

    return (
      <span className={cn('px-2 py-1 rounded text-xs font-medium', config.className)}>
        <Icon className="w-3 h-3 inline mr-1" />
        {config.label}
      </span>
    );
  };

  const getLevelBadge = (level: RiskAlert['level']) => {
    const levelMap = {
      low: { label: '低', className: 'bg-gray-500/20 text-gray-400' },
      medium: { label: '中', className: 'bg-yellow-500/20 text-yellow-400' },
      high: { label: '高', className: 'bg-red-500/20 text-red-400' },
    };

    return (
      <span className={cn('px-2 py-1 rounded text-xs font-medium', levelMap[level].className)}>
        {levelMap[level].label}
      </span>
    );
  };

  const riskRadarData = mockRiskMetrics.map((metric) => {
    let normalizedValue = 0;
    if (metric.name === '夏普比率') {
      normalizedValue = (metric.value / metric.threshold) * 100;
    } else if (metric.name === '最大回撤' || metric.name === '波动率') {
      normalizedValue = 100 - (metric.value / metric.threshold) * 100;
    } else {
      normalizedValue = (metric.value / metric.threshold) * 100;
    }
    return {
      metric: metric.name,
      value: Math.min(normalizedValue, 100),
      fullMark: 100,
    };
  });

  const drawdownData = [
    { date: '01-10', value: 0 },
    { date: '01-11', value: -1.2 },
    { date: '01-12', value: -2.5 },
    { date: '01-13', value: -1.8 },
    { date: '01-14', value: -3.2 },
    { date: '01-15', value: -5.1 },
    { date: '01-16', value: -4.3 },
    { date: '01-17', value: -8.2 },
  ];

  const positionData = [
    { name: '浦发银行', value: 25.6, color: '#4f46e5' },
    { name: '招商银行', value: 20.3, color: '#06b6d4' },
    { name: '万科A', value: 15.8, color: '#8b5cf6' },
    { name: '贵州茅台', value: 12.5, color: '#00d084' },
    { name: '其他', value: 25.8, color: '#94a3b8' },
  ];

  const alertColumns = [
    {
      key: 'level',
      title: '级别',
      width: '80px',
      render: (level: RiskAlert['level']) => getLevelBadge(level),
    },
    {
      key: 'type',
      title: '类型',
      width: '120px',
      render: (type: RiskAlert['type']) => {
        const typeMap = {
          position: '仓位风险',
          drawdown: '回撤风险',
          concentration: '集中度',
          stop_loss: '止损',
        };
        return <span className="text-[var(--text-secondary)]">{typeMap[type]}</span>;
      },
    },
    {
      key: 'title',
      title: '标题',
      width: '200px',
      render: (title: string, record: RiskAlert) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{title}</div>
          <div className="text-xs text-[var(--text-secondary)] truncate" title={record.message}>
            {record.message}
          </div>
        </div>
      ),
    },
    {
      key: 'timestamp',
      title: '时间',
      width: '150px',
      render: (timestamp: string) => (
        <span className="text-[var(--text-secondary)] text-sm">{timestamp}</span>
      ),
    },
    {
      key: 'actionRequired',
      title: '操作',
      width: '100px',
      render: (actionRequired: boolean) => (
        <span className={cn('text-xs', actionRequired ? 'text-red-400' : 'text-[var(--text-secondary)]')}>
          {actionRequired ? '需要处理' : '已处理'}
        </span>
      ),
    },
  ];

  const RiskOverview = () => (
    <div className="space-y-6">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="风险指标"
          value={mockRiskStats.totalMetrics.toString()}
          icon={<Activity className="w-5 h-5" />}
          change={`正常 ${mockRiskStats.safeMetrics} | 警告 ${mockRiskStats.warningMetrics}`}
          changeType="neutral"
        />
        <MetricCard
          title="危险指标"
          value={mockRiskStats.dangerMetrics.toString()}
          icon={<Shield className="w-5 h-5" />}
          changeType="negative"
        />
        <MetricCard
          title="活跃警报"
          value={mockRiskStats.activeAlerts.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          changeType="negative"
        />
        <MetricCard
          title="已解决"
          value={mockRiskStats.resolvedAlerts.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          changeType="positive"
        />
      </div>

      {/* Risk Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
          title="风险雷达图"
          subtitle="各项风险指标健康度"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={riskRadarData}>
              <PolarGrid stroke="var(--border-primary)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              />
              <Radar
                name="风险值"
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
          title="回撤曲线"
          subtitle="历史最大回撤走势"
          height="350px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={drawdownData}>
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
                stroke="#ff4757"
                strokeWidth={2}
                name="回撤(%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Risk Metrics Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">风险指标详情</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>指标名称</th>
                <th>当前值</th>
                <th>阈值</th>
                <th>状态</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              {mockRiskMetrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="font-medium text-[var(--text-primary)]">{metric.name}</td>
                  <td className="font-mono">
                    {metric.value.toFixed(2)}
                    {metric.unit}
                  </td>
                  <td className="font-mono text-[var(--text-secondary)]">
                    {metric.threshold}
                    {metric.unit}
                  </td>
                  <td>{getStatusBadge(metric.status)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full',
                            metric.status === 'safe'
                              ? 'bg-green-400'
                              : metric.status === 'warning'
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          )}
                          style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] w-12">
                        {Math.round((metric.value / metric.threshold) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Distribution */}
      <ChartContainer
        title="仓位分布"
        subtitle="按股票分类的仓位占比"
        height="300px"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={positionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {positionData.map((entry, _index) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {positionData.map((item, _index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{item.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{item.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );

  const AlertsTab = () => (
    <div className="space-y-6">
      <DataTable
        columns={alertColumns}
        data={mockRiskAlerts}
        loading={false}
        pagination={true}
        pageSize={10}
      />
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">风险阈值设置</h3>
        <div className="space-y-4">
          {mockRiskMetrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">{metric.name}</div>
                <div className="text-sm text-[var(--text-secondary)]">
                  当前阈值: {metric.threshold}
                  {metric.unit}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  className="input w-32"
                  defaultValue={metric.threshold}
                />
                <button className="btn btn-primary">保存</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">告警通知设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <div className="font-medium text-[var(--text-primary)]">邮件通知</div>
              <div className="text-sm text-[var(--text-secondary)]">风险告警时发送邮件</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-[var(--bg-primary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <div className="font-medium text-[var(--text-primary)]">短信通知</div>
              <div className="text-sm text-[var(--text-secondary)]">高风险告警时发送短信</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-[var(--bg-primary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-tertiary)]">
            <div>
              <div className="font-medium text-[var(--text-primary)]">系统通知</div>
              <div className="text-sm text-[var(--text-secondary)]">在系统中显示通知</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-[var(--bg-primary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-primary)]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">风险管理</h1>
          <p className="text-[var(--text-secondary)] mt-1">监控和管理投资组合风险</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setSelectedTab('overview')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            selectedTab === 'overview'
              ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          风险概览
        </button>
        <button
          onClick={() => setSelectedTab('alerts')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            selectedTab === 'alerts'
              ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          风险警报
        </button>
        <button
          onClick={() => setSelectedTab('settings')}
          className={cn(
            'px-4 py-2 font-medium transition-colors',
            selectedTab === 'settings'
              ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          风险设置
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && <RiskOverview />}
      {selectedTab === 'alerts' && <AlertsTab />}
      {selectedTab === 'settings' && <SettingsTab />}
    </div>
  );
};

export default RiskPage;
