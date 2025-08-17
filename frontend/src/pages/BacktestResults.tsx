import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Input, 
  DatePicker, 
  Select, 
  Tag, 
  Modal, 
  Row, 
  Col, 
  Statistic,
  message,
  Tooltip,
  InputNumber
} from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { BacktestResult } from '../types';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BacktestResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacktestResult[]>([]);
  const [filteredData, setFilteredData] = useState<BacktestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    symbol: '',
    strategy: '',
    dateRange: null as any,
    pnlRange: null as any, // 收益率范围
    winRatioRange: null as any, // 胜率范围
  });

  const applyFilters = useCallback(() => {
    let filtered = [...data];

    // 股票代码/名称筛选
    if (filters.symbol) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(filters.symbol.toLowerCase()) ||
        item.name.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    // 趋势类型筛选
    if (filters.strategy) {
      filtered = filtered.filter(item => item.trending_type === filters.strategy);
    }

    // 日期范围筛选
    if (filters.dateRange && filters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.backtest_start_time);
        const startDate = filters.dateRange[0].startOf('day');
        const endDate = filters.dateRange[1].endOf('day');
        return itemDate.isAfter(startDate) && itemDate.isBefore(endDate);
      });
    }

    // 收益率范围筛选
    if (filters.pnlRange && filters.pnlRange.length === 2) {
      filtered = filtered.filter(item => {
        const pnlPercent = item.pnl_ratio * 100;
        return pnlPercent >= filters.pnlRange[0] && pnlPercent <= filters.pnlRange[1];
      });
    }

    // 胜率范围筛选
    if (filters.winRatioRange && filters.winRatioRange.length === 2) {
      filtered = filtered.filter(item => {
        const winRatioPercent = item.win_ratio * 100;
        return winRatioPercent >= filters.winRatioRange[0] && winRatioPercent <= filters.winRatioRange[1];
      });
    }

    setFilteredData(filtered);
  }, [data, filters]);

  useEffect(() => {
    fetchBacktestResults();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchBacktestResults = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBacktestResults({ limit: 200 });
      setData(response.data);
    } catch (error) {
      message.error('获取回测结果失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      symbol: '',
      strategy: '',
      dateRange: null,
      pnlRange: null,
      winRatioRange: null,
    });
  };

  // 获取可用的趋势类型
  const getAvailableStrategies = () => {
    const strategies = new Set(data.map(item => item.trending_type).filter(Boolean));
    return Array.from(strategies).sort();
  };

  // 快速筛选预设
  const quickFilters = [
    { label: '盈利策略', onClick: () => setFilters(prev => ({ ...prev, pnlRange: [0, 1000] })) },
    { label: '亏损策略', onClick: () => setFilters(prev => ({ ...prev, pnlRange: [-100, 0] })) },
    { label: '高胜率(>60%)', onClick: () => setFilters(prev => ({ ...prev, winRatioRange: [60, 100] })) },
    { label: '低胜率(<40%)', onClick: () => setFilters(prev => ({ ...prev, winRatioRange: [0, 40] })) },
  ];

  const showDetail = (record: BacktestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const exportData = () => {
    // 简单的CSV导出
    const headers = ['股票代码', '股票名称', '策略名称', '趋势类型', '收益率', '夏普比率', '最大回撤', '胜率', '开始时间', '结束时间'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.symbol,
        item.name,
        item.strategy_name || '',  // 如果策略名称为null，导出时显示为空
        item.trending_type,
        (item.pnl_ratio * 100).toFixed(2) + '%',
        item.sharp_ratio.toFixed(2),
        (item.max_drawdown * 100).toFixed(2) + '%',
        (item.win_ratio * 100).toFixed(2) + '%',
        item.backtest_start_time,
        item.backtest_end_time
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_results_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '策略名称',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      width: 120,
      render: (value: string) => {
        // 如果策略名称为null、undefined或空字符串，则不显示
        if (!value || value === 'null' || value === 'undefined') {
          return '-';
        }
        return value;
      }
    },
    {
      title: '趋势类型',
      dataIndex: 'trending_type',
      key: 'trending_type',
      width: 120,
      render: (type: string) => {
        // 这里trending_type实际上是趋势阶段，不是策略类型
        const typeMap: Record<string, { text: string; color: string }> = {
          'Unknown': { text: '未识别', color: 'default' },
          'Observing': { text: '关注', color: 'blue' },
          'RisingUp': { text: '上涨', color: 'red' },
          'ZeroAxisUp': { text: '零轴上穿', color: 'purple' },
          'DeadXDown': { text: '死叉下跌', color: 'orange' },
          'FallingDown': { text: '下跌', color: 'volcano' },
          'UpDown': { text: '震荡', color: 'cyan' }
        };
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '收益率',
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      width: 100,
      render: (value: number) => (
        <span style={{ 
          color: value >= 0 ? '#ff4d4f' : '#52c41a',
          fontWeight: 'bold'
        }}>
          {(value * 100).toFixed(2)}%
        </span>
      ),
      sorter: (a: BacktestResult, b: BacktestResult) => a.pnl_ratio - b.pnl_ratio,
    },
    {
      title: '夏普比率',
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      width: 100,
      render: (value: number) => value.toFixed(2),
      sorter: (a: BacktestResult, b: BacktestResult) => a.sharp_ratio - b.sharp_ratio,
    },
    {
      title: '最大回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      width: 100,
      render: (value: number) => (
        <span style={{ 
          color: '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {(value * 100).toFixed(2)}%
        </span>
      ),
      sorter: (a: BacktestResult, b: BacktestResult) => a.max_drawdown - b.max_drawdown,
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      width: 80,
      render: (value: number) => (
        <span style={{ 
          color: value >= 0.5 ? '#ff4d4f' : '#52c41a',
          fontWeight: 'bold'
        }}>
          {(value * 100).toFixed(1)}%
        </span>
      ),
      sorter: (a: BacktestResult, b: BacktestResult) => a.win_ratio - b.win_ratio,
    },
    {
      title: '开仓次数',
      dataIndex: 'open_count',
      key: 'open_count',
      width: 80,
    },
    {
      title: '平仓次数',
      dataIndex: 'close_count',
      key: 'close_count',
      width: 80,
    },
    {
      title: '回测时间',
      key: 'backtest_period',
      width: 180,
      render: (_: any, record: BacktestResult) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(record.backtest_start_time).format('YYYY-MM-DD')}</div>
          <div>至 {dayjs(record.backtest_end_time).format('YYYY-MM-DD')}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: BacktestResult) => (
        <Tooltip title="查看详情">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => showDetail(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="回测结果" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={4}>
            <Search
              placeholder="搜索股票代码或名称"
              allowClear
              onSearch={(value) => handleFilterChange('symbol', value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择趋势类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.strategy}
              onChange={(value) => handleFilterChange('strategy', value)}
            >
              {getAvailableStrategies().map(strategy => (
                <Option key={strategy} value={strategy}>
                  {strategy}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <InputNumber
                placeholder="最小收益率%"
                style={{ width: '50%' }}
                value={filters.pnlRange?.[0]}
                onChange={(value) => {
                  const newRange = [value, filters.pnlRange?.[1]].filter(v => v !== undefined);
                  handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                }}
                min={-100}
                max={1000}
                precision={2}
              />
              <span>-</span>
              <InputNumber
                placeholder="最大收益率%"
                style={{ width: '50%' }}
                value={filters.pnlRange?.[1]}
                onChange={(value) => {
                  const newRange = [filters.pnlRange?.[0], value].filter(v => v !== undefined);
                  handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                }}
                min={-100}
                max={1000}
                precision={2}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <InputNumber
                placeholder="最小胜率%"
                style={{ width: '50%' }}
                value={filters.winRatioRange?.[0]}
                onChange={(value) => {
                  const newRange = [value, filters.winRatioRange?.[1]].filter(v => v !== undefined);
                  handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                }}
                min={0}
                max={100}
                precision={1}
              />
              <span>-</span>
              <InputNumber
                placeholder="最大胜率%"
                style={{ width: '50%' }}
                value={filters.winRatioRange?.[1]}
                onChange={(value) => {
                  const newRange = [filters.winRatioRange?.[0], value].filter(v => v !== undefined);
                  handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                }}
                min={0}
                max={100}
                precision={1}
              />
            </div>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Space wrap>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchBacktestResults}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                onClick={clearAllFilters}
                disabled={!filters.symbol && !filters.strategy && !filters.dateRange && !filters.pnlRange && !filters.winRatioRange}
              >
                清除筛选
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={exportData}
                disabled={filteredData.length === 0}
              >
                导出
              </Button>
              <span style={{ color: '#666', fontSize: '14px' }}>
                共 {filteredData.length} 条记录
                {filteredData.length > 0 && (
                  <>
                    | 平均收益率: <span style={{ 
                      color: (filteredData.reduce((sum, item) => sum + item.pnl_ratio, 0) / filteredData.length) >= 0 ? '#ff4d4f' : '#52c41a',
                      fontWeight: 'bold'
                    }}>
                      {(filteredData.reduce((sum, item) => sum + item.pnl_ratio, 0) / filteredData.length * 100).toFixed(2)}%
                    </span>
                    | 平均胜率: <span style={{ 
                      color: (filteredData.reduce((sum, item) => sum + item.win_ratio, 0) / filteredData.length) >= 0.5 ? '#ff4d4f' : '#52c41a',
                      fontWeight: 'bold'
                    }}>
                      {(filteredData.reduce((sum, item) => sum + item.win_ratio, 0) / filteredData.length * 100).toFixed(1)}%
                    </span>
                  </>
                )}
              </span>
            </Space>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <Space wrap>
              <span style={{ color: '#666', fontSize: '14px' }}>快速筛选:</span>
              {quickFilters.map((filter, index) => (
                <Button 
                  key={index}
                  size="small"
                  type="default"
                  onClick={filter.onClick}
                >
                  {filter.label}
                </Button>
              ))}
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => `${record.symbol}_${record.backtest_start_time}`}
          loading={loading}
          pagination={{
            total: filteredData.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      <Modal
        title="回测详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedResult && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="基本信息" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic title="股票代码" value={selectedResult.symbol} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="股票名称" value={selectedResult.name} />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="策略名称" 
                      value={selectedResult.strategy_name || '-'} 
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic title="趋势类型" value={selectedResult.trending_type} />
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="收益指标" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic 
                      title="收益率" 
                      value={selectedResult.pnl_ratio * 100} 
                      precision={2}
                      suffix="%" 
                      valueStyle={{ 
                        color: selectedResult.pnl_ratio >= 0 ? '#ff4d4f' : '#52c41a',
                        fontWeight: 'bold'
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="夏普比率" 
                      value={selectedResult.sharp_ratio} 
                      precision={2}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="最大回撤" 
                      value={selectedResult.max_drawdown * 100} 
                      precision={2}
                      suffix="%" 
                      valueStyle={{ 
                        color: '#ff4d4f',
                        fontWeight: 'bold'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="交易统计" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Statistic title="开仓次数" value={selectedResult.open_count} />
                  </Col>
                  <Col span={6}>
                    <Statistic title="平仓次数" value={selectedResult.close_count} />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="盈利次数" 
                      value={selectedResult.win_count}
                      valueStyle={{ 
                        color: '#ff4d4f',
                        fontWeight: 'bold'
                      }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="胜率" 
                      value={selectedResult.win_ratio * 100} 
                      precision={1}
                      suffix="%" 
                      valueStyle={{ 
                        color: selectedResult.win_ratio >= 0.5 ? '#ff4d4f' : '#52c41a',
                        fontWeight: 'bold'
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="回测周期" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic 
                      title="开始时间" 
                      value={dayjs(selectedResult.backtest_start_time).format('YYYY-MM-DD HH:mm:ss')} 
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="结束时间" 
                      value={dayjs(selectedResult.backtest_end_time).format('YYYY-MM-DD HH:mm:ss')} 
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
};

export default BacktestResults;