import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
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
  Popconfirm,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Form
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  ThunderboltOutlined,
  BankOutlined,
  TableOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { apiService } from '../services/api';
import { Strategy, Symbol, BacktestConfig, BacktestResult } from '../types';
import LogViewer from '../components/LogViewer';
import { darkTheme, globalDarkStyles } from '../styles/darkTheme';

dayjs.extend(duration);

const { Option, OptGroup } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

// 状态配置
const STATUS_CONFIG = {
  pending: { color: 'orange', text: '等待中', icon: <ClockCircleOutlined /> },
  running: { color: 'processing', text: '运行中', icon: <ThunderboltOutlined spin /> },
  completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
  cancelled: { color: 'default', text: '已取消', icon: <MinusCircleOutlined /> },
};

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
  updated_at?: string;
  duration?: number;
}

const BacktestManager: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const currentSymbolRef = useRef<string>('');
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [taskResultsMap, setTaskResultsMap] = useState<Record<string, BacktestResult[]>>({});
  const [resultSearchMap, setResultSearchMap] = useState<Record<string, string>>({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [datePreset, setDatePreset] = useState<string>('');

  // 日期快捷选项
  const datePresets = [
    { label: '最近一周', value: '7d', getValue: () => [dayjs().subtract(7, 'day'), dayjs()] },
    { label: '最近一月', value: '1m', getValue: () => [dayjs().subtract(1, 'month'), dayjs()] },
    { label: '最近半年', value: '6m', getValue: () => [dayjs().subtract(6, 'month'), dayjs()] },
    { label: '最近一年', value: '1y', getValue: () => [dayjs().subtract(1, 'year'), dayjs()] },
    { label: '最近两年', value: '2y', getValue: () => [dayjs().subtract(2, 'year'), dayjs()] },
  ];

  // 处理快捷选项变化 (预留功能)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDatePresetChange = (presetValue: string) => {
    setDatePreset(presetValue);
    const preset = datePresets.find(p => p.value === presetValue);
    if (preset) {
      const [start, end] = preset.getValue();
      form.setFieldsValue({ dateRange: [start, end] });
    }
  };

  // 统计信息
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 计算统计信息
  useEffect(() => {
    const running = backtestTasks.filter(t => t.status === 'running').length;
    const completed = backtestTasks.filter(t => t.status === 'completed').length;
    const failed = backtestTasks.filter(t => t.status === 'failed').length;
    setStats({
      total: taskTotal,
      running,
      completed,
      failed
    });
  }, [backtestTasks, taskTotal]);

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

  const fetchBacktestTasks = useCallback(async () => {
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
  }, [taskPage, taskPageSize]);

  useEffect(() => {
    fetchBacktestTasks();
  }, [fetchBacktestTasks]);

  const handleModeChange = (e: any) => {
    setBackTestMode(e.target.value);
  };

  const handleOpenCreateModal = () => {
    setCreateModalVisible(true);
    fetchBacktestPoolSymbols();
    
    const lastBacktestConfig = localStorage.getItem('lastBacktestConfig');
    if (lastBacktestConfig) {
      try {
        const config = JSON.parse(lastBacktestConfig);
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiService.deleteTask(taskId);
      message.success('任务已删除');
      fetchBacktestTasks();
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '删除任务失败');
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

  const fetchTaskResults = async (taskId: string, forceRefresh: boolean = false) => {
    if (!forceRefresh && taskResultsMap[taskId]) return;
    try {
      const response = await apiService.getTaskResults(taskId);
      setTaskResultsMap(prev => ({
        ...prev,
        [taskId]: response.data || []
      }));
    } catch (error) {
      console.error('获取任务结果失败:', error);
      setTaskResultsMap(prev => ({ ...prev, [taskId]: [] }));
    }
  };

  const handleExpand = (expanded: boolean, record: BacktestTaskInfo) => {
    if (expanded) {
      // 展开时强制刷新数据
      fetchTaskResults(record.task_id, true);
      setExpandedRowKeys(prev => [...prev, record.id]);
    } else {
      setExpandedRowKeys(prev => prev.filter(key => key !== record.id));
    }
  };

  // 回测任务表格列定义
  const taskColumns = [
    {
      title: '序号',
      key: 'index',
      align: 'center' as const,
      width: 60,
      render: (_: any, __: BacktestTaskInfo, index: number) => (taskPage - 1) * taskPageSize + index + 1,
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      ellipsis: true,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable style={{ fontFamily: 'monospace', fontSize: 12, color: darkTheme.textPrimary }}>{id}</Text>
        </Tooltip>
      ),
    },
    {
      title: '标的数',
      dataIndex: 'symbol_count',
      key: 'symbol_count',
      align: 'center' as const,
      width: 80,
      render: (count: number, record: BacktestTaskInfo) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: darkTheme.accent }}
          onClick={() => handleExpand(!(expandedRowKeys || []).includes(record.id), record)}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      width: 100,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number, record: BacktestTaskInfo) => (
        <div>
          <Progress
            percent={progress}
            size="small"
            strokeColor={darkTheme.accent}
            format={(percent) => <span style={{ color: darkTheme.textPrimary }}>{percent}%</span>}
            status={
              record.status === 'failed' ? 'exception' :
              record.status === 'completed' ? 'success' :
              record.status === 'running' ? 'active' : 'normal'
            }
          />
          {record.status === 'running' && record.symbol_count > 0 && (
            <Text type="secondary" style={{ fontSize: 11, color: darkTheme.textSecondary }}>
              {Math.round(progress * record.symbol_count / 100)}/{record.symbol_count}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      align: 'center' as const,
      width: 80,
      render: (duration: number | undefined, record: BacktestTaskInfo) => {
        if (record.status === 'pending') return '-';
        if (duration == null) return '-';
        const seconds = record.status === 'running'
          ? Math.floor((Date.now() - new Date(record.created_at).getTime()) / 1000)
          : duration;
        if (seconds < 60) return `${seconds}秒`;
        if (seconds < 3600) {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return s > 0 ? `${m}分${s}秒` : `${m}分`;
        }
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return m > 0 ? `${h}小时${m}分` : `${h}小时`;
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      width: 200,
      render: (_: any, record: BacktestTaskInfo) => (
        <Space size={4}>
          <Tooltip title="查看日志">
            <Button
              type="text"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => {
                setSelectedTask(record);
                setTaskLogModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="任务详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showTaskDetail(record)}
            />
          </Tooltip>
          {record.status === 'running' && (
            <Popconfirm
              title="停止任务"
              description="确定要停止此任务吗？"
              onConfirm={async () => {
                try {
                  await apiService.stopTask(record.task_id);
                  message.success('任务已停止');
                  fetchBacktestTasks();
                } catch (error) {
                  message.error('停止任务失败');
                }
              }}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="停止任务">
                <Button type="text" size="small" icon={<PauseCircleOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          )}
          {['failed', 'completed', 'cancelled'].includes(record.status) && (
            <Popconfirm
              title="重启任务"
              description="确定要重新运行此任务吗？"
              onConfirm={async () => {
                try {
                  const result = await apiService.restartTask(record.task_id);
                  message.success(`任务已重启: ${result.task_id}`);
                  fetchBacktestTasks();
                } catch (error) {
                  message.error('重启任务失败');
                }
              }}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="重新运行">
                <Button type="text" size="small" icon={<SyncOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
          <Popconfirm
            title="删除任务"
            description="删除后无法恢复"
            onConfirm={async () => {
              try {
                await handleDeleteTask(record.task_id);
              } catch (error) {
                message.error('删除任务失败');
              }
            }}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除任务">
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 结果表格列定义
  const resultColumns = [
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (val: string) => <Text strong style={{ color: darkTheme.textPrimary }}>{val}</Text>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'current_price',
      key: 'current_price',
      align: 'right' as const,
      width: 90,
      render: (price: number) => (
        <Text style={{ fontVariantNumeric: 'tabular-nums', color: darkTheme.textPrimary }}>
          {price ? price.toFixed(2) : '-'}
        </Text>
      ),
    },
    {
      title: '收益率',
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      align: 'right' as const,
      width: 100,
      render: (ratio: number) => {
        const val = Number(ratio) || 0;
        const color = val > 0.0001 ? darkTheme.positive : val < -0.0001 ? darkTheme.negative : darkTheme.textMuted;
        const Icon = val > 0 ? CaretUpOutlined : val < 0 ? CaretDownOutlined : undefined;
        return (
          <Text style={{ color, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {Icon && <Icon style={{ marginRight: 2 }} />}
            {(val * 100).toFixed(2)}%
          </Text>
        );
      },
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      align: 'right' as const,
      width: 80,
      render: (ratio: number) => {
        const val = Number(ratio) || 0;
        const color = val >= 0.6 ? darkTheme.accent : val >= 0.4 ? '#faad14' : darkTheme.textMuted;
        return <Text style={{ color, fontWeight: 500 }}>{(val * 100).toFixed(1)}%</Text>;
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      width: 100,
      // 这个列会在 expandedRowRender 中被动态覆盖
      render: () => null,
    },
  ];

  // 策略表格列定义
  const strategyColumns = [
    {
      title: '策略名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (name: string) => <Text strong style={{ color: darkTheme.textPrimary }}>{name}</Text>,
    },
    {
      title: '代码',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="blue">{name}</Tag>
    },
    {
      title: '类型',
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
      title: '操作',
      key: 'action',
      align: 'center' as const,
      width: 80,
      render: (_: any, record: Strategy) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showStrategyDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  // TAB页配置
  const tabItems = [
    {
      key: 'tasks',
      label: (
        <span>
          <TableOutlined /> 回测任务
        </span>
      ),
      children: (
        <div style={{ background: darkTheme.cardBackground, borderRadius: 8 }}>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="总任务数" value={stats.total} prefix={<TableOutlined />} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="运行中"
                  value={stats.running}
                  valueStyle={{ color: darkTheme.accent }}
                  prefix={<ThunderboltOutlined spin />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已完成"
                  value={stats.completed}
                  valueStyle={{ color: darkTheme.negative }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="失败"
                  value={stats.failed}
                  valueStyle={{ color: darkTheme.positive }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* 操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '12px 16px', background: darkTheme.cardBackgroundAlt, borderRadius: 8 }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={async () => {
                  await fetchBacktestTasks();
                  // 同时刷新所有任务的结果数据（不管是否展开）
                  const allTaskIds = backtestTasks.map(t => t.task_id);
                  allTaskIds.forEach((taskId: string) => {
                    fetchTaskResults(taskId, true);
                  });
                }}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
              新建任务
            </Button>
          </div>

          <Table
            columns={taskColumns}
            dataSource={backtestTasks}
            rowKey="id"
            loading={loading}
            size="middle"
            style={{
              background: darkTheme.cardBackground,
            }}
            onRow={() => ({
              style: {
                background: darkTheme.cardBackground,
                color: darkTheme.textPrimary,
              },
            })}
            expandable={{
              expandedRowKeys,
              onExpand: handleExpand,
              expandedRowRender: (record) => {
                const results = taskResultsMap[record.task_id] || [];
                const searchText = (resultSearchMap[record.task_id] || '').toLowerCase().trim();
                const searchParts = searchText.split(/\s+/).filter(Boolean);
                const filteredResults = searchParts.length > 0
                  ? results.filter(r => `${r.symbol || ''} ${r.name || ''}`.toLowerCase().includes(searchText))
                  : results;
                
                return (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text type="secondary">共 {filteredResults.length} 条结果</Text>
                      <Input
                        size="small"
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="搜索标的/名称"
                        value={resultSearchMap[record.task_id] || ''}
                        onChange={(e) => setResultSearchMap(prev => ({ ...prev, [record.task_id]: e.target.value }))}
                        style={{ width: 180 }}
                      />
                    </div>
                    <Table
                      columns={resultColumns.map(col => {
                        if (col.key === 'action') {
                          return {
                            ...col,
                            render: (_: any, result: BacktestResult) => (
                              <Space size={4}>
                                <Tooltip title="个股日志">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<FileTextOutlined />}
                                    onClick={() => {
                                      const symbol = result.symbol || '';
                                      currentSymbolRef.current = symbol;
                                      // 使用展开行的 task_id
                                      setSelectedTask({ task_id: record.task_id } as any);
                                      setResultLogModal(true);
                                    }}
                                  />
                                </Tooltip>
                              </Space>
                            )
                          };
                        }
                        return col;
                      })}
                      dataSource={filteredResults}
                      rowKey="id"
                      pagination={{ pageSize: 5, showSizeChanger: true }}
                      size="small"
                      loading={!taskResultsMap[record.task_id]}
                      style={{
                        background: darkTheme.cardBackground,
                      }}
                      onRow={() => ({
                        style: {
                          background: darkTheme.cardBackground,
                          color: darkTheme.textPrimary,
                        },
                      })}
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
              showTotal: (total) => `共 ${total} 条`,
              showSizeChanger: true,
            }}
          />
        </div>
      ),
    },
    {
      key: 'strategies',
      label: (
        <span>
          <BankOutlined /> 策略管理
        </span>
      ),
      children: (
        <Card
          title="策略列表"
          extra={
            <Button icon={<ReloadOutlined />} onClick={() => fetchInitialData()} loading={loading}>
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
            style={{
              background: darkTheme.cardBackground,
            }}
            onRow={() => ({
              style: {
                background: darkTheme.cardBackground,
                color: darkTheme.textPrimary,
              },
            })}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="backtest-manager-container">
      <style>{globalDarkStyles}</style>
      <Tabs className="dark-tabs" items={tabItems} type="card" size="large" />

      {/* 创建回测任务模态框 */}
      <Modal
        className="dark-modal"
        title={<><PlusOutlined /> 创建回测任务</>}
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        footer={null}
        width={560}
      >
        <Form className="dark-form" form={form} layout="vertical" onFinish={handleStartBacktest}>
          <Form.Item label="回测模式">
            <Radio.Group value={backTestMode} onChange={handleModeChange}>
              <Radio.Button value="single">单股票</Radio.Button>
              <Radio.Button value="index">指数成分股</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {backTestMode === 'single' ? (
            <Form.Item name="symbols" label="股票代码" rules={[{ required: true, message: '请选择股票' }]}>
              <Select mode="multiple" placeholder="选择股票/ETF" showSearch allowClear>
                <OptGroup label="宽基ETF">
                  <Option value="SHSE.510050">510050 - 上证50ETF</Option>
                  <Option value="SHSE.510300">510300 - 沪深300ETF</Option>
                  <Option value="SHSE.510500">510500 - 中证500ETF</Option>
                  <Option value="SHSE.512100">512100 - 中证1000ETF</Option>
                  <Option value="SZSE.159915">159915 - 创业板ETF</Option>
                  <Option value="SZSE.159919">159919 - 创业板50ETF</Option>
                </OptGroup>
                <OptGroup label="行业/主题ETF">
                  <Option value="SHSE.588000">588000 - 科创50ETF</Option>
                  <Option value="SHSE.513100">513100 - 恒生ETF</Option>
                  <Option value="SHSE.513050">513050 - 中概互联网ETF</Option>
                </OptGroup>
                <OptGroup label="历史回测股票">
                  {backtestPoolSymbols.map(s => (
                    <Option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</Option>
                  ))}
                </OptGroup>
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="index_symbol" label="指数代码" rules={[{ required: true, message: '请选择指数' }]}>
              <Select mode="multiple" placeholder="选择指数" showSearch allowClear>
                <OptGroup label="核心指数">
                  <Option value="SHSE.000016">上证50</Option>
                  <Option value="SHSE.000300">沪深300</Option>
                  <Option value="SHSE.000905">中证500</Option>
                  <Option value="SHSE.000852">中证1000</Option>
                  <Option value="SHSE.000001">上证指数</Option>
                  <Option value="SZSE.399001">深证成指</Option>
                  <Option value="SZSE.399006">创业板指</Option>
                </OptGroup>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="strategy" label="策略" rules={[{ required: true, message: '请选择策略' }]}>
            <Select placeholder="选择策略" showSearch allowClear>
              {strategies.map(s => (
                <Option key={s.name} value={s.name}>{s.display_name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label="时间范围" rules={[{ required: true, message: '请选择时间' }]}>
            <RangePicker 
              showTime 
              style={{ width: '100%' }}
              presets={datePresets.map(p => ({ label: p.label, value: [p.getValue()[0], p.getValue()[1]] }))}
              onChange={() => setDatePreset('')}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setCreateModalVisible(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<PlayCircleOutlined />} loading={loading}>
                创建任务
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 策略详情模态框 */}
      <Modal
        className="dark-modal"
        title="策略详情"
        open={strategyDetailModal}
        onCancel={() => setStrategyDetailModal(false)}
        footer={null}
        width={500}
      >
        {selectedStrategy && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="名称">{selectedStrategy.display_name}</Descriptions.Item>
            <Descriptions.Item label="代码"><Tag>{selectedStrategy.name}</Tag></Descriptions.Item>
            <Descriptions.Item label="描述">{selectedStrategy.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        className="dark-modal"
        title="任务详情"
        open={taskDetailModal}
        onCancel={() => setTaskDetailModal(false)}
        footer={null}
        width={500}
      >
        {selectedTask && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="任务ID">{selectedTask.task_id}</Descriptions.Item>
            <Descriptions.Item label="标的数"><Tag color="blue">{selectedTask.symbol_count}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_CONFIG[selectedTask.status]?.color}>
                {STATUS_CONFIG[selectedTask.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="进度"><Progress percent={selectedTask.progress} strokeColor={darkTheme.accent} /></Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedTask.created_at}</Descriptions.Item>
            {selectedTask.error_message && (
              <Descriptions.Item label="错误信息"><Text type="danger">{selectedTask.error_message}</Text></Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 日志模态框 */}
      <Modal
        className="dark-modal"
        title={`日志 - ${selectedTask?.task_id || ''}`}
        open={taskLogModal}
        onCancel={() => setTaskLogModal(false)}
        footer={null}
        width={1000}
        styles={{ body: { padding: 0 } }}
      >
        {selectedTask && <LogViewer taskId={selectedTask.task_id} height={500} />}
      </Modal>

      <Modal
        className="dark-modal"
        title={`个股日志 - ${currentSymbolRef.current}`}
        open={resultLogModal}
        onCancel={() => { setResultLogModal(false); currentSymbolRef.current = ''; }}
        footer={null}
        width={1000}
        styles={{ body: { padding: 0 } }}
      >
        {selectedTask && currentSymbolRef.current ? (
          <LogViewer taskId={selectedTask.task_id} symbol={currentSymbolRef.current} height={500} />
        ) : (
          <div style={{ padding: 50, textAlign: 'center', color: darkTheme.textMuted }}>
            加载中... selectedTask={!!selectedTask} symbol={currentSymbolRef.current}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BacktestManager;
