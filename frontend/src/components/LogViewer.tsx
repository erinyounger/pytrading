import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Space, Tag, Switch, Input, Select, Empty, Spin } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  ClearOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  VerticalAlignBottomOutlined
} from '@ant-design/icons';
import { BacktestLog } from '../types';
import { apiService } from '../services/api';
import './LogViewer.css';

const { Search } = Input;
const { Option } = Select;

interface LogViewerProps {
  taskId: string;
  symbol?: string;
  title?: string;
  height?: number;
}

const LogViewer: React.FC<LogViewerProps> = ({ taskId, symbol, title, height = 500 }) => {
  const [logs, setLogs] = useState<BacktestLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastId, setLastId] = useState(0);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取日志
  const fetchLogs = async (isIncremental: boolean = false) => {
    try {
      setLoading(true);
      const afterId = isIncremental ? lastId : 0;
      
      const response = symbol 
        ? await apiService.getResultLogs(taskId, symbol, afterId, 500)
        : await apiService.getTaskLogs(taskId, afterId, 500);

      if (isIncremental) {
        setLogs(prev => [...prev, ...response.items]);
      } else {
        setLogs(response.items);
      }
      
      if (response.last_id > lastId) {
        setLastId(response.last_id);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchLogs(false);
  }, [taskId, symbol]);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchLogs(true);
      }, 2000);
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    }
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [autoRefresh, lastId, taskId, symbol]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 日志级别样式
  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'red';
      case 'WARNING':
        return 'orange';
      case 'INFO':
        return 'blue';
      case 'DEBUG':
        return 'default';
      default:
        return 'default';
    }
  };

  // 日志级别图标
  const getLevelIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return '❌';
      case 'WARNING':
        return '⚠️';
      case 'INFO':
        return 'ℹ️';
      case 'DEBUG':
        return '🔍';
      default:
        return '📝';
    }
  };

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'ALL' || log.level.toUpperCase() === filterLevel;
    const textMatch = !searchText || log.message.toLowerCase().includes(searchText.toLowerCase());
    return levelMatch && textMatch;
  });

  // 清空日志
  const handleClear = () => {
    setLogs([]);
    setLastId(0);
  };

  // 下载日志
  const handleDownload = () => {
    const content = filteredLogs.map(log => 
      `[${log.created_at}] [${log.level}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${taskId}${symbol ? `_${symbol}` : ''}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  return (
    <Card
      title={
        <Space>
          <Tag color="blue">{filteredLogs.length}</Tag>
        </Space>
      }
      extra={
      <Space size="small">
        <Select
          value={filterLevel}
          onChange={setFilterLevel}
          style={{ width: 84 }}
          size="small"
        >
          <Option value="ALL">全部</Option>
          <Option value="ERROR">ERROR</Option>
          <Option value="WARNING">WARN</Option>
          <Option value="INFO">INFO</Option>
          <Option value="DEBUG">DEBUG</Option>
        </Select>
        
        <Search
          placeholder="搜索"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 120 }}
          size="small"
          allowClear
        />

        <Button
          size="small"
          icon={autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => setAutoRefresh(!autoRefresh)}
          type={autoRefresh ? 'primary' : 'default'}
        />
        
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => fetchLogs(false)}
          loading={loading}
        />

        <Button
          size="small"
          icon={<VerticalAlignBottomOutlined />}
          onClick={scrollToBottom}
        />

        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        />
      </Space>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div
        ref={logContainerRef}
        className="log-viewer-container"
        style={{ height: `${height}px`, overflow: 'auto' }}
      >
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin tip="加载日志中..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Empty description="暂无日志" style={{ marginTop: '50px' }} />
        ) : (
          <div className="log-content">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className={`log-line log-level-${log.level.toLowerCase()}`}
              >
                <span className="log-time">{log.created_at}</span>
                <Tag color={getLevelColor(log.level)} className="log-level-tag">
                  {getLevelIcon(log.level)} {log.level}
                </Tag>
                {log.symbol && (
                  <Tag color="cyan" className="log-symbol-tag">
                    {log.symbol}
                  </Tag>
                )}
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default LogViewer;
