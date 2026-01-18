import React from 'react';
import { Bell, Search, Settings, User, Moon, Sun, Menu } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HeaderProps {
  onToggleSidebar?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, className }) => {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const mockNotifications = [
    {
      id: '1',
      title: '交易信号',
      message: 'MACD策略触发买入信号',
      time: '2分钟前',
      unread: true,
    },
    {
      id: '2',
      title: '风险预警',
      message: '持仓集中度超过阈值',
      time: '10分钟前',
      unread: true,
    },
    {
      id: '3',
      title: '回测完成',
      message: '布林带策略回测已完成',
      time: '1小时前',
      unread: false,
    },
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header
      className={cn(
        'header bg-[var(--bg-primary)] border-b border-[var(--border-primary)] h-16 flex items-center justify-between px-6',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] md:hidden"
        >
          <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-disabled)]" />
          <input
            type="text"
            placeholder="搜索股票代码、策略..."
            className="input pl-10 pr-4 py-2 w-80"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          title="切换主题"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <Moon className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors relative"
            title="通知"
          >
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--error)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-[var(--border-primary)]">
                <h3 className="font-semibold text-[var(--text-primary)]">通知</h3>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)] cursor-pointer',
                      notification.unread && 'bg-[var(--brand-primary)]/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] text-sm">
                          {notification.title}
                        </p>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-[var(--text-disabled)] text-xs mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[var(--border-primary)]">
                <button className="text-[var(--brand-primary)] text-sm hover:underline">
                  查看全部通知
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors" title="设置">
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">xTrader</p>
              <p className="text-xs text-[var(--text-secondary)]">专业版用户</p>
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">xTrader</p>
                    <p className="text-sm text-[var(--text-secondary)]">xtrader@example.com</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]">
                  <User className="w-4 h-4" />
                  个人资料
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]">
                  <Settings className="w-4 h-4" />
                  账户设置
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]">
                  <Bell className="w-4 h-4" />
                  通知设置
                </button>
                <hr className="my-2 border-[var(--border-primary)]" />
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--error)]">
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
