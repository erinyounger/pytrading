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
  Modal,
  Typography
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
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
import { darkTheme, globalDarkStyles } from '../styles/darkTheme';

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
      
      // 获取回测结果数据和系统状态
      const [backtestResponse, systemResponse] = await Promise.all([
        apiService.getBacktestResults({ per_page: 10 }),
        apiService.getSystemStatus()
      ]);

      // 将回测结果转换为实时监控数据格式
      const convertedData: RealtimeData[] = backtestResponse.data.map((result: any) => ({
        symbol: result.symbol || '',
        name: result.name || '',
        current_price: result.close_price || 0,
        change_percent: result.pnl_ratio ? (result.pnl_ratio * 100) : 0,
        volume: result.volume || 0,
        position: result.pnl_ratio > 0 ? Math.abs(result.pnl_ratio * 1000) : -Math.abs(result.pnl_ratio * 1000),
        pnl: result.pnl || 0,
        status: result.pnl_ratio > 0.1 ? 'active' : result.pnl_ratio > 0 ? 'active' : 'paused',
        last_update: result.end_date || new Date().toISOString()
      }));

      setRealtimeData(convertedData);
      
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
        <span style={{ color: change >= 0 ? darkTheme.positive : darkTheme.negative }}>
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
        <span style={{ color: position > 0 ? darkTheme.negative : position < 0 ? darkTheme.positive : darkTheme.textMuted }}>
          {position > 0 ? `+${position}` : position}
        </span>
      ),
    },
    {
      title: '浮动盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl: number) => (
        <span style={{ color: pnl >= 0 ? darkTheme.positive : darkTheme.negative }}>
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
        backgroundColor: [darkTheme.negative, '#faad14', darkTheme.positive],
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
        borderColor: darkTheme.accent,
        backgroundColor: `${darkTheme.accent}20`,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="realtime-monitor-container">
      <style>{globalDarkStyles}</style>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Alert
            message={
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <CheckCircleOutlined style={{ color: darkTheme.negative }} />
                    <Text strong style={{ color: darkTheme.textPrimary }}>系统状态: 正常运行</Text>
                    <Text type="secondary" style={{ color: darkTheme.textSecondary }}>
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
          <Card className="metric-card" style={{ background: darkTheme.cardBackground }}>
            <Statistic
              title={<span style={{ color: darkTheme.textSecondary }}>活跃策略</span>}
              value={systemStatus.active_strategies}
              suffix={`/ ${realtimeData.length}`}
              valueStyle={{ color: darkTheme.accent }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card" style={{ background: darkTheme.cardBackground }}>
            <Statistic
              title={<span style={{ color: darkTheme.textSecondary }}>总持仓</span>}
              value={systemStatus.total_positions}
              valueStyle={{ color: darkTheme.negative }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card" style={{ background: darkTheme.cardBackground }}>
            <Statistic
              title={<span style={{ color: darkTheme.textSecondary }}>总盈亏</span>}
              value={systemStatus.total_pnl}
              precision={2}
              prefix="¥"
              valueStyle={{
                color: systemStatus.total_pnl >= 0 ? darkTheme.negative : darkTheme.positive
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="metric-card" style={{ background: darkTheme.cardBackground }}>
            <Statistic
              title={<span style={{ color: darkTheme.textSecondary }}>交易模式</span>}
              value={systemStatus.trading_mode === 'live' ? '实盘' : '回测'}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title={<span style={{ color: darkTheme.textPrimary }}>策略盈亏走势</span>} className="chart-container" style={{ background: darkTheme.cardBackground }}>
            <Line data={pnlData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const, labels: { color: darkTheme.textPrimary } },
                title: { display: false },
              },
              scales: { y: { beginAtZero: true, ticks: { color: darkTheme.textSecondary }, grid: { color: darkTheme.border } }, x: { ticks: { color: darkTheme.textSecondary }, grid: { color: darkTheme.border } } },
            }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ color: darkTheme.textPrimary }}>策略状态分布</span>} className="chart-container" style={{ background: darkTheme.cardBackground }}>
            <Doughnut data={statusData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' as const, labels: { color: darkTheme.textPrimary } },
              },
            }} />
          </Card>
        </Col>
      </Row>

      {/* 实时数据表格 */}
      <Card title={<span style={{ color: darkTheme.textPrimary }}>实时监控数据</span>} style={{ background: darkTheme.cardBackground }}>
        <Table
          columns={columns}
          dataSource={realtimeData}
          rowKey="symbol"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          style={{ background: darkTheme.cardBackground }}
          onRow={() => ({
            style: {
              background: darkTheme.cardBackground,
              color: darkTheme.textPrimary,
            }
          })}
        />
      </Card>

      {/* 持仓详情模态框 */}
      <Modal
        title={<span style={{ color: darkTheme.textPrimary }}>持仓详情</span>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        styles={{ content: { background: darkTheme.cardBackground } }}
      >
        {selectedPosition && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title={<span style={{ color: darkTheme.textPrimary }}>基本信息</span>} size="small" style={{ background: darkTheme.cardBackgroundAlt }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic title={<span style={{ color: darkTheme.textSecondary }}>股票代码</span>} value={selectedPosition.symbol} valueStyle={{ color: darkTheme.textPrimary }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title={<span style={{ color: darkTheme.textSecondary }}>股票名称</span>} value={selectedPosition.name} valueStyle={{ color: darkTheme.textPrimary }} />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title={<span style={{ color: darkTheme.textSecondary }}>当前价格</span>}
                        value={selectedPosition.current_price}
                        prefix="¥"
                        precision={2}
                        valueStyle={{ color: darkTheme.textPrimary }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title={<span style={{ color: darkTheme.textPrimary }}>持仓信息</span>} size="small" style={{ background: darkTheme.cardBackgroundAlt }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Statistic
                        title={<span style={{ color: darkTheme.textSecondary }}>持仓数量</span>}
                        value={selectedPosition.position}
                        valueStyle={{
                          color: selectedPosition.position > 0 ? darkTheme.negative : darkTheme.positive
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title={<span style={{ color: darkTheme.textSecondary }}>浮动盈亏</span>}
                        value={selectedPosition.pnl}
                        prefix="¥"
                        precision={2}
                        valueStyle={{
                          color: selectedPosition.pnl >= 0 ? darkTheme.negative : darkTheme.positive
                        }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title={<span style={{ color: darkTheme.textSecondary }}>涨跌幅</span>}
                        value={selectedPosition.change_percent}
                        suffix="%"
                        precision={2}
                        valueStyle={{
                          color: selectedPosition.change_percent >= 0 ? darkTheme.negative : darkTheme.positive
                        }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col span={24}>
                <Card title={<span style={{ color: darkTheme.textPrimary }}>市场信息</span>} size="small" style={{ background: darkTheme.cardBackgroundAlt }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Statistic
                        title={<span style={{ color: darkTheme.textSecondary }}>成交量</span>}
                        value={(selectedPosition.volume / 10000).toFixed(1)}
                        suffix="万手"
                        valueStyle={{ color: darkTheme.textPrimary }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic title={<span style={{ color: darkTheme.textSecondary }}>更新时间</span>} value={selectedPosition.last_update} valueStyle={{ color: darkTheme.textPrimary }} />
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