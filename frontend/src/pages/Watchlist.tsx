import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Tooltip,
  message,
  Select,
  Empty,
  Spin,
  Modal,
  Switch,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table/interface';
import {
  ReloadOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { apiService } from '../services/api';
import type { WatchlistItem, TradeRecord } from '../types';
import { darkTheme, globalDarkStyles } from '../styles/darkTheme';
import StockChart from '../components/StockChart';

const { Option } = Select;

const Watchlist: React.FC = () => {
  const [data, setData] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [watchTypeFilter, setWatchTypeFilter] = useState<string | undefined>();
  const [typeChangedCount, setTypeChangedCount] = useState(0);

  // K线图相关状态
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('');
  const [chartName, setChartName] = useState('');
  const [klineData, setKlineData] = useState<any[]>([]);
  const [klineLoading, setKlineLoading] = useState(false);
  const [tradeRecords, setTradeRecords] = useState<TradeRecord[]>([]);
  const [chartBacktestStart, setChartBacktestStart] = useState<string | undefined>();
  const [chartBacktestEnd, setChartBacktestEnd] = useState<string | undefined>();
  const [chartTaskId, setChartTaskId] = useState<string | undefined>();

  // 定时回测相关状态
  const [autoBacktestEnabled, setAutoBacktestEnabled] = useState(false);
  const [autoBacktestTime, setAutoBacktestTime] = useState('17:00');
  const [backtestLoading, setBacktestLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiService.getWatchlist({
        sort_by: sortBy,
        sort_order: sortOrder,
        watch_type: watchTypeFilter,
      });
      setData(result.data);
      setTypeChangedCount(result.type_changed_count);
    } catch (error) {
      message.error('获取关注列表失败');
      console.error('获取关注列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, watchTypeFilter]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // 加载定时回测配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await apiService.getConfig();
        setAutoBacktestEnabled(config.watchlist_auto_backtest_enabled || false);
        setAutoBacktestTime(config.watchlist_auto_backtest_time || '17:00');
      } catch (error) {
        console.error('加载配置失败:', error);
      }
    };
    loadConfig();
  }, []);

  // 获取K线数据
  // 查看K线图
  const handleViewChart = async (record: WatchlistItem) => {
    setChartSymbol(record.symbol);
    setChartName(record.name || record.symbol);
    setChartModalVisible(true);
    setTradeRecords([]);

    // 设置回测日期范围
    const btStart = record.backtest_start_time?.split('T')[0];
    const btEnd = record.backtest_end_time?.split('T')[0];
    setChartBacktestStart(btStart);
    setChartBacktestEnd(btEnd);

    // 获取K线数据
    try {
      setKlineLoading(true);
      const response = await apiService.getKlineData(record.symbol, btStart, btEnd);
      const klineData = response.data || [];
      setKlineData(klineData);

      // 获取交易记录 - 使用 watchlist item 的 last_backtest_task_id
      if (record.last_backtest_task_id) {
        setChartTaskId(record.last_backtest_task_id);
        try {
          const trResp = await apiService.getTradeRecords(record.last_backtest_task_id, record.symbol);
          // 过滤交易记录，只保留在K线数据日期范围内的
          const klineDates = new Set(klineData.map((k: any) => k.date));
          const filteredRecords = (trResp.data || []).filter((r: any) => r.bar_time && klineDates.has(r.bar_time));
          setTradeRecords(filteredRecords);
        } catch {
          setTradeRecords([]);
        }
      }
    } catch (error) {
      console.error('获取K线数据失败:', error);
      setKlineData([]);
    } finally {
      setKlineLoading(false);
    }
  };

  // 取消关注
  const handleRemove = async (id: number) => {
    try {
      await apiService.removeWatch(id);
      message.success('取消关注成功');
      fetchWatchlist();
    } catch (error) {
      message.error('取消关注失败');
      console.error('取消关注失败:', error);
    }
  };

  // 标记已读
  const handleMarkAsRead = async (id: number) => {
    try {
      await apiService.markWatchAsRead(id);
      fetchWatchlist();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 一键回测
  const handleBacktest = async () => {
    try {
      setBacktestLoading(true);
      const result = await apiService.startWatchlistBacktest();
      if (result.task_ids.length > 0) {
        message.success(result.message);
      } else if (result.skipped_strategies.length > 0) {
        message.warning(result.message);
      } else {
        message.info(result.message);
      }
    } catch (error) {
      message.error('一键回测失败');
      console.error('一键回测失败:', error);
    } finally {
      setBacktestLoading(false);
    }
  };

  // 定时回测开关变化
  const handleAutoBacktestChange = async (enabled: boolean) => {
    try {
      await apiService.updateConfig({
        watchlist_auto_backtest_enabled: enabled,
        watchlist_auto_backtest_time: autoBacktestTime,
      });
      setAutoBacktestEnabled(enabled);
      message.success(enabled ? '定时回测已开启' : '定时回测已关闭');
    } catch (error) {
      message.error('设置保存失败');
      console.error('设置保存失败:', error);
    }
  };

  // 定时回测时间变化
  const handleTimeChange = async (time: any) => {
    // 使用 HH:mm 格式确保只保存小时和分钟，不受时区影响
    const timeStr = time ? time.format('HH:mm') : '17:00';
    try {
      await apiService.updateConfig({
        watchlist_auto_backtest_enabled: autoBacktestEnabled,
        watchlist_auto_backtest_time: timeStr,
      });
      setAutoBacktestTime(timeStr);
    } catch (error) {
      message.error('设置保存失败');
      console.error('设置保存失败:', error);
    }
  };

  // 关注类型标签颜色
  const getWatchTypeColor = (watchType: string) => {
    switch (watchType) {
      case '趋势上涨':
        return 'red';
      case '趋势下行':
        return 'green';
      case '关注中':
        return 'blue';
      case '趋势结束':
        return 'orange';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<WatchlistItem> = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left' as const,
      width: 120,
      render: (value: string, record: WatchlistItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ fontWeight: 500, cursor: 'pointer', color: '#1890ff' }}
            onClick={() => handleViewChart(record)}
          >
            {value}
          </span>
          {record.type_changed && (
            <Tooltip title="关注类型发生变化">
              <StarFilled style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '策略',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      width: 100,
      render: (value: string) => (
        <Tag color="blue">{value || '-'}</Tag>
      ),
    },
    {
      title: '关注类型',
      dataIndex: 'watch_type',
      key: 'watch_type',
      width: 100,
      render: (value: string) => (
        <Tag color={getWatchTypeColor(value)}>{value}</Tag>
      ),
    },
    {
      title: '收益率',
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      width: 90,
      sorter: true,
      render: (value: number | null | undefined) => (
        <span style={{
          color: value !== null && value !== undefined && value > 0 ? '#ff4d4f' : '#52c41a',
          fontWeight: 500,
        }}>
          {value !== null && value !== undefined ? `${(value * 100).toFixed(2)}%` : '-'}
        </span>
      ),
    },
    {
      title: '夏普比率',
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      width: 90,
      sorter: true,
      render: (value: number | null | undefined) => (
        <span>
          {value !== null && value !== undefined ? value.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      width: 80,
      sorter: true,
      render: (value: number | null | undefined) => (
        <span>
          {value !== null && value !== undefined ? `${(value * 100).toFixed(1)}%` : '-'}
        </span>
      ),
    },
    {
      title: '最大回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      width: 90,
      sorter: true,
      render: (value: number | null | undefined) => (
        <span style={{ color: '#ff4d4f' }}>
          {value !== null && value !== undefined ? `${(value * 100).toFixed(2)}%` : '-'}
        </span>
      ),
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 90,
      render: (value: number | null | undefined) => (
        <span>
          {value !== null && value !== undefined ? `¥${value.toFixed(2)}` : '-'}
        </span>
      ),
    },
    {
      title: '最近回测',
      dataIndex: 'last_backtest_time',
      key: 'last_backtest_time',
      width: 160,
      render: (value: string | null | undefined) => (
        <span style={{ fontSize: '12px', color: darkTheme.textSecondary }}>
          {value ? value.replace('T', ' ').substring(0, 19) : '-'}
        </span>
      ),
    },
    {
      title: '关注时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: true,
      render: (value: string) => (
        <span style={{ fontSize: '12px', color: darkTheme.textSecondary }}>
          {value ? value.replace('T', ' ').substring(0, 19) : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: WatchlistItem) => (
        <Space size={4}>
          {record.type_changed && (
            <Tooltip title="标记已读">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => handleMarkAsRead(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="取消关注">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(record.id)}
              size="small"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: darkTheme.background, minHeight: '100vh' }}>
      <style>{globalDarkStyles}</style>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: darkTheme.textPrimary }}>关注列表</span>
            {typeChangedCount > 0 && (
              <Tag color="red">{typeChangedCount} 只股票关注类型发生变化</Tag>
            )}
          </div>
        }
        extra={
          <Space>
            <Select
              value={watchTypeFilter}
              onChange={setWatchTypeFilter}
              style={{ width: 120 }}
              allowClear
              placeholder="筛选类型"
            >
              <Option value="关注中">关注中</Option>
              <Option value="趋势上涨">趋势上涨</Option>
              <Option value="趋势下行">趋势下行</Option>
              <Option value="趋势结束">趋势结束</Option>
            </Select>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleBacktest}
              loading={backtestLoading}
            >
              一键回测
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchWatchlist}
              loading={loading}
            >
              刷新
            </Button>
            <span style={{ fontSize: 12, color: darkTheme.textSecondary }}>
              定时回测
            </span>
            <Switch
              size="small"
              checked={autoBacktestEnabled}
              onChange={handleAutoBacktestChange}
            />
            <TimePicker
              size="small"
              format="HH:mm"
              value={dayjs(`2000-01-01 ${autoBacktestTime}`)}
              onChange={handleTimeChange}
              disabled={!autoBacktestEnabled}
              style={{ width: 90 }}
            />
          </Space>
        }
        style={{ background: darkTheme.cardBackground, borderColor: darkTheme.border }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Spin size="large" />
          </div>
        ) : data.length === 0 ? (
          <Empty
            description="暂无关注的股票"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => window.location.href = '/backtest'}>
              去回测结果中添加
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: 1400 }}
            size="small"
            rowClassName={(record) => record.type_changed ? 'row-type-changed' : ''}
            onChange={(pagination, filters, sorter: any) => {
              if (sorter.field) {
                const fieldMap: Record<string, string> = {
                  pnl_ratio: 'pnl_ratio',
                  sharp_ratio: 'sharp_ratio',
                  win_ratio: 'win_ratio',
                  max_drawdown: 'max_drawdown',
                };
                const newSortBy = fieldMap[sorter.field] || 'created_at';
                const newSortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }
            }}
          />
        )}
      </Card>

      {/* K线图弹窗 */}
      <Modal
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>{chartSymbol} - {chartName} K线图</span>}
        open={chartModalVisible}
        getContainer={false}
        transitionName=""
        maskTransitionName=""
        onCancel={() => {
          setChartModalVisible(false);
          setKlineData([]);
          setTradeRecords([]);
          setChartBacktestStart(undefined);
          setChartBacktestEnd(undefined);
          setChartTaskId(undefined);
        }}
        footer={[
          <Button
            key="log"
            icon={<FileTextOutlined />}
            onClick={() => {
              if (chartTaskId) {
                // TODO: 可以添加查看日志功能
                message.info('日志功能开发中');
              } else {
                message.warning('暂无该股票的回测任务');
              }
            }}
          >
            查看日志
          </Button>,
          <Button
            key="sync"
            type="primary"
            loading={klineLoading}
            onClick={async () => {
              if (!chartSymbol) return;
              try {
                setKlineLoading(true);
                await apiService.syncKlineData(chartSymbol, 365, chartBacktestStart, chartBacktestEnd);
                message.success('K线数据同步成功');
                // 重新获取数据
                const response = await apiService.getKlineData(chartSymbol, chartBacktestStart, chartBacktestEnd);
                setKlineData(response.data || []);
              } catch (error) {
                message.error('K线数据同步失败');
              } finally {
                setKlineLoading(false);
              }
            }}
          >
            同步最新数据
          </Button>,
          <Button key="close" onClick={() => {
            setChartModalVisible(false);
            setKlineData([]);
            setTradeRecords([]);
            setChartBacktestStart(undefined);
            setChartBacktestEnd(undefined);
            setChartTaskId(undefined);
          }}>
            关闭
          </Button>
        ]}
        width={1000}
        styles={{ body: { padding: '16px' } }}
      >
        {klineLoading && !klineData.length ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            加载中...
          </div>
        ) : (
          <StockChart
            data={klineData}
            symbol={chartSymbol}
            name={chartName}
            tradeRecords={tradeRecords}
          />
        )}
      </Modal>

      <style>{`
        .row-type-changed {
          background: rgba(250, 173, 20, 0.1) !important;
        }
        .row-type-changed:hover {
          background: rgba(250, 173, 20, 0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default Watchlist;
