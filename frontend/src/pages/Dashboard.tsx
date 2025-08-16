import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, message } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined, 
  TrophyOutlined,
  AlertOutlined,
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
    totalStrategies: 0,
    avgPnlRatio: 0,
    avgSharpRatio: 0,
    avgWinRatio: 0,
    bestPerformer: '',
    worstPerformer: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBacktestResults({ limit: 20 });
      const results = response.data;
      setBacktestResults(results);
      
      // 计算统计数据
      if (results.length > 0) {
        const avgPnl = results.reduce((sum, r) => sum + r.pnl_ratio, 0) / results.length;
        const avgSharp = results.reduce((sum, r) => sum + r.sharp_ratio, 0) / results.length;
        const avgWin = results.reduce((sum, r) => sum + r.win_ratio, 0) / results.length;
        
        const sortedByPnl = [...results].sort((a, b) => b.pnl_ratio - a.pnl_ratio);
        
        setSummary({
          totalStrategies: results.length,
          avgPnlRatio: avgPnl,
          avgSharpRatio: avgSharp,
          avgWinRatio: avgWin,
          bestPerformer: sortedByPnl[0]?.symbol || '',
          worstPerformer: sortedByPnl[sortedByPnl.length - 1]?.symbol || ''
        });
      }
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
        data: backtestResults.slice(0, 10).map(r => (r.pnl_ratio * 100).toFixed(2)),
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

  const columns = [
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
      title: '策略类型',
      dataIndex: 'trending_type',
      key: 'trending_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'MACD_STRATEGY': 'MACD策略',
          'BOLL_STRATEGY': '布林带策略',
          'TURTLE_STRATEGY': '海龟策略'
        };
        return typeMap[type] || type;
      }
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
      sorter: (a: BacktestResult, b: BacktestResult) => a.pnl_ratio - b.pnl_ratio,
    },
    {
      title: '夏普比率',
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      render: (value: number) => value.toFixed(2),
      sorter: (a: BacktestResult, b: BacktestResult) => a.sharp_ratio - b.sharp_ratio,
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
      sorter: (a: BacktestResult, b: BacktestResult) => a.win_ratio - b.win_ratio,
    },
  ];

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
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="metric-card">
            <Statistic
              title="策略总数"
              value={summary.totalStrategies}
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
              title="平均胜率"
              value={summary.avgWinRatio * 100}
              precision={1}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表和表格 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="策略收益率对比" className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最佳/最差表现">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="最佳表现"
                  value={summary.bestPerformer}
                  prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="最差表现"
                  value={summary.worstPerformer}
                  prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f', fontSize: '20px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近回测结果表格 */}
      <Card title="最近回测结果" style={{ marginTop: '16px' }}>
        <Table
          columns={columns}
          dataSource={backtestResults.slice(0, 10)}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;