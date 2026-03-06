import React, { useEffect, useRef, useState } from 'react';
import { createChart, createSeriesMarkers, ColorType, IChartApi, ISeriesApi, ISeriesMarkersPluginApi, CandlestickData, HistogramData, LineData, Time, CandlestickSeries, HistogramSeries, LineSeries, SeriesMarker } from 'lightweight-charts';
import { TradeRecord } from '../types';

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  macd_diff?: number;
  macd_dea?: number;
  macd_hist?: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
}

interface StockChartProps {
  data: KLineData[];
  symbol: string;
  name?: string;
  tradeRecords?: TradeRecord[];
}

const MAIN_CHART_HEIGHT = 250;
const MACD_CHART_HEIGHT = 170;

const StockChart: React.FC<StockChartProps> = ({ data, symbol, name, tradeRecords }) => {
  const mainChartContainerRef = useRef<HTMLDivElement>(null);
  const macdChartContainerRef = useRef<HTMLDivElement>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lineDiffSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const lineDeaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma10SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  // 存储计算均线后的数据
  const dataWithMARef = useRef<KLineData[]>([]);
  // 当前光标值
  const [currentValues, setCurrentValues] = useState<{
    ma5?: number; ma10?: number; ma20?: number; ma60?: number;
    macd_hist?: number; macd_diff?: number; macd_dea?: number;
  }>({});

  // 计算均线
  const calculateMA = (data: KLineData[], period: number): KLineData[] => {
    return data.map((item, idx) => {
      if (idx < period - 1) return { ...item };
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += data[idx - i].close;
      }
      return { ...item, [`ma${period}`]: sum / period };
    });
  };

  useEffect(() => {
    if (!mainChartContainerRef.current || !macdChartContainerRef.current) return;

    // 创建主图 - K线和均线
    const mainChart = createChart(mainChartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#666',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      width: mainChartContainerRef.current.clientWidth,
      height: MAIN_CHART_HEIGHT,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#ddd',
      },
      rightPriceScale: {
        borderColor: '#ddd',
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 1,
          color: '#758696',
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 2,
          labelBackgroundColor: '#758696',
        },
      },
    });

    mainChartRef.current = mainChart;

    // 创建MACD图
    const macdChart = createChart(macdChartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#666',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#eee' },
        horzLines: { color: '#eee' },
      },
      width: macdChartContainerRef.current.clientWidth,
      height: MACD_CHART_HEIGHT,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#ddd',
      },
      rightPriceScale: {
        borderColor: '#ddd',
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 1,
          color: '#758696',
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 2,
          labelBackgroundColor: '#758696',
        },
      },
    });

    macdChartRef.current = macdChart;

    // 添加K线系列到主图
    const candlestickSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#e74c3c',
      downColor: '#2ecc71',
      borderVisible: false,
      wickUpColor: '#e74c3c',
      wickDownColor: '#2ecc71',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // 添加均线系列到主图 - MA5 (黄色)
    const ma5Series = mainChart.addSeries(LineSeries, {
      color: '#FFA500',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma5SeriesRef.current = ma5Series;

    // MA10 (紫色)
    const ma10Series = mainChart.addSeries(LineSeries, {
      color: '#9932cc',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma10SeriesRef.current = ma10Series;

    // MA20 (蓝色)
    const ma20Series = mainChart.addSeries(LineSeries, {
      color: '#0000ff',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma20SeriesRef.current = ma20Series;

    // MA60 (青色)
    const ma60Series = mainChart.addSeries(LineSeries, {
      color: '#00ced1',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ma60SeriesRef.current = ma60Series;

    // 添加MACD柱状图系列到MACD图
    const histogramSeries = macdChart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => price.toFixed(2),
      },
      priceScaleId: '',
    });
    histogramSeriesRef.current = histogramSeries;

    // 添加DIF线到MACD图
    const lineDiffSeries = macdChart.addSeries(LineSeries, {
      color: '#ff4500',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: '',
    });
    lineDiffSeriesRef.current = lineDiffSeries;

    // 添加DEA线到MACD图
    const lineDeaSeries = macdChart.addSeries(LineSeries, {
      color: '#4169e1',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      priceScaleId: '',
    });
    lineDeaSeriesRef.current = lineDeaSeries;

    // 双图表联动逻辑
    let isSyncing = false;

    // 主图滚动时同步MACD图
    const mainRangeHandler = (range: any) => {
      if (isSyncing || !range || !macdChartRef.current) return;
      try {
        isSyncing = true;
        macdChartRef.current.timeScale().setVisibleRange(range);
      } catch (e) {
        // 忽略同步错误
      } finally {
        isSyncing = false;
      }
    };

    // MACD图滚动时同步主图
    const macdRangeHandler = (range: any) => {
      if (isSyncing || !range || !mainChartRef.current) return;
      try {
        isSyncing = true;
        mainChartRef.current.timeScale().setVisibleRange(range);
      } catch (e) {
        // 忽略同步错误
      } finally {
        isSyncing = false;
      }
    };

    mainChart.timeScale().subscribeVisibleTimeRangeChange(mainRangeHandler);
    macdChart.timeScale().subscribeVisibleTimeRangeChange(macdRangeHandler);

    // 十字光标同步 - 让两个图表的时间轴同步
    let isCrosshairSyncing = false;
    const crosshairHandler = (param: any) => {
      // 获取当前光标位置的值
      if (param.time) {
        const timeStr = String(param.time);
        const item = dataWithMARef.current.find(d => d.date === timeStr);
        if (item) {
          setCurrentValues({
            ma5: item.ma5,
            ma10: item.ma10,
            ma20: item.ma20,
            ma60: item.ma60,
            macd_hist: item.macd_hist,
            macd_diff: item.macd_diff,
            macd_dea: item.macd_dea,
          });
        }
      } else {
        setCurrentValues({});
      }

      if (isCrosshairSyncing) return;
      if (!param.time) return;

      const time = param.time;
      try {
        isCrosshairSyncing = true;
        // 同步另一个图表的十字光标位置
        if (param.chart === mainChart && macdChartRef.current) {
          macdChartRef.current.timeScale().setVisibleRange({
            from: time as any,
            to: time as any,
          } as any);
        } else if (param.chart === macdChart && mainChartRef.current) {
          mainChartRef.current.timeScale().setVisibleRange({
            from: time as any,
            to: time as any,
          } as any);
        }
      } catch (e) {
        // 忽略同步错误
      } finally {
        isCrosshairSyncing = false;
      }
    };

    mainChart.subscribeCrosshairMove(crosshairHandler);
    macdChart.subscribeCrosshairMove(crosshairHandler);

    // 处理窗口大小变化
    const handleResize = () => {
      if (mainChartContainerRef.current && mainChartRef.current) {
        mainChartRef.current.applyOptions({
          width: mainChartContainerRef.current.clientWidth,
        });
      }
      if (macdChartContainerRef.current && macdChartRef.current) {
        macdChartRef.current.applyOptions({
          width: macdChartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mainChart.timeScale().unsubscribeVisibleTimeRangeChange(mainRangeHandler);
      macdChart.timeScale().unsubscribeVisibleTimeRangeChange(macdRangeHandler);
      mainChart.unsubscribeCrosshairMove(crosshairHandler);
      macdChart.unsubscribeCrosshairMove(crosshairHandler);
      mainChart.remove();
      macdChart.remove();
    };
  }, []);

  // 更新数据
  useEffect(() => {
    if (!candlestickSeriesRef.current || !histogramSeriesRef.current ||
        !lineDiffSeriesRef.current || !lineDeaSeriesRef.current ||
        !ma5SeriesRef.current || !ma10SeriesRef.current ||
        !ma20SeriesRef.current || !ma60SeriesRef.current || !data.length) return;

    // 计算均线
    let dataWithMA = [...data];
    dataWithMA = calculateMA(dataWithMA, 5);
    dataWithMA = calculateMA(dataWithMA, 10);
    dataWithMA = calculateMA(dataWithMA, 20);
    dataWithMA = calculateMA(dataWithMA, 60);

    // 存储计算均线后的数据，供光标事件使用
    dataWithMARef.current = dataWithMA;

    // K线数据
    const candleData: CandlestickData<Time>[] = dataWithMA.map(item => ({
      time: item.date as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    // MACD柱状图数据
    const macdData: HistogramData<Time>[] = dataWithMA.map(item => ({
      time: item.date as Time,
      value: item.macd_hist || 0,
      color: (item.macd_hist || 0) >= 0 ? '#e74c3c' : '#2ecc71',
    }));

    // DIF线数据
    const diffData: LineData<Time>[] = dataWithMA
      .filter(item => item.macd_diff !== undefined && item.macd_diff !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.macd_diff!,
      }));

    // DEA线数据
    const deaData: LineData<Time>[] = dataWithMA
      .filter(item => item.macd_dea !== undefined && item.macd_dea !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.macd_dea!,
      }));

    // MA5数据
    const ma5Data: LineData<Time>[] = dataWithMA
      .filter(item => item.ma5 !== undefined && item.ma5 !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.ma5!,
      }));

    // MA10数据
    const ma10Data: LineData<Time>[] = dataWithMA
      .filter(item => item.ma10 !== undefined && item.ma10 !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.ma10!,
      }));

    // MA20数据
    const ma20Data: LineData<Time>[] = dataWithMA
      .filter(item => item.ma20 !== undefined && item.ma20 !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.ma20!,
      }));

    // MA60数据
    const ma60Data: LineData<Time>[] = dataWithMA
      .filter(item => item.ma60 !== undefined && item.ma60 !== null)
      .map(item => ({
        time: item.date as Time,
        value: item.ma60!,
      }));

    candlestickSeriesRef.current.setData(candleData);
    histogramSeriesRef.current.setData(macdData);
    lineDiffSeriesRef.current.setData(diffData);
    lineDeaSeriesRef.current.setData(deaData);
    ma5SeriesRef.current.setData(ma5Data);
    ma10SeriesRef.current.setData(ma10Data);
    ma20SeriesRef.current.setData(ma20Data);
    ma60SeriesRef.current.setData(ma60Data);

    // 设置买卖信号标记
    if (tradeRecords && tradeRecords.length > 0 && candlestickSeriesRef.current) {
      const markers: SeriesMarker<Time>[] = tradeRecords
        .filter(r => r.bar_time)
        .map(r => {
          const isBuy = r.action === 'build' || r.action === 'buy';
          const isClose = r.action === 'close';
          let color: string;
          if (isBuy) {
            color = '#e74c3c'; // 红色 - 买入
          } else if (isClose) {
            color = '#1890ff'; // 蓝色 - 平仓
          } else {
            color = '#2ecc71'; // 绿色 - 卖出
          }
          return {
            time: r.bar_time as Time,
            position: isBuy ? 'belowBar' as const : 'aboveBar' as const,
            color,
            shape: isBuy ? 'arrowUp' as const : 'arrowDown' as const,
            text: r.label,
          };
        })
        .sort((a, b) => (a.time as string).localeCompare(b.time as string));

      // 清除旧的标记插件
      if (markersPluginRef.current) {
        markersPluginRef.current.detach();
      }
      markersPluginRef.current = createSeriesMarkers(candlestickSeriesRef.current, markers);
    } else {
      // 无交易记录时清除标记
      if (markersPluginRef.current) {
        markersPluginRef.current.setMarkers([]);
      }
    }

    // 调整时间范围以适应数据（只对主图操作，MACD图会自动联动）
    if (mainChartRef.current) {
      mainChartRef.current.timeScale().fitContent();
    }
  }, [data, tradeRecords]);

  if (!data.length) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: MAIN_CHART_HEIGHT + MACD_CHART_HEIGHT,
        color: '#999',
        background: '#f9f9f9',
        borderRadius: 4
      }}>
        暂无K线数据
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#ddd' }}>
        <div style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: '2px 0', background: '#fff' }}>
          {currentValues.ma5 !== undefined ? (
            <>
              <span style={{ color: '#FFA500' }}>MA5:{currentValues.ma5?.toFixed(2)}</span>{' '}
              <span style={{ color: '#9932cc' }}>MA10:{currentValues.ma10?.toFixed(2)}</span>{' '}
              <span style={{ color: '#0000ff' }}>MA20:{currentValues.ma20?.toFixed(2)}</span>{' '}
              <span style={{ color: '#00ced1' }}>MA60:{currentValues.ma60?.toFixed(2)}</span>
            </>
          ) : (
            'MA5(橙) MA10(紫) MA20(蓝) MA60(青)'
          )}
        </div>
        <div
          ref={mainChartContainerRef}
          style={{ width: '100%', height: MAIN_CHART_HEIGHT }}
        />
        <div
          ref={macdChartContainerRef}
          style={{ width: '100%', height: MACD_CHART_HEIGHT }}
        />
        <div style={{ fontSize: 11, color: '#666', textAlign: 'center', padding: '2px 0', background: '#fff' }}>
          {currentValues.macd_hist !== undefined ? (
            <>
              <span>MACD:{currentValues.macd_hist?.toFixed(2)}</span>{' '}
              <span style={{ color: '#ff4500' }}>DIF:{currentValues.macd_diff?.toFixed(2)}</span>{' '}
              <span style={{ color: '#4169e1' }}>DEA:{currentValues.macd_dea?.toFixed(2)}</span>
            </>
          ) : (
            'MACD: DIF(橙) DEA(蓝)'
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;
