import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

// Placeholder pages
const Market = () => <div className="text-[var(--text-primary)]">实时行情页面开发中...</div>;
const Backtest = () => <div className="text-[var(--text-primary)]">回测管理页面开发中...</div>;
const Strategy = () => <div className="text-[var(--text-primary)]">策略管理页面开发中...</div>;
const Signal = () => <div className="text-[var(--text-primary)]">交易信号页面开发中...</div>;
const Risk = () => <div className="text-[var(--text-primary)]">风险管理页面开发中...</div>;
const Report = () => <div className="text-[var(--text-primary)]">性能报告页面开发中...</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/backtest" element={<Backtest />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/signal" element={<Signal />} />
        <Route path="/risk" element={<Risk />} />
        <Route path="/report" element={<Report />} />
      </Route>
    </Routes>
  );
}

export default App;
