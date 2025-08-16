import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Alert,
  Progress,
  Modal,
  Typography,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import dayjs from 'dayjs';
import { apiService } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Text } = Typography;

interface RealtimeData {
  symbol: string;
  name: string;
  current_price: number;
  change_percent: number;
  volume: number;
  position: number;
  pnl: number;
  status: 'active' | 'paused' | 'stopped';
  last_update: string;
}

interface SystemStatus {
  trading_mode: string;
  system_status: 'running' | 'stopped' | 'error';
  active_strategies: number;
  total_positions: number;
  total_pnl: number;
  last_update: string;
}

const RealtimeMonitor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    trading_mode: 'backtest',
    system_status: 'running',
    active_strategies: 0,
    total_positions: 0,
    total_pnl: 0,
    last_update: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });
  const [selectedPosition, setSelectedPosition] = useState<RealtimeData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRealtimeData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchRealtimeData, 5000); // 每5秒刷新
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchRealtimeData = async () => {
    try {
      setLoading(true);
      
      // 获取真实的实时数据和系统状态
      const [realtimeResponse, systemResponse] = await Promise.all([
        apiService.getRealtimeData(),
        apiService.getSystemStatus()
      ]);

      setRealtimeData(realtimeResponse.data);
      
      // 确保system_status字段类型正确
      const systemData: SystemStatus = {
        ...systemResponse,
        system_status: systemResponse.system_status as 'running' | 'stopped' | 'error'
      };
      setSystemStatus(systemData);
      
    } catch (error) {
      console.error('获取实时数据失败:', error);
      // 不使用模拟数据，直接显示错误状态
      setRealtimeData([]);
      setSystemStatus(prev => ({
        ...prev,
        system_status: 'error',
        last_update: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }));
    } finally {
      setLoading(false);
    }
  };

  const showPositionDetail = (record: RealtimeData) => {
    setSelectedPosition(record);
    setDetailModalVisible(true);
  };

  const handleStrategyAction = (symbol: string, action: 'start' | 'pause' | 'stop') => {
    // 模拟策略操作
    setRealtimeData(prev => prev.map(item => 
      item.symbol === symbol 
        ? { ...item, status: action === 'start' ? 'active' : action as any }
        : item
    ));
  };

  const columns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      render: (change: number) => (
        <span className={change >= 0 ? 'profit-positive' : 'profit-negative'}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number) => (volume / 10000).toFixed(1) + '万',
    },
    {
      title: '持仓',
      dataIndex: 'position',
      key: 'position',
      render: (position: number) => (
        <span style={{ color: position > 0 ? '#52c41a' : position < 0 ? '#ff4d4f' : '#666' }}>
          {position > 0 ? `+${position}` : position}
        </span>
      ),
    },
    {
      title: '浮动盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl: number) => (
        <span className={pnl >= 0 ? 'profit-positive' : 'profit-negative'}>
          {pnl >= 0 ? '+' : ''}¥{pnl.toFixed(2)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          'active': { color: 'green', text: '运行中', icon: <PlayCircleOutlined /> },
          'paused': { color: 'orange', text: '暂停', icon: <PauseCircleOutlined /> },
          'stopped': { color: 'red', text: '已停止', icon: <StopOutlined /> },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: RealtimeData) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => showPositionDetail(record)}
          />
          {record.status === 'active' ? (
            <Button
              type="text"
              icon={<PauseCircleOutlined />}
              onClick={() => handleStrategyAction(record.symbol, 'pause')}
            />
          ) : (
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStrategyAction(record.symbol, 'start')}
            />
          )}
          <Button
            type="text"
            danger
            icon={<StopOutlined />}
            onClick={() => handleStrategyAction(record.symbol, 'stop')}
          />
        </Space>
      ),
    },
  ];

  // 策略状态分布图表
  const statusData = {
    labels: ['运行中', '暂停', '已停止'],
    datasets: [
      {
        data: [
          realtimeData.filter(item => item.status === 'active').length,
          realtimeData.filter(item => item.status === 'paused').length,
          realtimeData.filter(item => item.status === 'stopped').length,
        ],
        backgroundColor: ['#52c41a', '#faad14', '#ff4d4f'],
        borderWidth: 0,
      },
    ],
  };

  // 盈亏分布图表
  const pnlData = {
    labels: realtimeData.map(item => item.symbol),
    datasets: [
      {
        label: '浮动盈亏',
        data: realtimeData.map(item => item.pnl),
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message={
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>系统状态: 正常运行</Text>
                    <Text type="secondary">
                      最后更新: {systemStatus.last_update}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button
                      type={autoRefresh ? 'primary' : 'default'}
                      icon={<ClockCircleOutlined />}
                      onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                      {autoRefresh ? '自动刷新' : '手动刷新'}
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={fetchRealtimeData}
                      loading={loading}
                    >
                      立即刷新
                    </Button>
                  </Space>
                </Col>
              </Row>
            }
            type="success"
            showIcon={false}
          />
        </Col>
      </Row>

      {/* 系统概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card className="metric-card">
            <Statistic
              title="活跃策略"
              value={systemStatus.active_strategies}
              suffix={`/ ${realtimeData.length}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card">
            <Statistic
              title="总持仓"
              value={systemStatus.total_positions}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card">
            <Statistic
              title="总盈亏"
              value={systemStatus.total_pnl}
              precision={2}
              prefix="¥"
              valueStyle={{ 
                color: systemStatus.total_pnl >= 0 ? '#52c41a' : '#ff4d4f' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card">
            <Statistic
              title="交易模式"
              value={systemStatus.trading_mode === 'live' ? '实盘' : '回测'}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="策略盈亏走势" className="chart-container">
            <Line data={pnlData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false },
              },
              scales: { y: { beginAtZero: true } },
            }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="策略状态分布" className="chart-container">
            <Doughnut data={statusData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' as const },
              },
            }} />
          </Card>
        </Col>
      </Row>

      {/* 实时数据表格 */}
      <Card title="实时监控数据">
        <Table
          columns={columns}
          dataSource={realtimeData}
          rowKey="symbol"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>

      {/* 持仓详情模态框 */}
      <Modal
        title="持仓详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedPosition && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="基本信息" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic title="股票代码" value={selectedPosition.symbol} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="股票名称" value={selectedPosition.name} />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="当前价格" 
                        value={selectedPosition.current_price} 
                        prefix="¥"
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="持仓信息" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic 
                        title="持仓数量" 
                        value={selectedPosition.position}
                        valueStyle={{ 
                          color: selectedPosition.position > 0 ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="浮动盈亏" 
                        value={selectedPosition.pnl} 
                        prefix="¥"
                        precision={2}
                        valueStyle={{ 
                          color: selectedPosition.pnl >= 0 ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic 
                        title="涨跌幅" 
                        value={selectedPosition.change_percent} 
                        suffix="%"
                        precision={2}
                        valueStyle={{ 
                          color: selectedPosition.change_percent >= 0 ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title="市场信息" size="small">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic 
                        title="成交量" 
                        value={(selectedPosition.volume / 10000).toFixed(1)} 
                        suffix="万手"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic title="更新时间" value={selectedPosition.last_update} />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RealtimeMonitor;