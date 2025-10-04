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
  Typography,
  Descriptions,
  Radio,
  Input,
  Alert
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { Strategy, Symbol, BacktestConfig } from '../types';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

interface BacktestTaskInfo {
  id: number;
  task_id: string;
  strategy_id: number;
  symbols: string[];
  symbol_count: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  parameters?: any;
  result_summary?: any;
  error_message?: string;
  created_at: string;
}

const BacktestManager: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [backtestTasks, setBacktestTasks] = useState<BacktestTaskInfo[]>([]);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedTask, setSelectedTask] = useState<BacktestTaskInfo | null>(null);
  const [strategyDetailModal, setStrategyDetailModal] = useState(false);
  const [taskDetailModal, setTaskDetailModal] = useState(false);
  const [backTestMode, setBackTestMode] = useState<'single' | 'index'>('single');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchBacktestTasks();
  }, [taskPage, taskPageSize]);

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

  const fetchBacktestTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBacktestTasks({
        page: taskPage,
        per_page: taskPageSize
      });
      setBacktestTasks(response.data);
      setTaskTotal(response.total);
    } catch (error) {
      message.error('获取回测任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (e: any) => {
    setBackTestMode(e.target.value);
  };

  const handleOpenCreateModal = () => {
    setCreateModalVisible(true);
    
    // 从 localStorage 读取上次的时间范围
    const lastDateRange = localStorage.getItem('lastBacktestDateRange');
    if (lastDateRange) {
      try {
        const { start, end } = JSON.parse(lastDateRange);
        // 设置表单的默认值
        form.setFieldsValue({
          dateRange: [dayjs(start), dayjs(end)]
        });
      } catch (error) {
        console.error('解析上次时间范围失败:', error);
      }
    }
  };

  const handleStartBacktest = async (values: any) => {
    try {
      setLoading(true);
      
      const config: BacktestConfig = {
        mode: backTestMode,
        strategy: values.strategy,
        start_time: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss'),
        parameters: values.parameters || {}
      };

      if (backTestMode === 'single') {
        config.symbols = Array.isArray(values.symbols) ? values.symbols : [values.symbols];
      } else {
        config.index_symbol = values.index_symbol;
      }

      // 保存时间范围到 localStorage
      localStorage.setItem('lastBacktestDateRange', JSON.stringify({
        start: values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
        end: values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
      }));

      const response = await apiService.startBacktest(config);
      message.success(response.message || '回测任务已创建');
      
      setCreateModalVisible(false);
      form.resetFields();
      setBackTestMode('single');
      fetchBacktestTasks();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '创建回测任务失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshTaskStatus = async (taskId: string) => {
    try {
      await apiService.getBacktestStatus(taskId);
      message.success('已刷新任务状态');
      fetchBacktestTasks();
    } catch (error) {
      message.error('获取任务状态失败');
    }
  };

  const showStrategyDetail = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setStrategyDetailModal(true);
  };

  const showTaskDetail = (task: BacktestTaskInfo) => {
    setSelectedTask(task);
    setTaskDetailModal(true);
  };

  // 策略表格列定义
  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '策略代码',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '策略类型',
      dataIndex: 'strategy_type',
      key: 'strategy_type',
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
      render: (_: any, record: Strategy) => record.parameters?.length || 0,
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

  // 回测任务表格列定义
  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '股票数量',
      dataIndex: 'symbol_count',
      key: 'symbol_count',
      width: 100,
      render: (count: number) => <Tag color="blue">{count} 只</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: any = {
          'pending': { color: 'orange', text: '等待中' },
          'running': { color: 'blue', text: '运行中' },
          'completed': { color: 'green', text: '已完成' },
          'failed': { color: 'red', text: '失败' },
          'cancelled': { color: 'default', text: '已取消' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BacktestTaskInfo) => (
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

  // TAB页配置
  const tabItems = [
    {
      key: 'tasks',
      label: '回测任务',
      children: (
        <Card 
          title="回测任务监控" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
            >
              创建回测任务
            </Button>
          }
        >
          <Table
            columns={taskColumns}
            dataSource={backtestTasks}
            rowKey="id"
            loading={loading}
            pagination={{
              current: taskPage,
              pageSize: taskPageSize,
              total: taskTotal,
              onChange: (page, pageSize) => {
                setTaskPage(page);
                setTaskPageSize(pageSize || 10);
              },
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>
      ),
    },
    {
      key: 'strategies',
      label: '策略管理',
      children: (
        <Card title="可用策略列表">
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
      <Tabs defaultActiveKey="tasks" items={tabItems} />

      {/* 创建回测任务模态框 */}
      <Modal
        title="创建回测任务"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartBacktest}
        >
          {/* 回测模式选择 */}
          <Form.Item label="回测模式">
            <Radio.Group value={backTestMode} onChange={handleModeChange}>
              <Radio value="single">单股票/多股票</Radio>
              <Radio value="index">指数成分股</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 单股票模式 */}
          {backTestMode === 'single' && (
            <Form.Item
              name="symbols"
              label="股票代码"
              rules={[{ required: true, message: '请选择股票代码' }]}
              tooltip="支持选择多只股票"
            >
              <Select
                mode="multiple"
                placeholder="选择一只或多只股票"
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
          )}

          {/* 指数成分股模式 */}
          {backTestMode === 'index' && (
            <>
              <Form.Item
                name="index_symbol"
                label="指数代码"
                rules={[{ required: true, message: '请选择指数代码' }]}
                tooltip="选择指数后,系统将在执行回测时自动获取该指数的成分股"
              >
                <Select 
                  placeholder="选择指数代码"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      ?.includes(input.toLowerCase())
                  }
                >
                  <Option value="SHSE.000001">SHSE.000001 - 上证指数</Option>
                  <Option value="SHSE.000016">SHSE.000016 - 上证50</Option>
                  <Option value="SHSE.000300">SHSE.000300 - 沪深300</Option>
                  <Option value="SHSE.000852">SHSE.000852 - 中证1000</Option>
                  <Option value="SHSE.000905">SHSE.000905 - 中证500</Option>
                  <Option value="SZSE.399001">SZSE.399001 - 深证成指</Option>
                  <Option value="SZSE.399006">SZSE.399006 - 创业板指</Option>
                  <Option value="SZSE.399673">SZSE.399673 - 创业板50</Option>
                </Select>
              </Form.Item>
            </>
          )}

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
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
                setBackTestMode('single');
              }}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<PlayCircleOutlined />}
                loading={loading}
              >
                创建任务
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
            <Descriptions column={1} bordered>
              <Descriptions.Item label="策略名称">
                {selectedStrategy.display_name}
              </Descriptions.Item>
              <Descriptions.Item label="策略代码">
                <Tag>{selectedStrategy.name}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="策略描述">
                {selectedStrategy.description}
              </Descriptions.Item>
            </Descriptions>
            
            <Card title="策略参数" size="small" style={{ marginTop: 16 }}>
              {selectedStrategy.parameters && selectedStrategy.parameters.length > 0 ? (
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
              ) : (
                <Text type="secondary">该策略无可配置参数</Text>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={taskDetailModal}
        onCancel={() => setTaskDetailModal(false)}
        footer={null}
        width={700}
      >
        {selectedTask && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="任务ID">
                {selectedTask.task_id}
              </Descriptions.Item>
              <Descriptions.Item label="股票数量">
                <Tag color="blue">{selectedTask.symbol_count} 只</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="回测模式">
                <Tag color={selectedTask.parameters?.mode === 'index' ? 'purple' : 'cyan'}>
                  {selectedTask.parameters?.mode === 'index' ? '指数成分股' : '单股票/多股票'}
                </Tag>
                {selectedTask.parameters?.mode === 'index' && selectedTask.parameters?.index_symbol && (
                  <Text style={{ marginLeft: 8 }}>
                    指数: {selectedTask.parameters.index_symbol}
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={
                  selectedTask.status === 'completed' ? 'green' :
                  selectedTask.status === 'running' ? 'blue' :
                  selectedTask.status === 'failed' ? 'red' : 'orange'
                }>
                  {selectedTask.status === 'pending' ? '等待中' :
                   selectedTask.status === 'running' ? '运行中' :
                   selectedTask.status === 'completed' ? '已完成' :
                   selectedTask.status === 'failed' ? '失败' : '已取消'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="进度">
                <Progress percent={selectedTask.progress} />
              </Descriptions.Item>
              <Descriptions.Item label="回测开始时间">
                {selectedTask.start_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="回测结束时间">
                {selectedTask.end_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedTask.created_at || '-'}
              </Descriptions.Item>
              {selectedTask.error_message && (
                <Descriptions.Item label="错误信息">
                  <Text type="danger">{selectedTask.error_message}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {/* 股票列表 */}
            {selectedTask.symbols && selectedTask.symbols.length > 0 && (
              <Card 
                title={`股票列表 (${selectedTask.symbols.length}只)`}
                size="small" 
                style={{ marginTop: 16 }}
              >
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {selectedTask.symbols.map((symbol: string, index: number) => (
                    <Tag key={index} style={{ marginBottom: 4 }}>
                      {symbol}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default BacktestManager;
