import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FooterProps {
  className?: string;
}

/**
 * Footer 组件
 * 显示系统状态、性能监控和数据更新时间
 */
export const Footer: React.FC<FooterProps> = memo(({ className }) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'connected';

  // 使用useCallback避免重复创建函数
  const updateTime = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    // 每秒更新时间
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  // 使用useMemo缓存格式化时间
  const formattedTime = useMemo(() => {
    return lastUpdate.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastUpdate]);

  const connectionConfig = {
    connected: {
      icon: <Wifi className="w-4 h-4 text-green-400" />,
      text: '已连接',
      color: 'text-green-400',
    },
    disconnected: {
      icon: <WifiOff className="w-4 h-4 text-red-400" />,
      text: '未连接',
      color: 'text-red-400',
    },
    connecting: {
      icon: <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />,
      text: '连接中',
      color: 'text-yellow-400',
    },
  };

  return (
    <footer
      className={cn(
        'footer bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] h-12 flex items-center justify-between px-6 text-sm',
        className
      )}
    >
      {/* Left Section - Status */}
      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {connectionConfig[connectionStatus].icon}
          <span className={cn('font-medium', connectionConfig[connectionStatus].color)}>
            {connectionConfig[connectionStatus].text}
          </span>
        </div>

        {/* Data Update Time */}
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Clock className="w-4 h-4" />
          <span>数据更新: {formattedTime}</span>
        </div>
      </div>

      {/* Center Section - Quick Stats */}
      <div className="flex items-center gap-6 text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>活跃策略: 5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span>今日信号: 23</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span>回测队列: 2</span>
        </div>
      </div>

      {/* Right Section - System Info */}
      <div className="flex items-center gap-4 text-[var(--text-secondary)]">
        {/* Performance Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span>CPU:</span>
            <span className="text-green-400">23%</span>
          </div>
          <div className="flex items-center gap-1">
            <span>内存:</span>
            <span className="text-blue-400">45%</span>
          </div>
          <div className="flex items-center gap-1">
            <span>延迟:</span>
            <span className="text-yellow-400">12ms</span>
          </div>
        </div>

        {/* Version */}
        <div className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-[var(--text-disabled)]">
          v1.0.0
        </div>
      </div>
    </footer>
  );
});

export default Footer;
