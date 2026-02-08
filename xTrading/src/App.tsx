import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';

// Page components
import Market from './pages/Market';
import BacktestPage from './pages/Backtest';
import StrategyPage from './pages/Strategy';
import SignalPage from './pages/Signal';
import RiskPage from './pages/Risk';
import ReportPage from './pages/Report';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/backtest" element={<BacktestPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
        <Route path="/signal" element={<SignalPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Route>
    </Routes>
  );
}

export default App;
