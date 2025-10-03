import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, message, Space, Select, Tag } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined, 
  TrophyOutlined,
  BarChartOutlined 
} from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { apiService } from '../services/api';
import { BacktestResult } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    profitableRate: 0,
    avgPnlRatio: 0,
    avgSharpRatio: 0,
    avgWinRatio: 0,
  });
  const [strategyBoard, setStrategyBoard] = useState<{
    strategy: string;
    count: number;
    avgPnl: number;
    avgWin: number;
    avgSharp: number;
  }[]>([]);
  const [watchlist, setWatchlist] = useState<BacktestResult[]>([]);
  const [watchTrend, setWatchTrend] = useState<string | null>(null);
  const [availableTrends, setAvailableTrends] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 拉取最新去重后的样本，做前端聚合
      const response = await apiService.getBacktestResults({ per_page: 1000 });
      const results = response.data;
      setBacktestResults(results);
      
      if (results.length === 0) {
        setSummary({ total: 0, profitableRate: 0, avgPnlRatio: 0, avgSharpRatio: 0, avgWinRatio: 0 });
        setStrategyBoard([]);
        setWatchlist([]);
        return;
      }

      // KPI 汇总
      const total = results.length;
      const profitableCount = results.filter(r => r.pnl_ratio > 0).length;
      const avgPnl = results.reduce((sum, r) => sum + r.pnl_ratio, 0) / total;
      const avgSharp = results.reduce((sum, r) => sum + r.sharp_ratio, 0) / total;
      const avgWin = results.reduce((sum, r) => sum + r.win_ratio, 0) / total;
      setSummary({
        total,
        profitableRate: total ? profitableCount / total : 0,
        avgPnlRatio: avgPnl,
        avgSharpRatio: avgSharp,
        avgWinRatio: avgWin,
      });

      // 策略维度榜单（按 strategy_name 汇总）
      const strategyMap = new Map<string, BacktestResult[]>();
      results.forEach(r => {
        const key = r.strategy_name || 'Unknown';
        if (!strategyMap.has(key)) strategyMap.set(key, []);
        strategyMap.get(key)!.push(r);
      });
      const board = Array.from(strategyMap.entries()).map(([strategy, list]) => {
        const cnt = list.length;
        return {
          strategy,
          count: cnt,
          avgPnl: list.reduce((s, r) => s + r.pnl_ratio, 0) / cnt,
          avgWin: list.reduce((s, r) => s + r.win_ratio, 0) / cnt,
          avgSharp: list.reduce((s, r) => s + r.sharp_ratio, 0) / cnt,
        };
      }).sort((a, b) => (b.avgPnl - a.avgPnl) || (b.avgWin - a.avgWin)).slice(0, 10);
      setStrategyBoard(board);

      // 建议关注标的（多因子评分）
      const favorableTrends = new Set(['RisingUp', 'ZeroAxisUp', 'Observing']);
      const candidates = results.filter(r => r.win_ratio >= 0.55 && r.pnl_ratio >= 0.05);
      const scored = candidates.map(r => {
        const score = (r.pnl_ratio * 100) * 0.5 + (r.win_ratio * 100) * 0.4 - (r.max_drawdown * 100) * 0.3 + r.sharp_ratio * 0.2 + (favorableTrends.has(r.trending_type) ? 5 : 0);
        return { r, score };
      }).sort((a, b) => b.score - a.score).slice(0, 20).map(x => x.r);
      setWatchlist(scored);
      // 可用趋势集合
      setAvailableTrends(Array.from(new Set(results.map(r => r.trending_type).filter(Boolean))).sort());
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: backtestResults.slice(0, 10).map(r => r.symbol),
    datasets: [
      {
        label: '收益率 (%)',
        data: backtestResults.slice(0, 10).map(r => Number((r.pnl_ratio * 100).toFixed(2))),
        borderColor: 'rgb(24, 144, 255)',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '策略收益率对比',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const strategyColumns = [
    { title: '策略', dataIndex: 'strategy', key: 'strategy' },
    { title: '样本数', dataIndex: 'count', key: 'count' },
    { title: '平均收益率', dataIndex: 'avgPnl', key: 'avgPnl', render: (v: number) => `${(v * 100).toFixed(2)}%` },
    { title: '平均胜率', dataIndex: 'avgWin', key: 'avgWin', render: (v: number) => `${(v * 100).toFixed(1)}%` },
    { title: '夏普均值', dataIndex: 'avgSharp', key: 'avgSharp', render: (v: number) => v.toFixed(2) },
  ];

  const trendTag = (t: string) => {
    const colorMap: Record<string, string> = {
      'RisingUp': 'red',
      'ZeroAxisUp': 'purple',
      'Observing': 'blue',
      'DeadXDown': 'orange',
      'FallingDown': 'volcano',
      'UpDown': 'cyan',
      'Unknown': 'default',
    };
    return <Tag color={colorMap[t] || 'default'}>{t}</Tag>;
  };

  const watchColumns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '策略',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      render: (v: string) => v || '-'
    },
    {
      title: '收益率',
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      render: (value: number) => (
        <span className={value >= 0 ? 'profit-positive' : 'profit-negative'}>
          {(value * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: '夏普比率',
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: '最大回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      render: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
    {
      title: '趋势',
      dataIndex: 'trending_type',
      key: 'trending_type',
      filters: availableTrends.map(t => ({ text: t, value: t })),
      onFilter: (value: any, record: BacktestResult) => record.trending_type === value,
      render: (t: string) => trendTag(t),
    },
  ];

  const displayedWatchlist = watchTrend ? watchlist.filter(r => r.trending_type === watchTrend) : watchlist;

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>仪表板</h1>
      
      {/* 盈利能力 KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="样本总数"
              value={summary.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="平均收益率"
              value={summary.avgPnlRatio * 100}
              precision={2}
              suffix="%"
              prefix={<DollarOutlined />}
              valueStyle={{ color: summary.avgPnlRatio >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="平均夏普比率"
              value={summary.avgSharpRatio}
              precision={2}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="盈利占比"
              value={summary.profitableRate * 100}
              precision={1}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 策略榜单与收益率对比 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="策略盈利榜单（Top10）">
            <Table
              columns={strategyColumns}
              dataSource={strategyBoard}
              rowKey={(r) => r.strategy}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="策略收益率对比" className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </Card>
        </Col>
      </Row>

      {/* 建议重点关注标的 */}
      <Card title="建议重点关注标的（Top20）" style={{ marginTop: '16px' }}>
        <Space style={{ marginBottom: 12 }} size={12} wrap>
          <span style={{ color: '#666' }}>当前趋势筛选:</span>
          <Select
            allowClear
            placeholder="选择趋势"
            style={{ minWidth: 180 }}
            value={watchTrend as any}
            onChange={(v) => setWatchTrend(v || null)}
            options={availableTrends.map(t => ({ label: t, value: t }))}
          />
        </Space>
        <Table
          columns={watchColumns}
          dataSource={displayedWatchlist}
          rowKey={(r) => `${r.symbol}_${r.backtest_end_time}`}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;