import React, { useState, useEffect } from 'react';
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
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
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
  });

  useEffect(() => {
    fetchBacktestResults();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

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

  const applyFilters = () => {
    let filtered = [...data];

    if (filters.symbol) {
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(filters.symbol.toLowerCase()) ||
        item.name.toLowerCase().includes(filters.symbol.toLowerCase())
      );
    }

    if (filters.strategy) {
      filtered = filtered.filter(item => item.trending_type === filters.strategy);
    }

    if (filters.dateRange && filters.dateRange.length === 2) {
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.backtest_start_time);
        return itemDate.isAfter(filters.dateRange[0]) && itemDate.isBefore(filters.dateRange[1]);
      });
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const showDetail = (record: BacktestResult) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  const exportData = () => {
    // 简单的CSV导出
    const headers = ['股票代码', '股票名称', '策略类型', '收益率', '夏普比率', '最大回撤', '胜率', '开始时间', '结束时间'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.symbol,
        item.name,
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
      title: '策略类型',
      dataIndex: 'trending_type',
      key: 'trending_type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          'MACD_STRATEGY': { text: 'MACD', color: 'blue' },
          'BOLL_STRATEGY': { text: '布林带', color: 'green' },
          'TURTLE_STRATEGY': { text: '海龟', color: 'orange' }
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
        <span className={value >= 0 ? 'profit-positive' : 'profit-negative'}>
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
        <span className="profit-negative">
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
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
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
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索股票代码或名称"
              allowClear
              onSearch={(value) => handleFilterChange('symbol', value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择策略类型"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('strategy', value)}
            >
              <Option value="MACD_STRATEGY">MACD策略</Option>
              <Option value="BOLL_STRATEGY">布林带策略</Option>
              <Option value="TURTLE_STRATEGY">海龟策略</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchBacktestResults}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={exportData}
                disabled={filteredData.length === 0}
              >
                导出
              </Button>
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
                    <Statistic title="策略类型" value={selectedResult.trending_type} />
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
                        color: selectedResult.pnl_ratio >= 0 ? '#52c41a' : '#ff4d4f' 
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
                      valueStyle={{ color: '#ff4d4f' }}
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
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="胜率" 
                      value={selectedResult.win_ratio * 100} 
                      precision={1}
                      suffix="%" 
                      valueStyle={{ color: '#52c41a' }}
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