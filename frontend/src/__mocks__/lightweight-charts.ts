/**
 * lightweight-charts 全模块 mock
 *
 * 为 Jest 测试环境提供 lightweight-charts 的完整 mock,
 * 避免 jsdom 中 canvas 不可用导致的测试失败.
 */

const createSeriesMock = () => ({
  setData: jest.fn(),
  setMarkers: jest.fn(),
  update: jest.fn(),
  applyOptions: jest.fn(),
  priceScale: jest.fn().mockReturnValue({
    applyOptions: jest.fn(),
  }),
  coordinateToPrice: jest.fn(),
  priceToCoordinate: jest.fn(),
});

const createTimeScaleMock = () => ({
  setVisibleRange: jest.fn(),
  fitContent: jest.fn(),
  getVisibleRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  scrollToPosition: jest.fn(),
  applyOptions: jest.fn(),
  setVisibleLogicalRange: jest.fn(),
  getVisibleLogicalRange: jest.fn(),
});

export const createChart = jest.fn(() => ({
  addCandlestickSeries: jest.fn(() => createSeriesMock()),
  addHistogramSeries: jest.fn(() => createSeriesMock()),
  addLineSeries: jest.fn(() => createSeriesMock()),
  addAreaSeries: jest.fn(() => createSeriesMock()),
  addBaselineSeries: jest.fn(() => createSeriesMock()),
  timeScale: jest.fn(() => createTimeScaleMock()),
  priceScale: jest.fn(() => ({
    applyOptions: jest.fn(),
  })),
  subscribeCrosshairMove: jest.fn(),
  subscribeVisibleTimeRangeChange: jest.fn(),
  unsubscribeCrosshairMove: jest.fn(),
  unsubscribeVisibleTimeRangeChange: jest.fn(),
  remove: jest.fn(),
  resize: jest.fn(),
  applyOptions: jest.fn(),
}));

export const CrosshairMode = {
  Normal: 0,
  Magnet: 1,
};

export const LineStyle = {
  Solid: 0,
  Dotted: 1,
  Dashed: 2,
  LargeDashed: 3,
  SparseDotted: 4,
};

export const PriceScaleMode = {
  Normal: 0,
  Logarithmic: 1,
  Percentage: 2,
  IndexedTo100: 3,
};
