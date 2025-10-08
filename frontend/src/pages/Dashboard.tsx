import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, message, Space, Select, Tag, Badge, Tooltip, Progress, Divider, Button, Modal, Alert } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined, 
  TrophyOutlined,
  BarChartOutlined,
  StarOutlined,
  RiseOutlined,
  FallOutlined,
  SafetyOutlined,
  WarningOutlined,
  FireOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  PieChartOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { apiService } from '../services/api';
import { BacktestResult } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  RadialLinearScale,
  Filler
);

// 标的评分和推荐类型
interface EnrichedStock extends BacktestResult {
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  recommendation: 'strong_buy' | 'buy' | 'watch' | 'caution';
  position_suggestion: number; // 建议仓位百分比
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    profitableRate: 0,
    avgPnlRatio: 0,
    avgSharpRatio: 0,
    avgWinRatio: 0,
  });
  const [strategyBoard, setStrategyBoard] = useState<{
    strategy: string;
    count: number;
    avgPnl: number;
    avgWin: number;
    avgSharp: number;
  }[]>([]);
  const [recommendedStocks, setRecommendedStocks] = useState<EnrichedStock[]>([]);
  const [filterRecommendation, setFilterRecommendation] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [filterTrend, setFilterTrend] = useState<string | null>(null);
  const [availableTrends, setAvailableTrends] = useState<string[]>([]);
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [showModelDesc, setShowModelDesc] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  useEffect(() => {
    fetchData();
    // 自动刷新：每5分钟
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 智能评分算法：基于多因子模型（优化版）
  const calculateStockScore = (r: BacktestResult): { 
    score: number; 
    risk_level: 'low' | 'medium' | 'high';
    recommendation: 'strong_buy' | 'buy' | 'watch' | 'caution';
    position_suggestion: number;
  } => {
    // MACD趋势权重优化（根据实际重要性调整）
    const trendWeights: Record<string, number> = {
      'ZeroAxisUp': 18,      // 上穿零轴线 - 最强信号（权重最高）
      'RisingUp': 12,        // 快线穿慢线向上 - 开始关注
      'Observing': 5,        // 观察期
      'UpDown': 0,           // 震荡 - 中性
      'DeadXDown': -15,      // 趋势翻转向下 - 重点提醒（负权重）
      'FallingDown': -18,    // 持续下跌 - 严重规避
      'Unknown': -5,         // 未知 - 轻微负权重
    };

    // 因子得分计算（优化权重分配）
    // 收益率因子：0-40分，收益率30%可得满分
    const pnlScore = Math.min(r.pnl_ratio / 0.30, 1) * 40;
    
    // 胜率因子：0-30分，胜率60%以上可得满分
    const winRateScore = Math.min(r.win_ratio / 0.60, 1) * 30;
    
    // 夏普比率因子：0-15分，夏普比率2.0以上可得满分
    const sharpScore = Math.min(Math.max(r.sharp_ratio, 0) / 2.0, 1) * 15;
    
    // 回撤惩罚：最高扣20分
    // 回撤10%以内：无惩罚或轻微惩罚
    // 回撤10-20%：中等惩罚
    // 回撤>20%：重度惩罚
    let drawdownPenalty = 0;
    if (r.max_drawdown <= 0.10) {
      drawdownPenalty = r.max_drawdown * 50; // 最多扣5分
    } else if (r.max_drawdown <= 0.20) {
      drawdownPenalty = 5 + (r.max_drawdown - 0.10) * 100; // 5-15分
    } else {
      drawdownPenalty = 15 + (r.max_drawdown - 0.20) * 125; // 15分+
    }
    drawdownPenalty = Math.min(drawdownPenalty, 20);
    
    // 趋势加成/惩罚
    const trendBonus = trendWeights[r.trending_type] || 0;
    
    // 总分计算（0-100分）
    const totalScore = pnlScore + winRateScore + sharpScore - drawdownPenalty + trendBonus;

    // 风险评级（综合考虑回撤、夏普比率和波动性）
    let risk_level: 'low' | 'medium' | 'high' = 'medium';
    
    // 低风险：回撤<=10%，夏普>=1.5
    if (r.max_drawdown <= 0.10 && r.sharp_ratio >= 1.5) {
      risk_level = 'low';
    } 
    // 高风险：回撤>20% 或 夏普<0.5 或 胜率<45%
    else if (r.max_drawdown > 0.20 || r.sharp_ratio < 0.5 || r.win_ratio < 0.45) {
      risk_level = 'high';
    }

    // 操作建议（严格按照五星标准）
    let recommendation: 'strong_buy' | 'buy' | 'watch' | 'caution' = 'watch';
    
    // ⭐⭐⭐⭐⭐ 五星标的（强烈推荐）：
    // 必须同时满足：收益>30% + 胜率>60% + MACD上穿零轴或快线穿慢线 + 非高风险
    if (r.pnl_ratio > 0.30 && 
        r.win_ratio > 0.60 && 
        ['ZeroAxisUp', 'RisingUp'].includes(r.trending_type) && 
        risk_level !== 'high' &&
        r.max_drawdown <= 0.25) {  // 回撤不超过25%
      recommendation = 'strong_buy';
    } 
    // ⭐⭐⭐ 推荐买入：收益>20% + 胜率>55% + 趋势未翻转
    else if (r.pnl_ratio > 0.20 && 
             r.win_ratio > 0.55 && 
             !['DeadXDown', 'FallingDown'].includes(r.trending_type) &&
             r.max_drawdown <= 0.30) {
      recommendation = 'buy';
    } 
    // ⚠️ 谨慎：趋势翻转 或 高风险 或 得分过低
    else if (['DeadXDown', 'FallingDown'].includes(r.trending_type) || 
             risk_level === 'high' || 
             totalScore < 35) {
      recommendation = 'caution';
    }

    // 建议仓位（基于风险和推荐等级的精细化仓位管理）
    let position_suggestion = 0;
    
    if (recommendation === 'strong_buy') {
      // 五星标的：根据MACD信号强度分配仓位
      if (r.trending_type === 'ZeroAxisUp' && r.pnl_ratio > 0.30 && r.win_ratio > 0.60) {
        // 上穿零轴 + 优秀指标：15-20%重仓
        position_suggestion = risk_level === 'low' ? 20 : 15;
      } else if (r.trending_type === 'RisingUp') {
        // 快线穿慢线：10-15%
        position_suggestion = risk_level === 'low' ? 15 : 10;
      } else {
        position_suggestion = 10;
      }
    } else if (recommendation === 'buy') {
      // 推荐买入：5-10%
      position_suggestion = risk_level === 'low' ? 10 : 5;
    } else if (recommendation === 'watch') {
      // 观察：3%小仓位试探
      position_suggestion = 3;
    }
    // 谨慎不建议配置仓位

    return { 
      score: Math.max(0, Math.min(100, totalScore)), 
      risk_level, 
      recommendation, 
      position_suggestion 
    };
  };

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
      setLoading(true);
      }
      
      // 拉取最新去重后的样本，做前端聚合
      const response = await apiService.getBacktestResults({ per_page: 1000 });
      const results = response.data;
      setBacktestResults(results);
      
      // 更新时间
      setLastUpdateTime(new Date().toLocaleString('zh-CN'));
      
      if (results.length === 0) {
        setSummary({ total: 0, profitableRate: 0, avgPnlRatio: 0, avgSharpRatio: 0, avgWinRatio: 0 });
        setStrategyBoard([]);
        setRecommendedStocks([]);
        return;
      }

      // KPI 汇总
      const total = results.length;
      const profitableCount = results.filter(r => r.pnl_ratio > 0).length;
      const avgPnl = results.reduce((sum, r) => sum + r.pnl_ratio, 0) / total;
      const avgSharp = results.reduce((sum, r) => sum + r.sharp_ratio, 0) / total;
      const avgWin = results.reduce((sum, r) => sum + r.win_ratio, 0) / total;
      setSummary({
        total,
        profitableRate: total ? profitableCount / total : 0,
        avgPnlRatio: avgPnl,
        avgSharpRatio: avgSharp,
        avgWinRatio: avgWin,
      });

      // 策略维度榜单（按 strategy_name 汇总）
      const strategyMap = new Map<string, BacktestResult[]>();
      results.forEach(r => {
        const key = r.strategy_name || 'Unknown';
        if (!strategyMap.has(key)) strategyMap.set(key, []);
        strategyMap.get(key)!.push(r);
      });
      const board = Array.from(strategyMap.entries()).map(([strategy, list]) => {
        const cnt = list.length;
        return {
          strategy,
          count: cnt,
          avgPnl: list.reduce((s, r) => s + r.pnl_ratio, 0) / cnt,
          avgWin: list.reduce((s, r) => s + r.win_ratio, 0) / cnt,
          avgSharp: list.reduce((s, r) => s + r.sharp_ratio, 0) / cnt,
        };
      }).sort((a, b) => (b.avgPnl - a.avgPnl) || (b.avgWin - a.avgWin)).slice(0, 10);
      setStrategyBoard(board);

      // 智能推荐标的（过滤+评分+排序）
      // 过滤条件：
      // 1. 基础要求：胜率>=50%，收益>=3%，至少3次交易
      // 2. 去除ST股票：股票名称不包含ST、*ST、S*ST等
      // 3. 去除中小盘：只保留主板和科创板（SHSE.6/SZSE.0/SHSE.688开头）
      const candidates = results.filter(r => {
        // 基础筛选
        if (r.win_ratio < 0.50 || r.pnl_ratio < 0.03 || r.open_count < 3) {
          return false;
        }
        
        // 去除ST股票（包括*ST、S*ST、ST等）
        if (r.name && (
          r.name.includes('ST') || 
          r.name.includes('*') || 
          r.name.includes('退')
        )) {
          return false;
        }
        
        // 只保留大盘股（主板、科创板、创业板300开头的）
        // SHSE.6xxxxx - 上交所主板
        // SZSE.00xxxx - 深交所主板
        // SZSE.300xxx - 创业板（市值较大的）
        // SHSE.688xxx - 科创板
        const symbol = r.symbol || '';
        const isLargeCap = 
          symbol.startsWith('SHSE.6') ||      // 上交所主板
          symbol.startsWith('SZSE.00') ||     // 深交所主板
          symbol.startsWith('SZSE.300') ||    // 创业板
          symbol.startsWith('SHSE.688');      // 科创板
        
        return isLargeCap;
      });

      const enrichedStocks: EnrichedStock[] = candidates.map(r => {
        const { score, risk_level, recommendation, position_suggestion } = calculateStockScore(r);
        return { ...r, score, risk_level, recommendation, position_suggestion };
      }).sort((a, b) => b.score - a.score).slice(0, 50); // 取Top50

      setRecommendedStocks(enrichedStocks);
      
      // 可用趋势集合
      setAvailableTrends(Array.from(new Set(results.map(r => r.trending_type).filter(Boolean))).sort());
      
      if (isRefresh) {
        message.success('数据已刷新');
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 手动刷新
  const handleRefresh = async () => {
    await fetchData(true);
  };

  // 导出推荐列表为CSV
  const handleExport = () => {
    if (filteredStocks.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }

    const headers = [
      '排名', '股票代码', '股票名称', '综合评分', '操作建议', '风险等级', '建议仓位%',
      '收益率%', '胜率%', '夏普比率', '最大回撤%', '趋势', '策略', '交易次数'
    ];

    const rows = filteredStocks.map((stock, index) => [
      index + 1,
      stock.symbol,
      stock.name,
      stock.score.toFixed(2),
      stock.recommendation === 'strong_buy' ? '强烈推荐' :
        stock.recommendation === 'buy' ? '推荐买入' :
        stock.recommendation === 'watch' ? '观察' : '谨慎',
      stock.risk_level === 'low' ? '低风险' :
        stock.risk_level === 'medium' ? '中风险' : '高风险',
      stock.position_suggestion,
      (stock.pnl_ratio * 100).toFixed(2),
      (stock.win_ratio * 100).toFixed(1),
      stock.sharp_ratio.toFixed(2),
      (stock.max_drawdown * 100).toFixed(2),
      stock.trending_type,
      stock.strategy_name || '-',
      stock.open_count
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 添加 BOM 以支持中文
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `智能推荐标的_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success(`已导出 ${filteredStocks.length} 个推荐标的`);
  };

  // 推荐等级标签渲染
  const recommendationTag = (rec: string) => {
    const config = {
      strong_buy: { color: 'red', icon: <FireOutlined />, text: '强烈推荐' },
      buy: { color: 'green', icon: <RiseOutlined />, text: '推荐买入' },
      watch: { color: 'blue', icon: <EyeOutlined />, text: '观察' },
      caution: { color: 'orange', icon: <WarningOutlined />, text: '谨慎' },
    };
    const c = config[rec as keyof typeof config] || config.watch;
    return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
  };

  // 风险等级渲染
  const riskLevelTag = (risk: string) => {
    const config = {
      low: { color: 'success' as const, icon: <SafetyOutlined />, text: '低风险' },
      medium: { color: 'warning' as const, icon: <BarChartOutlined />, text: '中风险' },
      high: { color: 'error' as const, icon: <WarningOutlined />, text: '高风险' },
    };
    const c = config[risk as keyof typeof config] || config.medium;
    return <Badge status={c.color} text={<span><span style={{ marginRight: 4 }}>{c.icon}</span>{c.text}</span>} />;
  };

  // 趋势标签（带提醒）
  const trendTag = (t: string) => {
    const trendConfig: Record<string, { color: string; icon?: React.ReactNode; text: string }> = {
      'ZeroAxisUp': { color: 'magenta', icon: <ThunderboltOutlined />, text: '上穿零轴⚡' },
      'RisingUp': { color: 'red', icon: <RiseOutlined />, text: '快线穿慢线↗' },
      'Observing': { color: 'blue', text: '观察中' },
      'UpDown': { color: 'cyan', text: '震荡' },
      'DeadXDown': { color: 'orange', icon: <WarningOutlined />, text: '⚠️趋势翻转' },
      'FallingDown': { color: 'volcano', icon: <FallOutlined />, text: '⚠️持续下跌' },
      'Unknown': { color: 'default', text: '未知' },
    };
    const config = trendConfig[t] || trendConfig['Unknown'];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 过滤后的推荐列表
  const filteredStocks = recommendedStocks.filter(stock => {
    if (filterRecommendation && stock.recommendation !== filterRecommendation) return false;
    if (filterRisk && stock.risk_level !== filterRisk) return false;
    if (filterTrend) {
      if (filterTrend === 'turndown' && !['DeadXDown', 'FallingDown'].includes(stock.trending_type)) {
        return false;
      } else if (filterTrend !== 'turndown' && stock.trending_type !== filterTrend) {
        return false;
      }
    }
    return true;
  });

  // 雷达图数据：Top5标的多维度对比
  const radarData = {
    labels: ['收益率', '胜率', '夏普比率', '低回撤', '综合评分'],
    datasets: recommendedStocks.slice(0, 5).map((stock, index) => {
      const colors = ['#ff4d4f', '#52c41a', '#1890ff', '#faad14', '#722ed1'];
      return {
        label: `${stock.symbol} ${stock.name}`,
        data: [
          Math.min(stock.pnl_ratio * 100 * 3.33, 100), // 收益率归一化到100
          stock.win_ratio * 100, // 胜率
          Math.min(stock.sharp_ratio * 33.33, 100), // 夏普归一化
          Math.max(0, 100 - stock.max_drawdown * 100 * 5), // 回撤转为正向指标
          stock.score, // 综合评分
        ],
        borderColor: colors[index],
        backgroundColor: `${colors[index]}33`,
        borderWidth: 2,
      };
    }),
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Top 5 推荐标的多维度对比',
      },
    },
  };

  // 推荐标的表格列定义（紧凑版）
  const recommendedColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 56,
      render: (_: any, record: EnrichedStock, index: number) => {
        const rank = index + 1;
        const isTopQuality = record.trending_type === 'ZeroAxisUp' && record.recommendation === 'strong_buy';
        
        if (rank <= 3) {
          return (
            <div style={{ textAlign: 'center' }}>
              <Badge count={rank} style={{ backgroundColor: ['#f5222d', '#fa8c16', '#faad14'][rank - 1] }} />
              {isTopQuality && <div style={{ fontSize: '10px', marginTop: '2px' }}>⭐⭐⭐⭐⭐</div>}
            </div>
          );
        }
        return (
          <div style={{ textAlign: 'center', fontSize: '13px' }}>
            <span style={{ color: '#999' }}>#{rank}</span>
            {isTopQuality && <div style={{ fontSize: '10px', marginTop: '2px' }}>⭐⭐⭐⭐⭐</div>}
          </div>
        );
      },
    },
    {
      title: '股票',
      key: 'stock',
      width: 130,
      ellipsis: true,
      render: (_: any, record: EnrichedStock) => (
        <div style={{ maxWidth: 130 }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{record.symbol}</div>
          <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: '综合评分',
      dataIndex: 'score',
      key: 'score',
      width: 110,
      sorter: (a: EnrichedStock, b: EnrichedStock) => b.score - a.score,
      render: (score: number) => (
        <div>
          <Progress
            percent={score}
            size="small"
            strokeColor={score >= 70 ? '#52c41a' : score >= 55 ? '#1890ff' : '#faad14'}
            format={(percent) => `${percent?.toFixed(0)}分`}
          />
        </div>
      ),
    },
    {
      title: '操作建议',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 100,
      filters: [
        { text: '强烈推荐', value: 'strong_buy' },
        { text: '推荐买入', value: 'buy' },
        { text: '观察', value: 'watch' },
        { text: '谨慎', value: 'caution' },
      ],
      onFilter: (value: any, record: EnrichedStock) => record.recommendation === value,
      render: (rec: string, record: EnrichedStock) => {
        const isTopQuality = record.trending_type === 'ZeroAxisUp' && record.recommendation === 'strong_buy';
        return (
          <div>
            {recommendationTag(rec)}
            {isTopQuality && (
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                ⭐⭐⭐⭐⭐
              </div>
            )}
            {record.trending_type === 'RisingUp' && record.recommendation === 'strong_buy' && (
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                ⭐⭐⭐⭐
              </div>
            )}
            {record.recommendation === 'buy' && ['ZeroAxisUp', 'RisingUp'].includes(record.trending_type) && (
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                ⭐⭐⭐
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 90,
      filters: [
        { text: '低风险', value: 'low' },
        { text: '中风险', value: 'medium' },
        { text: '高风险', value: 'high' },
      ],
      onFilter: (value: any, record: EnrichedStock) => record.risk_level === value,
      render: (risk: string) => riskLevelTag(risk),
    },
    {
      title: '建议仓位',
      dataIndex: 'position_suggestion',
      key: 'position_suggestion',
      width: 80,
      sorter: (a: EnrichedStock, b: EnrichedStock) => b.position_suggestion - a.position_suggestion,
      render: (pos: number, record: EnrichedStock) => {
        const isTopQuality = record.trending_type === 'ZeroAxisUp' && record.recommendation === 'strong_buy';
        return (
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: pos >= 15 ? '#ff4d4f' : pos >= 10 ? '#52c41a' : '#1890ff' }}>
              {pos}%
            </span>
            {isTopQuality && (
              <div style={{ fontSize: '10px', color: '#ff4d4f', marginTop: '1px' }}>
                💎优质
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '收益率',
      dataIndex: 'pnl_ratio',
      key: 'pnl_ratio',
      width: 80,
      sorter: (a: EnrichedStock, b: EnrichedStock) => b.pnl_ratio - a.pnl_ratio,
      render: (value: number) => (
        <span style={{ color: value >= 0.3 ? '#ff4d4f' : value >= 0.1 ? '#52c41a' : '#1890ff', fontWeight: 'bold', fontSize: '13px' }}>
          {(value * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      title: '胜率',
      dataIndex: 'win_ratio',
      key: 'win_ratio',
      width: 70,
      sorter: (a: EnrichedStock, b: EnrichedStock) => b.win_ratio - a.win_ratio,
      render: (value: number) => (
        <span style={{ fontSize: '13px', color: value >= 0.6 ? '#52c41a' : '#666' }}>
          {(value * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      title: '回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      width: 70,
      sorter: (a: EnrichedStock, b: EnrichedStock) => a.max_drawdown - b.max_drawdown,
      render: (value: number) => (
        <span style={{ color: value <= 0.1 ? '#52c41a' : value <= 0.2 ? '#1890ff' : '#ff4d4f', fontSize: '13px' }}>
          {(value * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      title: '夏普',
      dataIndex: 'sharp_ratio',
      key: 'sharp_ratio',
      width: 60,
      sorter: (a: EnrichedStock, b: EnrichedStock) => b.sharp_ratio - a.sharp_ratio,
      render: (value: number) => <span style={{ fontSize: '13px' }}>{value.toFixed(2)}</span>,
    },
    {
      title: '趋势',
      dataIndex: 'trending_type',
      key: 'trending_type',
      width: 90,
      filters: availableTrends.map(t => ({ text: t, value: t })),
      onFilter: (value: any, record: EnrichedStock) => record.trending_type === value,
      render: (t: string) => trendTag(t),
    },
    {
      title: '策略',
      dataIndex: 'strategy_name',
      key: 'strategy_name',
      width: 90,
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontSize: '12px', display: 'inline-block', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {v || '-'}
        </span>
      ),
    },
  ];

  // 策略榜单列定义
  const strategyColumns = [
    { title: '策略', dataIndex: 'strategy', key: 'strategy' },
    { title: '样本数', dataIndex: 'count', key: 'count' },
    { 
      title: '平均收益率', 
      dataIndex: 'avgPnl', 
      key: 'avgPnl', 
      render: (v: number) => (
        <span style={{ color: v >= 0.1 ? '#52c41a' : v >= 0.05 ? '#1890ff' : '#999', fontWeight: 'bold' }}>
          {(v * 100).toFixed(2)}%
        </span>
      )
    },
    { title: '平均胜率', dataIndex: 'avgWin', key: 'avgWin', render: (v: number) => `${(v * 100).toFixed(1)}%` },
    { title: '夏普均值', dataIndex: 'avgSharp', key: 'avgSharp', render: (v: number) => v.toFixed(2) },
  ];

  // 统计各类推荐数量
  const recommendationStats = {
    strong_buy: recommendedStocks.filter(s => s.recommendation === 'strong_buy').length,
    buy: recommendedStocks.filter(s => s.recommendation === 'buy').length,
    watch: recommendedStocks.filter(s => s.recommendation === 'watch').length,
    caution: recommendedStocks.filter(s => s.recommendation === 'caution').length,
  };

  // 统计趋势情况（关联推荐等级）
  const trendStats = {
    zeroAxisUp: {
      total: recommendedStocks.filter(s => s.trending_type === 'ZeroAxisUp').length,
      strongBuy: recommendedStocks.filter(s => s.trending_type === 'ZeroAxisUp' && s.recommendation === 'strong_buy').length,
      buy: recommendedStocks.filter(s => s.trending_type === 'ZeroAxisUp' && s.recommendation === 'buy').length,
    },
    risingUp: {
      total: recommendedStocks.filter(s => s.trending_type === 'RisingUp').length,
      strongBuy: recommendedStocks.filter(s => s.trending_type === 'RisingUp' && s.recommendation === 'strong_buy').length,
      buy: recommendedStocks.filter(s => s.trending_type === 'RisingUp' && s.recommendation === 'buy').length,
    },
    turnDown: {
      total: recommendedStocks.filter(s => ['DeadXDown', 'FallingDown'].includes(s.trending_type)).length,
      strongBuy: recommendedStocks.filter(s => ['DeadXDown', 'FallingDown'].includes(s.trending_type) && s.recommendation === 'strong_buy').length,
      buy: recommendedStocks.filter(s => ['DeadXDown', 'FallingDown'].includes(s.trending_type) && s.recommendation === 'buy').length,
    },
  };

  // 筛选出需要警告的股票（趋势翻转）
  const warningStocks = recommendedStocks.filter(s => 
    ['DeadXDown', 'FallingDown'].includes(s.trending_type)
  );

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>正在加载数据...</div>
        </div>
      </div>
    );
  }

  // 空数据状态
  if (summary.total === 0) {
  return (
      <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px' }}>
            <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            智能投资决策中心
          </h1>
        </div>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BarChartOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
            <h3 style={{ marginTop: '16px', color: '#999' }}>暂无回测数据</h3>
            <p style={{ color: '#999' }}>
              请先执行回测任务，系统将自动分析并生成智能推荐
            </p>
            <Button type="primary" style={{ marginTop: '16px' }} onClick={() => window.location.href = '#/backtest-manager'}>
              去创建回测
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>
            <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            智能投资决策中心
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            基于历史回测数据的多因子智能评分系统，为您精选优质标的
            {lastUpdateTime && (
              <span style={{ marginLeft: '16px', fontSize: '12px' }}>
                最后更新: {lastUpdateTime}
              </span>
            )}
          </p>
        </div>
        <Space>
          <Button
            icon={<PieChartOutlined />}
            onClick={() => setShowRadarModal(true)}
            disabled={recommendedStocks.length === 0}
          >
            多维对比
          </Button>
          <Button
            type="primary"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      {/* 核心KPI概览 + 推荐统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="分析样本"
              value={summary.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="推荐标的"
              value={recommendedStocks.length}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="平均收益"
              value={summary.avgPnlRatio * 100}
              precision={2}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: summary.avgPnlRatio >= 0 ? '#52c41a' : '#ff4d4f', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="盈利占比"
              value={summary.profitableRate * 100}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14', fontSize: '20px' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            border: '2px solid #ffa726',
            boxShadow: '0 4px 12px rgba(255, 167, 38, 0.4)'
          }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>🔥 强推</span>}
              value={recommendationStats.strong_buy}
              valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              suffix="个"
            />
            {trendStats.zeroAxisUp.strongBuy > 0 && (
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.95, fontWeight: 'bold' }}>
                ⭐ 其中{trendStats.zeroAxisUp.strongBuy}只五星标的
              </div>
            )}
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>📈 推荐</span>}
              value={recommendationStats.buy}
              valueStyle={{ color: 'white', fontSize: '20px' }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>👁️ 观察</span>}
              value={recommendationStats.watch}
              valueStyle={{ color: 'white', fontSize: '20px' }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Tooltip title="建议总仓位占比">
              <Statistic
                title="建议总仓位"
                value={recommendedStocks.slice(0, 10).reduce((sum, s) => sum + s.position_suggestion, 0)}
                precision={0}
                suffix="%"
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: '20px' }}
              />
            </Tooltip>
          </Card>
        </Col>
      </Row>

      {/* 趋势翻转警告列表（如果有） */}
      {warningStocks.length > 0 && (
        <Alert
          message={
            <div>
              <WarningOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
              <strong>趋势翻转预警：</strong>以下 {warningStocks.length} 只股票出现MACD趋势转弱信号，建议谨慎操作
            </div>
          }
          description={
            <div style={{ marginTop: '8px' }}>
              {warningStocks.slice(0, 5).map((stock, index) => (
                <Tag key={index} color="red" style={{ marginBottom: '4px' }}>
                  {stock.symbol} {stock.name} - {stock.trending_type === 'DeadXDown' ? '死叉向下' : '持续下跌'}
                </Tag>
              ))}
              {warningStocks.length > 5 && (
                <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                  ... 还有 {warningStocks.length - 5} 只
                </span>
              )}
            </div>
          }
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
          banner
        />
      )}

      {/* 简洁版决策指引 */}
      <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
        <Row gutter={[24, 8]} align="middle">
          <Col flex="auto">
            <Space size={24} wrap>
              <div>
                <span style={{ fontSize: '12px', color: '#999' }}>📌 当前建议买入：</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f', marginLeft: '8px' }}>
                  {trendStats.zeroAxisUp.strongBuy}只
                </span>
                <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>（上穿零轴+强推）</span>
              </div>
              <Divider type="vertical" style={{ height: '24px' }} />
              <div>
                <span style={{ fontSize: '12px', color: '#999' }}>⚠️ 需要关注：</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', marginLeft: '8px' }}>
                  {trendStats.turnDown.total}只
                </span>
                <span style={{ fontSize: '11px', color: '#999', marginLeft: '4px' }}>（趋势翻转）</span>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 核心区域：智能推荐标的 */}
      <Card 
        title={
          <Space>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>📊 推荐标的</span>
            <Tag color="red">{recommendationStats.strong_buy} 强推</Tag>
            <Tag color="green">{recommendationStats.buy} 推荐</Tag>
            <Tag color="blue">{recommendationStats.watch} 观察</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              size="small"
              onClick={handleExport}
              disabled={filteredStocks.length === 0}
            >
              导出列表 ({filteredStocks.length})
            </Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {/* 评分模型说明（可折叠） */}
        <div style={{ marginBottom: '12px' }}>
          <Button 
            type="link" 
            size="small"
            onClick={() => setShowModelDesc(!showModelDesc)}
            style={{ padding: '4px 8px', color: '#1890ff' }}
          >
            <InfoCircleOutlined /> {showModelDesc ? '收起' : '查看'}评分模型说明
          </Button>
          
          {showModelDesc && (
            <div style={{ marginTop: '8px', padding: '12px', background: '#fafafa', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
              <Row gutter={[16, 8]}>
                <Col xs={24} md={8}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>📊 评分权重</div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
                    收益率40分 + 胜率30分 + 夏普15分 - 回撤20分 + MACD趋势±18分
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>⭐⭐⭐⭐⭐ 五星标的</div>
                  <div style={{ fontSize: '11px', color: '#ff4d4f', lineHeight: '1.6' }}>
                    收益&gt;30% + 胜率&gt;60% + 回撤≤25% + MACD上穿零轴/快线穿慢线
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>🎯 筛选标准</div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
                    仅大盘股，排除ST，胜率≥50%，收益≥3%
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* 快速筛选 */}
        <div style={{ marginBottom: 16 }}>
          <Space size={8} wrap style={{ marginBottom: 8 }}>
            {/* 五星标的快捷按钮 */}
            {trendStats.zeroAxisUp.strongBuy > 0 && (
              <Button
                type="primary"
                danger
                icon={<ThunderboltOutlined />}
                onClick={() => {
                  setFilterTrend('ZeroAxisUp');
                  setFilterRecommendation('strong_buy');
                  setFilterRisk(null);
                }}
              >
                ⭐⭐⭐⭐⭐ 五星标的 ({trendStats.zeroAxisUp.strongBuy})
              </Button>
            )}
            <Button
              type={filterRecommendation === null ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterRecommendation(null)}
            >
              全部
            </Button>
            <Button
              type={filterRecommendation === 'strong_buy' ? 'primary' : 'default'}
              size="small"
              danger={filterRecommendation === 'strong_buy'}
              onClick={() => setFilterRecommendation('strong_buy')}
            >
              强推 ({recommendationStats.strong_buy})
            </Button>
            <Button
              type={filterRecommendation === 'buy' ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterRecommendation('buy')}
            >
              推荐 ({recommendationStats.buy})
            </Button>
            
            {(filterRecommendation || filterRisk || filterTrend) && (
              <Button 
                size="small" 
                onClick={() => {
                  setFilterRecommendation(null);
                  setFilterRisk(null);
                  setFilterTrend(null);
                }}
              >
                清除筛选
              </Button>
            )}
          </Space>

          {(filterRecommendation || filterRisk || filterTrend) && (
            <Alert
              message={
                <span>
                  当前筛选结果: <strong style={{ color: '#1890ff', fontSize: '16px' }}>{filteredStocks.length}</strong> 个标的
                  {filterTrend && (
                    <span style={{ marginLeft: '16px', fontSize: '12px', color: '#666' }}>
                      趋势类型: <strong>
                        {filterTrend === 'ZeroAxisUp' ? '上穿零轴⚡' : 
                         filterTrend === 'RisingUp' ? '快线穿慢线↗' : 
                         filterTrend === 'turndown' ? '趋势翻转⚠️' : ''}
                      </strong>
                    </span>
                  )}
                  {filteredStocks.length > 0 && (
                    <span style={{ marginLeft: '16px', fontSize: '12px', color: '#666' }}>
                      建议总仓位: <strong>{filteredStocks.slice(0, 10).reduce((sum, s) => sum + s.position_suggestion, 0).toFixed(0)}%</strong>
                    </span>
                  )}
                </span>
              }
              type="info"
              showIcon
              closable
              onClose={() => {
                setFilterRecommendation(null);
                setFilterRisk(null);
                setFilterTrend(null);
              }}
              style={{ marginBottom: 12 }}
            />
          )}
        </div>

        {filteredStocks.length > 0 ? (
        <Table
            columns={recommendedColumns}
            dataSource={filteredStocks}
          rowKey={(r) => `${r.symbol}_${r.backtest_end_time}`}
            pagination={{ 
              pageSize: 20, 
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个推荐标的`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ x: 1200 }}
            size="small"
            rowClassName={(record) => {
              // 趋势翻转最优先，警告样式
              if (['DeadXDown', 'FallingDown'].includes(record.trending_type)) {
                return 'row-trend-warning';
              }
              // 上穿零轴，重点关注
              if (record.trending_type === 'ZeroAxisUp') {
                return 'row-zero-axis-up';
              }
              // 强烈推荐
              if (record.recommendation === 'strong_buy') {
                return 'row-strong-buy';
              }
              // 推荐买入
              if (record.recommendation === 'buy') {
                return 'row-buy';
              }
              return '';
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fafafa', borderRadius: '4px' }}>
            <InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <h4 style={{ marginTop: '16px', color: '#999' }}>
              {filterRecommendation || filterRisk ? '当前筛选条件下没有匹配的标的' : '暂无符合推荐条件的标的'}
            </h4>
            <p style={{ color: '#999', marginTop: '8px' }}>
              {filterRecommendation || filterRisk ? '请尝试调整筛选条件' : '系统会持续分析回测数据，发现优质标的后会自动展示'}
            </p>
          </div>
        )}
      </Card>

      {/* 辅助区域：策略表现分析 */}
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <span>策略表现对比分析</span>
        </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={strategyColumns}
          dataSource={strategyBoard}
          rowKey={(r) => r.strategy}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 雷达图弹窗 */}
      <Modal
        title="Top 5 推荐标的多维度对比分析"
        open={showRadarModal}
        onCancel={() => setShowRadarModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowRadarModal(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
          <Space direction="vertical" size={4}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <InfoCircleOutlined style={{ marginRight: '4px' }} />
              <strong>图表说明：</strong>五个维度均已归一化到0-100分，分数越高表现越好
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • <strong>收益率</strong>: 历史回测期间收益表现
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • <strong>胜率</strong>: 盈利交易占比
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • <strong>夏普比率</strong>: 风险调整后收益
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • <strong>低回撤</strong>: 最大回撤越小，此项得分越高
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • <strong>综合评分</strong>: 多因子加权综合得分
            </div>
          </Space>
        </div>
        <div style={{ height: '500px', position: 'relative' }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
        <Divider />
        <div style={{ marginTop: '16px' }}>
          <h4>Top 5 标的详情：</h4>
          <Table
            columns={[
              { title: '排名', key: 'rank', width: 60, render: (_: any, __: any, index: number) => `#${index + 1}` },
              { title: '代码', dataIndex: 'symbol', key: 'symbol', width: 100 },
              { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
              { title: '评分', dataIndex: 'score', key: 'score', width: 80, render: (v: number) => `${v.toFixed(0)}分` },
              { title: '收益率', dataIndex: 'pnl_ratio', key: 'pnl_ratio', width: 90, render: (v: number) => `${(v * 100).toFixed(2)}%` },
              { title: '胜率', dataIndex: 'win_ratio', key: 'win_ratio', width: 80, render: (v: number) => `${(v * 100).toFixed(1)}%` },
              { title: '夏普', dataIndex: 'sharp_ratio', key: 'sharp_ratio', width: 70, render: (v: number) => v.toFixed(2) },
              { title: '回撤', dataIndex: 'max_drawdown', key: 'max_drawdown', width: 90, render: (v: number) => `${(v * 100).toFixed(2)}%` },
            ]}
            dataSource={recommendedStocks.slice(0, 5)}
            rowKey={(r) => r.symbol}
            pagination={false}
            size="small"
          />
        </div>
      </Modal>

      {/* 自定义样式 */}
      <style>{`
        /* 趋势翻转警告 - 最高优先级 */
        .row-trend-warning {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f !important;
          animation: pulse-warning 2s infinite;
        }
        
        @keyframes pulse-warning {
          0%, 100% { background-color: #fff1f0; }
          50% { background-color: #ffe7e7; }
        }
        
        /* 上穿零轴 - 重点关注 */
        .row-zero-axis-up {
          background-color: #fff0f6 !important;
          border-left: 4px solid #eb2f96 !important;
          box-shadow: 0 2px 8px rgba(235, 47, 150, 0.15);
        }
        
        /* 强烈推荐 */
        .row-strong-buy {
          background-color: #fff1f0 !important;
          border-left: 3px solid #ff7875 !important;
        }
        
        /* 推荐买入 */
        .row-buy {
          background-color: #f6ffed !important;
          border-left: 3px solid #95de64 !important;
        }
        
        .profit-positive {
          color: #52c41a;
          font-weight: bold;
        }
        .profit-negative {
          color: #ff4d4f;
          font-weight: bold;
        }
        
        /* 表格悬停效果增强 */
        .ant-table-tbody > tr:hover > td {
          background: #e6f7ff !important;
        }
        
        .row-trend-warning:hover > td {
          background: #ffe7e7 !important;
        }
        
        .row-zero-axis-up:hover > td {
          background: #ffe7f3 !important;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;