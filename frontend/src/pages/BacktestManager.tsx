import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Modal,
  message,
  Tag,
  Space,
  Tabs,
  Progress,
  Alert,
  Statistic,
  Typography
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  StopOutlined
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
import { Strategy, Symbol, BacktestConfig, TaskStatus } from '../types';

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

const { Option } = Select;
const { RangePicker } = DatePicker;
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

const BacktestManager: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [runningTasks, setRunningTasks] = useState<TaskStatus[]>([]);
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    trading_mode: 'backtest',
    system_status: 'running',
    active_strategies: 0,
    total_positions: 0,
    total_pnl: 0,
    last_update: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskStatus | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<RealtimeData | null>(null);
  const [strategyDetailModal, setStrategyDetailModal] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState(false);
  const [positionDetailModal, setPositionDetailModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchInitialData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchRealtimeData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [strategiesRes, symbolsRes] = await Promise.all([
        apiService.getStrategies(),
        apiService.getSymbols()
      ]);
      setStrategies(strategiesRes.data);
      setSymbols(symbolsRes.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const [backtestResponse, systemResponse] = await Promise.all([
        apiService.getBacktestResults({ per_page: 10 }),
        apiService.getSystemStatus()
      ]);

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
      
      const systemData: SystemStatus = {
        ...systemResponse,
        system_status: systemResponse.system_status as 'running' | 'stopped' | 'error'
      };
      setSystemStatus(systemData);
      
    } catch (error) {
      console.error('获取实时数据失败:', error);
      setRealtimeData([]);
      setSystemStatus(prev => ({
        ...prev,
        system_status: 'error',
        last_update: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }));
    }
  };

  const handleStartBacktest = async (values: any) => {
    try {
      setLoading(true);
      const config: BacktestConfig = {
        symbol: values.symbol,
        strategy: values.strategy,
        start_time: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
        parameters: values.parameters || {}
      };

      const response = await apiService.startBacktest(config);
      message.success('回测任务已启动');
      
      const newTask: TaskStatus = {
        task_id: response.task_id,
        status: 'running',
        progress: 0,
        start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        message: '回测进行中...'
      };
      setRunningTasks(prev => [newTask, ...prev]);
      
      form.resetFields();
    } catch (error) {
      message.error('启动回测失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshTaskStatus = async (taskId: string) => {
    try {
      const status = await apiService.getBacktestStatus(taskId);
      setRunningTasks(prev => prev.map(task => 
        task.task_id === taskId ? status : task
      ));
    } catch (error) {
      message.error('获取任务状态失败');
    }
  };

  const showStrategyDetail = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setStrategyDetailModal(true);
  };

  const showTaskDetail = (task: TaskStatus) => {
    setSelectedTask(task);
    setTaskDetailModal(true);
  };

  const showPositionDetail = (record: RealtimeData) => {
    setSelectedPosition(record);
    setPositionDetailModal(true);
  };

  const handleStrategyAction = (symbol: string, action: 'start' | 'pause' | 'stop') => {
    setRealtimeData(prev => prev.map(item => 
      item.symbol === symbol 
        ? { ...item, status: action === 'start' ? 'active' : action as any }
        : item
    ));
  };

  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '策略类型',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '参数数量',
      key: 'paramCount',
      render: (_: any, record: Strategy) => record.parameters.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Strategy) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => showStrategyDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          'pending': { color: 'orange', text: '等待中' },
          'running': { color: 'blue', text: '运行中' },
          'completed': { color: 'green', text: '已完成' },
          'failed': { color: 'red', text: '失败' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || 
                       { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TaskStatus) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => showTaskDetail(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            icon={<ReloadOutlined />}
            onClick={() => refreshTaskStatus(record.task_id)}
          >
            刷新
          </Button>
        </Space>
      ),
    },
  ];

  const realtimeColumns = [
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

  const tabItems = [
    {
      key: 'create',
      label: '创建回测任务',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="新建回测任务" extra={<SettingOutlined />}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleStartBacktest}
              >
                <Form.Item
                  name="symbol"
                  label="股票代码"
                  rules={[{ required: true, message: '请选择股票代码' }]}
                >
                  <Select
                    placeholder="选择股票代码"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        ?.includes(input.toLowerCase())
                    }
                  >
                    {symbols.map(symbol => (
                      <Option key={symbol.symbol} value={symbol.symbol}>
                        {symbol.symbol} - {symbol.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="strategy"
                  label="策略类型"
                  rules={[{ required: true, message: '请选择策略类型' }]}
                >
                  <Select placeholder="选择策略类型">
                    {strategies.map(strategy => (
                      <Option key={strategy.name} value={strategy.name}>
                        {strategy.display_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="dateRange"
                  label="回测时间范围"
                  rules={[{ required: true, message: '请选择时间范围' }]}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<PlayCircleOutlined />}
                    loading={loading}
                    block
                  >
                    启动回测
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="运行中的任务">
              {runningTasks.length === 0 ? (
                <Alert 
                  message="暂无运行中的任务" 
                  type="info" 
                  showIcon 
                />
              ) : (
                <Table
                  columns={taskColumns}
                  dataSource={runningTasks}
                  rowKey="task_id"
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'monitor',
      label: '跟踪回测进度',
      children: (
        <div>
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
              columns={realtimeColumns}
              dataSource={realtimeData}
              rowKey="symbol"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
              size="small"
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'strategies',
      label: '策略管理',
      children: (
        <Card title="可用策略">
          <Table
            columns={strategyColumns}
            dataSource={strategies}
            rowKey="name"
            loading={loading}
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="create" items={tabItems} />

      {/* 策略详情模态框 */}
      <Modal
        title="策略详情"
        open={strategyDetailModal}
        onCancel={() => setStrategyDetailModal(false)}
        footer={null}
        width={600}
      >
        {selectedStrategy && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card title="基本信息" size="small">
                  <p><strong>策略名称:</strong> {selectedStrategy.display_name}</p>
                  <p><strong>策略代码:</strong> <Tag>{selectedStrategy.name}</Tag></p>
                  <p><strong>策略描述:</strong> {selectedStrategy.description}</p>
                </Card>
              </Col>
              
              <Col span={24}>
                <Card title="策略参数" size="small">
                  {selectedStrategy.parameters.length === 0 ? (
                    <p>该策略无可配置参数</p>
                  ) : (
                    <Table
                      dataSource={selectedStrategy.parameters}
                      rowKey="name"
                      pagination={false}
                      size="small"
                      columns={[
                        { title: '参数名', dataIndex: 'name' },
                        { title: '类型', dataIndex: 'type' },
                        { title: '默认值', dataIndex: 'default' },
                        { title: '描述', dataIndex: 'description' },
                      ]}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={taskDetailModal}
        onCancel={() => setTaskDetailModal(false)}
        footer={null}
        width={500}
      >
        {selectedTask && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small">
                  <p><strong>任务ID:</strong> {selectedTask.task_id}</p>
                  <p><strong>状态:</strong> 
                    <Tag color={
                      selectedTask.status === 'completed' ? 'green' :
                      selectedTask.status === 'running' ? 'blue' :
                      selectedTask.status === 'failed' ? 'red' : 'orange'
                    }>
                      {selectedTask.status}
                    </Tag>
                  </p>
                  <p><strong>进度:</strong></p>
                  <Progress percent={selectedTask.progress} />
                  <p><strong>开始时间:</strong> {selectedTask.start_time || '-'}</p>
                  <p><strong>结束时间:</strong> {selectedTask.end_time || '-'}</p>
                  <p><strong>状态信息:</strong> {selectedTask.message}</p>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 持仓详情模态框 */}
      <Modal
        title="持仓详情"
        open={positionDetailModal}
        onCancel={() => setPositionDetailModal(false)}
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

export default BacktestManager;
