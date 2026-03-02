import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Space, Input, Select, Empty, Spin } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  VerticalAlignBottomOutlined
} from '@ant-design/icons';
import { BacktestLog } from '../types';
import { apiService } from '../services/api';
import { darkTheme, globalDarkStyles } from '../styles/darkTheme';

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
  const [autoScroll] = useState(true);
  const [lastId, setLastId] = useState(0);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchText, setSearchText] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取日志
  const fetchLogs = useCallback(async (isIncremental: boolean = false) => {
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
  }, [lastId, symbol, taskId]);

  // 初始加载
  useEffect(() => {
    fetchLogs(false);
  }, [taskId, symbol, fetchLogs]);

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
  }, [autoRefresh, fetchLogs]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

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
    <>
      <style>{globalDarkStyles}</style>
      <Card
        title={
          <Space>
            <span style={{
              background: 'rgba(77, 124, 255, 0.2)',
              color: '#8cb4ff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
            }}>{filteredLogs.length}</span>
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
        styles={{ body: { padding: 0 }, header: { background: darkTheme.cardBackground, borderBottom: `1px solid ${darkTheme.border}` } }}
        style={{ background: darkTheme.cardBackground }}
      >
        <div
          ref={logContainerRef}
          style={{
            height: `${height}px`,
            overflow: 'auto',
            background: darkTheme.background,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: 12,
            lineHeight: 1.3,
            color: darkTheme.textPrimary,
          }}
        >
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin tip="加载日志中..." />
            </div>
          ) : filteredLogs.length === 0 ? (
            <Empty description="暂无日志" style={{ marginTop: '50px' }} />
          ) : (
            <div>
              {filteredLogs.map((log, index) => (
                <div
                  key={`${log.id}-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '1px 4px',
                    marginBottom: 0,
                    borderRadius: 2,
                    transition: 'background-color 0.2s',
                    wordBreak: 'break-word',
                    borderLeft: `3px solid ${
                      log.level === 'ERROR' ? darkTheme.positive :
                      log.level === 'WARNING' ? '#faad14' :
                      log.level === 'INFO' ? darkTheme.accent :
                      darkTheme.negative
                    }`,
                    backgroundColor: log.level === 'ERROR' ? 'rgba(255, 77, 79, 0.05)' :
                                     log.level === 'WARNING' ? 'rgba(250, 140, 22, 0.05)' :
                                     log.level === 'INFO' ? 'rgba(24, 144, 255, 0.03)' :
                                     'rgba(82, 196, 26, 0.03)',
                  }}
                >
                  <span style={{ color: darkTheme.textMuted, marginRight: 6, whiteSpace: 'nowrap', fontSize: 11, minWidth: 100 }}>{log.created_at}</span>
                  <span
                    style={{
                      marginRight: 6,
                      fontWeight: 600,
                      minWidth: 56,
                      textAlign: 'center',
                      height: 18,
                      lineHeight: '18px',
                      padding: '0 4px',
                      borderRadius: 2,
                      fontSize: 11,
                      background: log.level === 'ERROR' ? 'rgba(255, 77, 79, 0.2)' :
                                  log.level === 'WARNING' ? 'rgba(250, 169, 22, 0.2)' :
                                  log.level === 'INFO' ? 'rgba(77, 124, 255, 0.2)' :
                                  'rgba(82, 196, 26, 0.2)',
                      color: log.level === 'ERROR' ? '#ff7875' :
                             log.level === 'WARNING' ? '#ffd666' :
                             log.level === 'INFO' ? '#8cb4ff' :
                             '#95de64',
                    }}
                  >
                    {getLevelIcon(log.level)} {log.level}
                  </span>
                  {log.symbol && (
                    <span style={{
                      marginRight: 6,
                      fontWeight: 500,
                      height: 18,
                      lineHeight: '18px',
                      padding: '0 4px',
                      borderRadius: 2,
                      fontSize: 11,
                      background: 'rgba(19, 194, 194, 0.2)',
                      color: '#36cfc9',
                    }}>
                      {log.symbol}
                    </span>
                  )}
                  <span style={{
                    flex: 1,
                    color: log.level === 'ERROR' ? '#ff7875' :
                           log.level === 'WARNING' ? '#ffa940' :
                           log.level === 'DEBUG' ? '#95de64' :
                           darkTheme.textPrimary,
                    whiteSpace: 'pre-wrap',
                  }}>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

export default LogViewer;
