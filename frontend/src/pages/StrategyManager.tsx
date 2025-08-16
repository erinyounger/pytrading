import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Modal,
  message,
  Tag,
  Space,
  Tabs,
  InputNumber,
  Progress,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { Strategy, Symbol, BacktestConfig, TaskStatus } from '../types';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const StrategyManager: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [runningTasks, setRunningTasks] = useState<TaskStatus[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [strategyDetailModal, setStrategyDetailModal] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskStatus | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      
      // 添加到运行任务列表
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

  return (
    <div style={{ padding: '24px' }}>
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

      <Card title="可用策略" style={{ marginTop: '16px' }}>
        <Table
          columns={strategyColumns}
          dataSource={strategies}
          rowKey="name"
          loading={loading}
          pagination={false}
        />
      </Card>

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
    </div>
  );
};

export default StrategyManager;