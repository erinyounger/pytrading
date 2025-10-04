import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  ExperimentOutlined,
  MonitorOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import BacktestResults from './pages/BacktestResults';
import BacktestManager from './pages/BacktestManager';
import Settings from './pages/Settings';
import './index.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

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
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          style={{
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <div style={{ 
            height: 64, 
            padding: '16px', 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: '#001529' }}>
                PyTrading
              </Title>
            )}
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={[window.location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Header style={{ 
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              量化交易系统
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: 'white' }}>管理员</span>
              <Avatar icon={<UserOutlined />} />
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