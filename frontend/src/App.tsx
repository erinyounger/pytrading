import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  ExperimentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import BacktestResults from './pages/BacktestResults';
import BacktestManager from './pages/BacktestManager';
import Settings from './pages/Settings';
import { darkTheme, globalDarkStyles } from './styles/darkTheme';
import './index.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleCollapsed = (value: boolean) => {
    setCollapsed(value);
    localStorage.setItem('sidebar_collapsed', String(value));
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/backtest',
      icon: <BarChartOutlined />,
      label: '回测结果',
    },
    {
      key: '/backtest-manager',
      icon: <ExperimentOutlined />,
      label: '回测管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = (e: any) => {
    window.location.href = e.key;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <style>{globalDarkStyles}</style>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={handleCollapsed}
          theme="dark"
          style={{
            background: darkTheme.cardBackground,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <div style={{
            height: 64,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${darkTheme.border}`
          }}>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: darkTheme.textPrimary }}>
                PyTrading
              </Title>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={[window.location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              background: darkTheme.cardBackground,
              borderRight: 0,
              color: darkTheme.textPrimary
            }}
          />
        </Sider>
        <Layout>
          <Header style={{
            background: darkTheme.cardBackground,
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${darkTheme.border}`
          }}>
            <Title level={3} style={{ margin: 0, color: darkTheme.textPrimary }}>
              量化交易系统
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: darkTheme.textSecondary }}>管理员</span>
              <Avatar icon={<UserOutlined />} style={{ background: darkTheme.accent }} />
            </div>
          </Header>
          <Content>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/backtest" element={<BacktestResults />} />
              <Route path="/backtest-manager" element={<BacktestManager />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;