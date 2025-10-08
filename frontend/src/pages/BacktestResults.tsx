import React, { useState, useEffect, useRef } from 'react';
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
  InputNumber,
  Pagination
} from 'antd';
import type { ColumnsType, SortOrder } from 'antd/es/table/interface';
import { 
  ReloadOutlined, 
  EyeOutlined,
  DownloadOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiService } from '../services/api';
import { BacktestResult, PaginatedApiResponse } from '../types';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const BacktestResults: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BacktestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    symbol: '',
    trending_type: '', // 改为trending_type以匹配后端API
    dateRange: null as any,
    pnlRange: null as any, // 收益率范围
    winRatioRange: null as any, // 胜率范围
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [sortConfig, setSortConfig] = useState<{
    field: string | null;
    order: 'asc' | 'desc' | null;
  }>({
    field: null,
    order: null
  });

  const fetchBacktestResults = async (
    page: number = 1, 
    pageSize: number = 10,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        per_page: pageSize,
        symbol: filters.symbol || undefined,
        trending_type: filters.trending_type || undefined,
        start_date: filters.dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: filters.dateRange?.[1]?.format('YYYY-MM-DD'),
        min_pnl_ratio: filters.pnlRange?.[0],
        max_pnl_ratio: filters.pnlRange?.[1],
        min_win_ratio: filters.winRatioRange?.[0],
        max_win_ratio: filters.winRatioRange?.[1],
        sort_by: sortBy || undefined,
        sort_order: sortOrder || undefined,
      };
      
      // 移除值为undefined的参数
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === undefined) {
          delete params[key as keyof typeof params];
        }
      });
      
      const response: PaginatedApiResponse<BacktestResult[]> = await apiService.getBacktestResults(params);
      
      setData(response.data);
      setPagination({
        current: response.page,
        pageSize: response.per_page,
        total: response.total,
        totalPages: response.total_pages
      });
    } catch (error) {
      message.error('获取回测结果失败');
      console.error('获取回测结果失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacktestResults();
  }, []);

  // 监听筛选条件变化，自动重新获取数据
  // 当筛选变化时，重置到第一页并请求数据
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev !== filters) {
      prevFiltersRef.current = filters;
      fetchBacktestResults(
        1, 
        pagination.pageSize, 
        sortConfig.field || undefined, 
        sortConfig.order || undefined
      );
    }
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      symbol: '',
      trending_type: '',
      dateRange: null,
      pnlRange: null,
      winRatioRange: null,
    });
    // 清除筛选后由 filters effect 触发刷新
  };

  const handleSort = (field: string) => {
    let newOrder: 'asc' | 'desc' = 'desc';
    
    // 如果点击的是当前排序字段，则切换排序方向
    if (sortConfig.field === field) {
      newOrder = sortConfig.order === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ field, order: newOrder });
    fetchBacktestResults(1, pagination.pageSize, field, newOrder);
  };



  // 获取所有可用的趋势类型（从后端获取）
  const [availableStrategies, setAvailableStrategies] = useState<string[]>([]);

  // 获取所有趋势类型
  const fetchAvailableStrategies = async () => {
    try {
      const response = await apiService.getBacktestResults({ per_page: 1000 }); // 获取所有数据
      const allData = response.data;
      const strategies = new Set(allData.map(item => item.trending_type).filter(Boolean));
      setAvailableStrategies(Array.from(strategies).sort());
    } catch (error) {
      console.error('获取趋势类型失败:', error);
    }
  };

  useEffect(() => {
    fetchAvailableStrategies();
  }, []);

  // 快速筛选预设
  const quickFilters = [
    { label: '盈利策略', onClick: () => {
        setFilters(prev => ({ ...prev, pnlRange: [0, 1000] }));
      } 
    },
    { label: '亏损策略', onClick: () => {
        setFilters(prev => ({ ...prev, pnlRange: [-100, 0] }));
      } 
    },
    { label: '高胜率(>60%)', onClick: () => {
        setFilters(prev => ({ ...prev, winRatioRange: [60, 100] }));
      } 
    },
    { label: '低胜率(<40%)', onClick: () => {
        setFilters(prev => ({ ...prev, winRatioRange: [0, 40] }));
      } 
    },
  ];

  const showDetail = (record: BacktestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const exportData = () => {
    // 注意：当前导出功能仅导出当前页数据，完整导出需要后端支持
    const headers = ['股票代码', '股票名称', '策略名称', '趋势类型', '收益率', '夏普比率', '最大回撤', '胜率', '开始时间', '结束时间'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
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

  const columns: ColumnsType<BacktestResult> = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left' as const,
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '当前股价',
      dataIndex: 'current_price',
      key: 'current_price',
      align: 'right' as const,
      render: (value?: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value != null ? value.toFixed(2) : '-'}
        </span>
      ),
    },
    {
      title: '策略名称',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      render: (value: string) => {
        // 如果策略名称为null、undefined或空字符串，则不显示
        if (!value || value === 'null' || value === 'undefined') {
          return '-';
        }
        return value;
      }
    },
    {
      title: '当前趋势',
      dataIndex: 'trending_type',
      key: 'trending_type',
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
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('pnl_ratio')}
        >
          收益率 {sortConfig.field === 'pnl_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ 
          color: value >= 0 ? '#ff4d4f' : '#52c41a',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {(value * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('win_ratio')}
        >
          胜率 {sortConfig.field === 'win_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ 
          color: value >= 0.5 ? '#ff4d4f' : '#52c41a',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {(value * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('sharp_ratio')}
        >
          夏普比率 {sortConfig.field === 'sharp_ratio' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value.toFixed(2)}
        </span>
      ),
    },
    {
      title: (
        <span 
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => handleSort('max_drawdown')}
        >
          最大回撤 {sortConfig.field === 'max_drawdown' ? (sortConfig.order === 'asc' ? '↑' : '↓') : ''}
        </span>
      ),
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ 
          color: '#ff4d4f',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums'
        }}>
          {(value * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'backtest_start_time',
      key: 'backtest_start_time',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '结束时间',
      dataIndex: 'backtest_end_time',
      key: 'backtest_end_time',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '开仓次数',
      dataIndex: 'open_count',
      key: 'open_count',
      align: 'center' as const,
    },
    {
      title: '平仓次数',
      dataIndex: 'close_count',
      key: 'close_count',
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      align: 'center' as const,
      width: 80,
      render: (_: any, record: BacktestResult) => (
        <Tooltip title="查看详情">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => showDetail(record)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>回测结果</span>
            <Space size="small">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => fetchBacktestResults(pagination.current, pagination.pageSize)}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
              <Button 
                onClick={clearAllFilters}
                disabled={!filters.symbol && !filters.trending_type && !filters.dateRange && !filters.pnlRange && !filters.winRatioRange}
                size="small"
              >
                清除筛选
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={exportData}
                disabled={data.length === 0}
                size="small"
              >
                导出
              </Button>
            </Space>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '12px 16px' }}
        headStyle={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}
      >
        {/* 筛选栏 - 紧凑布局 */}
        <div style={{ 
          background: '#fafafa', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '12px' 
        }}>
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md={6} lg={5}>
              <Search
                placeholder="搜索股票代码或名称"
                allowClear
                onSearch={(value) => {
                  handleFilterChange('symbol', value);
                }}
                style={{ width: '100%' }}
                size="small"
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="选择趋势类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.trending_type}
                onChange={(value) => {
                  handleFilterChange('trending_type', value);
                }}
                size="small"
              >
                {availableStrategies.map(strategy => (
                  <Option key={strategy} value={strategy}>
                    {strategy}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => {
                  handleFilterChange('dateRange', dates);
                }}
                size="small"
              />
            </Col>
            <Col xs={12} sm={8} md={4} lg={4}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小收益%"
                  style={{ width: '100%' }}
                  value={filters.pnlRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.pnlRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={-100}
                  max={1000}
                  precision={2}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大收益%"
                  style={{ width: '100%' }}
                  value={filters.pnlRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.pnlRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('pnlRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={-100}
                  max={1000}
                  precision={2}
                  size="small"
                />
              </div>
            </Col>
            <Col xs={12} sm={8} md={4} lg={5}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <InputNumber
                  placeholder="最小胜率%"
                  style={{ width: '100%' }}
                  value={filters.winRatioRange?.[0]}
                  onChange={(value) => {
                    const newRange = [value, filters.winRatioRange?.[1]].filter(v => v !== undefined);
                    handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  max={100}
                  precision={1}
                  size="small"
                />
                <span style={{ color: '#999' }}>~</span>
                <InputNumber
                  placeholder="最大胜率%"
                  style={{ width: '100%' }}
                  value={filters.winRatioRange?.[1]}
                  onChange={(value) => {
                    const newRange = [filters.winRatioRange?.[0], value].filter(v => v !== undefined);
                    handleFilterChange('winRatioRange', newRange.length > 0 ? newRange : null);
                  }}
                  min={0}
                  max={100}
                  precision={1}
                  size="small"
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* 快速筛选和统计信息 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <Space size="small" wrap>
            <span style={{ color: '#8c8c8c', fontSize: '13px' }}>快速筛选:</span>
            {quickFilters.map((filter, index) => (
              <Button 
                key={index}
                size="small"
                type="text"
                onClick={filter.onClick}
                style={{ height: '24px', padding: '0 8px' }}
              >
                {filter.label}
              </Button>
            ))}
          </Space>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: '#8c8c8c' }}>
              共 <span style={{ color: '#1890ff', fontWeight: 500 }}>{pagination.total}</span> 条
            </span>
            {data.length > 0 && (
              <>
                <span style={{ color: '#8c8c8c' }}>
                  平均收益: <span style={{ 
                    color: (data.reduce((sum, item) => sum + item.pnl_ratio, 0) / data.length) >= 0 ? '#ff4d4f' : '#52c41a',
                    fontWeight: 500
                  }}>
                    {(data.reduce((sum, item) => sum + item.pnl_ratio, 0) / data.length * 100).toFixed(2)}%
                  </span>
                </span>
                <span style={{ color: '#8c8c8c' }}>
                  平均胜率: <span style={{ 
                    color: (data.reduce((sum, item) => sum + item.win_ratio, 0) / data.length) >= 0.5 ? '#ff4d4f' : '#52c41a',
                    fontWeight: 500
                  }}>
                    {(data.reduce((sum, item) => sum + item.win_ratio, 0) / data.length * 100).toFixed(1)}%
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => `${record.symbol}_${record.backtest_start_time}`}
          loading={loading}
          pagination={false}
          tableLayout="auto"
          size="small"
          scroll={{ x: 'max-content' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={(page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: pageSize }));
              fetchBacktestResults(
                page, 
                pageSize, 
                sortConfig.field || undefined, 
                sortConfig.order || undefined
              );
            }}
            onShowSizeChange={(current, size) => {
              setPagination(prev => ({ ...prev, current: 1, pageSize: size }));
              fetchBacktestResults(
                1, 
                size, 
                sortConfig.field || undefined, 
                sortConfig.order || undefined
              );
            }}
            showSizeChanger
            pageSizeOptions={["10","20","50","100"]}
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
            size="small"
          />
        </div>
      </Card>

      <Modal
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>回测详情</span>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ padding: '16px' }}
      >
        {selectedResult && (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card title="基本信息" size="small" bordered={false} headStyle={{ padding: '8px 12px' }} bodyStyle={{ padding: '12px' }}>
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
              <Card title="收益指标" size="small" bordered={false} headStyle={{ padding: '8px 12px' }} bodyStyle={{ padding: '12px' }}>
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
              <Card title="交易统计" size="small" bordered={false} headStyle={{ padding: '8px 12px' }} bodyStyle={{ padding: '12px' }}>
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
              <Card title="回测周期" size="small" bordered={false} headStyle={{ padding: '8px 12px' }} bodyStyle={{ padding: '12px' }}>
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