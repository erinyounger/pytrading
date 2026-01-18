import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '仪表板',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
      </svg>
    ),
    path: '/',
  },
  {
    id: 'market',
    label: '实时行情',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    path: '/market',
    children: [
      { id: 'market-monitor', label: '行情监控', icon: null, path: '/market/monitor' },
      { id: 'market-ranking', label: '涨跌幅排行', icon: null, path: '/market/ranking' },
      { id: 'market-chart', label: 'K线图表', icon: null, path: '/market/chart' },
    ],
  },
  {
    id: 'backtest',
    label: '回测管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    path: '/backtest',
    children: [
      { id: 'backtest-create', label: '创建回测', icon: null, path: '/backtest/create' },
      { id: 'backtest-history', label: '历史回测', icon: null, path: '/backtest/history' },
      { id: 'backtest-results', label: '回测结果', icon: null, path: '/backtest/results' },
    ],
  },
  {
    id: 'strategy',
    label: '策略管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    path: '/strategy',
    children: [
      { id: 'strategy-list', label: '我的策略', icon: null, path: '/strategy/list' },
      { id: 'strategy-editor', label: '策略编辑', icon: null, path: '/strategy/editor' },
      { id: 'strategy-backtest', label: '策略回测', icon: null, path: '/strategy/backtest' },
    ],
  },
  {
    id: 'signal',
    label: '交易信号',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    path: '/signal',
    children: [
      { id: 'signal-list', label: '信号列表', icon: null, path: '/signal/list' },
      { id: 'signal-details', label: '信号详情', icon: null, path: '/signal/details' },
      { id: 'signal-filter', label: '信号过滤', icon: null, path: '/signal/filter' },
    ],
  },
  {
    id: 'risk',
    label: '风险管理',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    path: '/risk',
    children: [
      { id: 'risk-metrics', label: '风险指标', icon: null, path: '/risk/metrics' },
      { id: 'risk-alerts', label: '预警设置', icon: null, path: '/risk/alerts' },
      { id: 'risk-stop', label: '止损止盈', icon: null, path: '/risk/stop' },
    ],
  },
  {
    id: 'report',
    label: '性能报告',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    path: '/report',
    children: [
      { id: 'report-performance', label: '绩效分析', icon: null, path: '/report/performance' },
      { id: 'report-trades', label: '交易明细', icon: null, path: '/report/trades' },
      { id: 'report-returns', label: '收益曲线', icon: null, path: '/report/returns' },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, className }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(['market']));

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="nav-section">
        {level === 0 ? (
          <div className="nav-category">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'nav-item group relative flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200',
                  'hover:bg-[var(--bg-hover)] hover:translate-x-1',
                  isActive
                    ? 'bg-gradient-primary text-white glow'
                    : 'text-[var(--text-secondary)]',
                  level > 0 && 'ml-4'
                )
              }
              onClick={(e) => {
                if (hasChildren) {
                  e.preventDefault();
                  toggleExpanded(item.id);
                }
              }}
            >
              <span className="nav-icon flex-shrink-0">
                {item.icon}
              </span>
              <span className="nav-label font-medium">
                {item.label}
              </span>
              {hasChildren && (
                <svg
                  className={cn(
                    'w-4 h-4 ml-auto transition-transform duration-200',
                    isExpanded ? 'rotate-90' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {level === 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand-secondary)] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </NavLink>
          </div>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              cn(
                'nav-child block px-8 py-2 text-sm transition-colors',
                isActive
                  ? 'text-[var(--brand-primary)] font-medium'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              )
            }
          >
            {item.label}
          </NavLink>
        )}

        {hasChildren && isExpanded && level === 0 && (
          <div className="nav-children mt-1 space-y-1">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'sidebar bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300',
        'flex flex-col h-full',
        collapsed ? 'w-16' : 'w-72',
        className
      )}
    >
      {/* Logo */}
      <div className="sidebar-header flex items-center gap-3 px-6 py-4 border-b border-[var(--border-primary)]">
        <div className="logo w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">x</span>
        </div>
        {!collapsed && (
          <div className="logo-text">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">xTrading</h1>
            <p className="text-xs text-[var(--text-tertiary)]">量化交易系统</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer p-4 border-t border-[var(--border-primary)]">
        {!collapsed && (
          <div className="version-info text-center">
            <p className="text-xs text-[var(--text-disabled)]">v1.0.0</p>
            <p className="text-xs text-[var(--text-disabled)] mt-1">
              © 2026 xTrading
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
