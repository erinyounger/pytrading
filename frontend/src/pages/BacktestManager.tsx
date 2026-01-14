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
  SearchOutlined,
  FileTextOutlined,
  DownOutlined,
  CaretUpOutlined,
  CaretDownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { Strategy, Symbol, BacktestConfig, BacktestResult } from '../types';
import LogViewer from '../components/LogViewer';

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
  const [backtestPoolSymbols, setBacktestPoolSymbols] = useState<{symbol: string, name: string}[]>([]);
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
  const [taskLogModal, setTaskLogModal] = useState(false);
  const [resultLogModal, setResultLogModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [taskResultsMap, setTaskResultsMap] = useState<Record<string, BacktestResult[]>>({});
  const [resultSearchMap, setResultSearchMap] = useState<Record<string, string>>({});

  // 高亮匹配文本
  const highlightText = (text: string, keyword: string) => {
    const source = text || '';
    const kw = (keyword || '').trim();
    if (!kw) return source;
    const parts = kw
      .split(/\s+/)
      .filter(Boolean)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (parts.length === 0) return source;
    const regex = new RegExp(`(${parts.join('|')})`, 'gi');
    const segments = source.split(regex);
    return (
      <>
        {segments.map((seg, i) =>
          regex.test(seg) ? (
            <mark key={i} style={{ padding: 0, background: '#ffe58f' }}>{seg}</mark>
          ) : (
            <span key={i}>{seg}</span>
          )
        )}
      </>
    );
  };

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

  const fetchBacktestPoolSymbols = async () => {
    try {
      const response = await apiService.getBacktestPoolSymbols();
      setBacktestPoolSymbols(response.data);
    } catch (error) {
      console.error('获取回测池股票列表失败:', error);
      message.error('获取回测池股票列表失败');
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
    
    // 获取回测池股票列表
    fetchBacktestPoolSymbols();
    
    // 从 localStorage 读取上次的配置（只记住时间和策略）
    const lastBacktestConfig = localStorage.getItem('lastBacktestConfig');
    if (lastBacktestConfig) {
      try {
        const config = JSON.parse(lastBacktestConfig);
        // 只设置时间和策略
        form.setFieldsValue({
          dateRange: config.dateRange ? [dayjs(config.dateRange[0]), dayjs(config.dateRange[1])] : undefined,
          strategy: config.strategy,
          parameters: config.parameters
        });
      } catch (error) {
        console.error('解析上次回测配置失败:', error);
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

      // 保存时间和策略到 localStorage（不保存股票选择）
      const configToSave = {
        strategy: values.strategy,
        dateRange: [
          values.dateRange[0].format('YYYY-MM-DD HH:mm:ss'),
          values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
        ],
        parameters: values.parameters || {}
      };
      localStorage.setItem('lastBacktestConfig', JSON.stringify(configToSave));

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

  // 获取任务的回测结果
  const fetchTaskResults = async (taskId: string) => {
    if (taskResultsMap[taskId]) {
      return; // 已经加载过了
    }
    try {
      const response = await apiService.getTaskResults(taskId);
      setTaskResultsMap(prev => ({
        ...prev,
        [taskId]: response.data || []
      }));
    } catch (error) {
      console.error('获取任务结果失败:', error);
      setTaskResultsMap(prev => ({
        ...prev,
        [taskId]: []
      }));
    }
  };

  // 处理展开/收起
  const handleExpand = (expanded: boolean, record: BacktestTaskInfo) => {
    if (expanded) {
      fetchTaskResults(record.task_id);
      setExpandedRowKeys([...expandedRowKeys, record.id]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
    }
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
      align: 'center' as const,
      render: (_: any, record: Strategy) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {record.parameters?.length || 0}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      width: 100,
      render: (_: any, record: Strategy) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          onClick={() => showStrategyDetail(record)}
          size="small"
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 回测任务表格列定义
  const taskColumns = [
    {
      title: '序号',
      key: 'index',
      align: 'center' as const,
      render: (_: any, __: BacktestTaskInfo, index: number) => (taskPage - 1) * taskPageSize + index + 1,
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      ellipsis: true,
      sorter: (a: BacktestTaskInfo, b: BacktestTaskInfo) => a.task_id.localeCompare(b.task_id),
    },
    {
      title: '股票数量',
      dataIndex: 'symbol_count',
      key: 'symbol_count',
      align: 'center' as const,
      sorter: (a: BacktestTaskInfo, b: BacktestTaskInfo) => (a.symbol_count || 0) - (b.symbol_count || 0),
      render: (count: number, record: BacktestTaskInfo) => (
        <Tag
          color="blue"
          style={{ cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}
          onClick={() => handleExpand(!(expandedRowKeys || []).includes(record.id), record)}
        >
          {count} 只
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      sorter: (a: BacktestTaskInfo, b: BacktestTaskInfo) => {
        const order: Record<string, number> = { pending: 0, running: 1, completed: 2, failed: -1, cancelled: -2 };
        return (order[a.status] ?? 0) - (order[b.status] ?? 0);
      },
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
      sorter: (a: BacktestTaskInfo, b: BacktestTaskInfo) => (a.progress || 0) - (b.progress || 0),
      render: (progress: number, record: BacktestTaskInfo) => (
        <div>
          <Progress 
            percent={progress} 
            size="small" 
            format={(percent) => `${percent}%`}
            status={
              record.status === 'failed' ? 'exception' : 
              record.status === 'completed' ? 'success' : 
              'active'
            }
          />
          {record.status === 'running' && record.symbol_count > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {Math.round(progress * record.symbol_count / 100)}/{record.symbol_count} 只股票
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a: BacktestTaskInfo, b: BacktestTaskInfo) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      },
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      render: (_: any, record: BacktestTaskInfo) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedTask(record);
              setTaskLogModal(true);
            }}
          >
            日志
          </Button>
          <Button 
            type="text" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showTaskDetail(record)}
          >
            详情
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
          bordered={false}
          bodyStyle={{ padding: '16px' }}
          extra={
            <Space size="small">
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => fetchBacktestTasks()}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
                size="small"
              >
                创建任务
              </Button>
            </Space>
          }
        >
          <Table
            columns={taskColumns}
            dataSource={backtestTasks}
            rowKey="id"
            loading={loading}
            size="small"
            tableLayout="auto"
            expandable={{
              expandedRowKeys,
              onExpand: handleExpand,
              expandedRowRender: (record) => {
                const results = taskResultsMap[record.task_id] || [];
                const searchText = (resultSearchMap[record.task_id] || '').toLowerCase().trim();
                const searchParts = searchText.split(/\s+/).filter(Boolean);
                const filteredResults = searchParts.length > 0
                  ? results.filter(r => {
                      const text = `${r.symbol || ''} ${r.name || ''}`.toLowerCase();
                      return searchParts.every(p => text.includes(p));
                    })
                  : results;
                const resultColumns = [
                  {
                    title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
                    sorter: (a: BacktestResult, b: BacktestResult) => (a.symbol || '').localeCompare(b.symbol || ''),
                    render: (val: string) => highlightText(val, resultSearchMap[record.task_id] || ''),
    },
    {
                    title: '名称',
      dataIndex: 'name',
      key: 'name',
                    sorter: (a: BacktestResult, b: BacktestResult) => (a.name || '').localeCompare(b.name || ''),
                    render: (val: string) => highlightText(val, resultSearchMap[record.task_id] || ''),
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
                    align: 'right' as const,
                    render: (price: number) => (
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {price ? price.toFixed(2) : '-'}
                      </span>
                    ),
                    sorter: (a: BacktestResult, b: BacktestResult) => (Number(a.current_price) || 0) - (Number(b.current_price) || 0),
                  },
                  {
                    title: '累计收益率',
                    dataIndex: 'pnl_ratio',
                    key: 'pnl_ratio',
                    align: 'right' as const,
                    render: (ratio: number) => {
                      const val = Number(ratio) || 0;
                      // 金融配色（A股/港股常用）：上涨=红色，下跌=绿色
                      const color = val > 0.0001 ? '#f5222d' : val < -0.0001 ? '#52c41a' : '#8c8c8c';
                      const Icon = val > 0 ? CaretUpOutlined : val < 0 ? CaretDownOutlined : undefined;
                      return (
                        <span style={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                          {Icon ? <Icon style={{ color, marginRight: 4 }} /> : null}
                          {(val * 100).toFixed(2)}%
        </span>
                      );
                    },
                    sorter: (a: BacktestResult, b: BacktestResult) => (Number(a.pnl_ratio) || 0) - (Number(b.pnl_ratio) || 0),
    },
    {
                    title: '胜率',
                    dataIndex: 'win_ratio',
                    key: 'win_ratio',
                    align: 'right' as const,
                    render: (ratio: number) => {
                      const val = Number(ratio) || 0;
                      // 避免与涨跌颜色冲突：使用蓝/橙/灰
                      const color = val >= 0.6 ? '#1677ff' : val >= 0.4 ? '#faad14' : '#8c8c8c';
                      return (
                        <span style={{ color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                          {(val * 100).toFixed(1)}%
        </span>
                      );
                    },
                    sorter: (a: BacktestResult, b: BacktestResult) => (Number(a.win_ratio) || 0) - (Number(b.win_ratio) || 0),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    align: 'center' as const,
                    width: 80,
                    render: (_: any, result: BacktestResult) => (
                      <Button
                        type="text"
                        size="small"
                        icon={<FileTextOutlined />}
                        onClick={() => {
                          setSelectedTask(record);
                          setSelectedSymbol(result.symbol);
                          setResultLogModal(true);
                        }}
                      >
                        日志
                      </Button>
                    ),
                  },
                ];
        return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>共 {filteredResults.length} 条</Text>
                      <Input
                        size="small"
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="搜索标的/名称（空格分词）"
                        value={resultSearchMap[record.task_id] || ''}
                        onChange={(e) =>
                          setResultSearchMap(prev => ({ ...prev, [record.task_id]: e.target.value }))
                        }
                        style={{ width: 220 }}
                      />
                    </div>
                    <Table
                      columns={resultColumns}
                      dataSource={filteredResults}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      size="small"
                      tableLayout="auto"
                      loading={!taskResultsMap[record.task_id]}
                    />
                  </div>
                );
              },
            }}
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
              size: 'small' as const,
            }}
          />
        </Card>
      ),
    },
    {
      key: 'strategies',
      label: '策略管理',
      children: (
        <Card
          bordered={false}
          bodyStyle={{ padding: '16px' }}
          extra={
          <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchInitialData()}
              loading={loading}
              size="small"
            >
              刷新
            </Button>
          }
        >
          <Table
            columns={strategyColumns}
            dataSource={strategies}
            rowKey="name"
            loading={loading}
            pagination={false}
            size="small"
            tableLayout="auto"
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Tabs defaultActiveKey="tasks" items={tabItems} type="card" />

      {/* 创建回测任务模态框 */}
      <Modal
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>创建回测任务</span>}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        bodyStyle={{ padding: '20px' }}
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
              tooltip="从回测池中选择股票，支持选择多只股票"
                >
                  <Select
                mode="multiple"
                placeholder="从回测池中选择股票"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      const searchText = input.toLowerCase().trim();
                      if (!searchText) return true;
                      
                      // 获取选项的文本内容
                      const optionText = option?.children?.toString().toLowerCase() || '';
                      
                      // 支持多种匹配方式：
                      // 1. 股票代码匹配
                      // 2. 股票名称匹配  
                      // 3. 部分匹配
                      return optionText.includes(searchText);
                    }}
                    notFoundContent="未找到匹配的股票"
                  >
                    {backtestPoolSymbols.map(symbol => (
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
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const searchText = input.toLowerCase().trim();
                    if (!searchText) return true;
                    
                    // 获取选项的文本内容
                    const optionText = option?.children?.toString().toLowerCase() || '';
                    
                    // 支持指数代码和名称的模糊匹配
                    return optionText.includes(searchText);
                  }}
                  notFoundContent="未找到匹配的指数"
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
                  <Select 
                    placeholder="选择策略类型"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    filterOption={(input, option) => {
                      const searchText = input.toLowerCase().trim();
                      if (!searchText) return true;
                      
                      // 获取选项的文本内容
                      const optionText = option?.children?.toString().toLowerCase() || '';
                      
                      // 支持策略名称的模糊匹配
                      return optionText.includes(searchText);
                    }}
                    notFoundContent="未找到匹配的策略"
                  >
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
                    presets={[
                      { label: '过去1个月', value: [dayjs().subtract(1, 'month').startOf('day'), dayjs().endOf('day')] },
                      { label: '过去3个月', value: [dayjs().subtract(3, 'month').startOf('day'), dayjs().endOf('day')] },
                      { label: '过去6个月', value: [dayjs().subtract(6, 'month').startOf('day'), dayjs().endOf('day')] },
                      { label: '过去1年', value: [dayjs().subtract(1, 'year').startOf('day'), dayjs().endOf('day')] },
                      { label: '过去2年', value: [dayjs().subtract(2, 'year').startOf('day'), dayjs().endOf('day')] },
                    ]}
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
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>策略详情</span>}
        open={strategyDetailModal}
        onCancel={() => setStrategyDetailModal(false)}
        footer={null}
        width={600}
        bodyStyle={{ padding: '20px' }}
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
            
            <Card title="策略参数" size="small" bordered={false} style={{ marginTop: 16 }} headStyle={{ padding: '8px 12px' }} bodyStyle={{ padding: '12px' }}>
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
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>任务详情</span>}
        open={taskDetailModal}
        onCancel={() => setTaskDetailModal(false)}
        footer={null}
        bodyStyle={{ padding: '20px' }}
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
                <div>
                  <Progress 
                    percent={selectedTask.progress} 
                    format={(percent) => `${percent}%`}
                    status={
                      selectedTask.status === 'failed' ? 'exception' : 
                      selectedTask.status === 'completed' ? 'success' : 
                      'active'
                    }
                  />
                  {selectedTask.status === 'running' && selectedTask.symbol_count > 0 && (
                    <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                      已完成 {Math.round(selectedTask.progress * selectedTask.symbol_count / 100)}/{selectedTask.symbol_count} 只股票
                    </Text>
                  )}
          </div>
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
          </>
        )}
      </Modal>

      {/* 任务日志模态框 */}
      <Modal
        title={
          <span style={{ fontSize: '16px', fontWeight: 500 }}>
            任务日志 - {selectedTask?.task_id || ''}
          </span>
        }
        open={taskLogModal}
        onCancel={() => setTaskLogModal(false)}
        footer={null}
        width={1200}
        bodyStyle={{ padding: 0 }}
      >
        {selectedTask && (
          <LogViewer 
            taskId={selectedTask.task_id}
            title={`任务日志 - ${selectedTask.task_id}`}
            height={600}
          />
        )}
      </Modal>

      {/* 个股日志模态框 */}
      <Modal
        title={
          <span style={{ fontSize: '16px', fontWeight: 500 }}>
            个股日志 - {selectedSymbol}
          </span>
        }
        open={resultLogModal}
        onCancel={() => {
          setResultLogModal(false);
          setSelectedSymbol('');
        }}
        footer={null}
        width={1200}
        bodyStyle={{ padding: 0 }}
      >
        {selectedTask && selectedSymbol && (
          <LogViewer 
            taskId={selectedTask.task_id}
            symbol={selectedSymbol}
            title={`个股日志 - ${selectedSymbol}`}
            height={600}
          />
        )}
      </Modal>
    </div>
  );
};

export default BacktestManager;
