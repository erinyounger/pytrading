# xTrading 前端开发文档

## 项目概述

xTrading 是一个专业级量化交易桌面应用，采用现代化技术栈构建，提供完整的交易策略开发、回测和实盘交易解决方案。

## 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **构建工具**: Vite 5
- **样式**: Tailwind CSS + 自定义CSS变量
- **图表**: Recharts
- **图标**: Lucide React
- **桌面框架**: Tauri 2
- **状态管理**: Zustand (计划中)

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── common/        # 通用组件
│   │   ├── MetricCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── ChartContainer.tsx
│   │   └── StatusTag.tsx
│   └── layout/        # 布局组件
│       ├── Layout.tsx
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/             # 页面组件
│   └── Dashboard.tsx
├── styles/            # 样式文件
│   └── globals.css
├── types/             # TypeScript类型定义
│   └── index.ts
├── utils/             # 工具函数
│   └── cn.ts
├── App.tsx            # 主应用组件
└── main.tsx           # 应用入口
```

## 设计系统

### 主题颜色

采用深色主题为主的设计系统，使用CSS变量实现主题切换：

```css
/* 主要颜色 */
--bg-primary: #0a0e1a      /* 主背景 */
--bg-secondary: #131826    /* 次级背景 */
--bg-tertiary: #1a1f36     /* 三级背景 */

/* 功能色 */
--success: #00d084          /* 成功/上涨 */
--error: #ff4757           /* 错误/下跌 */
--brand-primary: #4f46e5   /* 品牌主色 */
```

### 字体系统

- **中文字体**: PingFang SC, Microsoft YaHei
- **英文字体**: Inter (主), Space Grotesk (标题)
- **代码字体**: JetBrains Mono

## 核心组件

### MetricCard
指标卡片组件，用于展示关键指标数据。

```tsx
<MetricCard
  title="总资产"
  value="¥1,234,567"
  change="+2.45%"
  changeType="positive"
  icon={<DollarSign className="w-5 h-5" />}
  trend="up"
/>
```

### DataTable
数据表格组件，支持排序、分页等功能。

```tsx
<DataTable
  columns={columns}
  data={data}
  pagination={true}
  onSort={handleSort}
  onRowClick={handleRowClick}
/>
```

### ChartContainer
图表容器组件，提供统一的图表展示框架。

```tsx
<ChartContainer
  title="收益曲线"
  subtitle="过去30天收益走势"
  loading={false}
  actions={<TimeRangeSelector />}
>
  <ResponsiveContainer>
    <AreaChart data={data}>
      <Area />
    </AreaChart>
  </ResponsiveContainer>
</ChartContainer>
```

## 页面组件

### Dashboard
仪表板页面，展示整体交易概览：
- 关键指标卡片
- 收益曲线图表
- 持仓分布饼图
- 最近交易记录
- 快速操作按钮

### 其他页面 (待开发)
- 实时行情 (Market)
- 回测管理 (Backtest)
- 策略管理 (Strategy)
- 交易信号 (Signal)
- 风险管理 (Risk)
- 性能报告 (Report)

## 开发指南

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

### 构建

```bash
npm run build
# 或
yarn build
```

### Tauri 开发

```bash
npm run tauri dev
# 或
yarn tauri dev
```

## 样式规范

### CSS 变量
所有颜色、间距、圆角等使用CSS变量统一管理，定义在 `globals.css` 中：

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  /* ... */
}
```

### 动画
使用统一的动画规范：

```css
/* 淡入动画 */
.animate-fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}

/* 数字滚动 */
.animate-number-roll {
  animation: numberRoll 0.5s ease-out;
}
```

## 最佳实践

### 1. 组件设计
- 保持组件单一职责
- 使用 TypeScript 严格类型检查
- 合理使用 memo 优化性能

### 2. 状态管理
- 局部状态使用 useState
- 全局状态使用 Zustand (待实现)
- 服务端状态使用 React Query (待实现)

### 3. 样式管理
- 优先使用 Tailwind 工具类
- 自定义样式使用 CSS 变量
- 避免内联样式

### 4. 性能优化
- 路由级代码分割
- 组件懒加载
- 图片懒加载
- 虚拟滚动 (大数据列表)

## 响应式设计

支持三个断点：

```css
/* 移动端 */
@media (max-width: 768px) { }

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) { }

/* 桌面端 */
@media (min-width: 1025px) { }
```

## 可访问性

遵循 WCAG 2.1 AA 标准：

- 键盘导航支持
- 屏幕阅读器友好
- 适当的 ARIA 标签
- 颜色对比度达标

## 部署指南

### 构建产物
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── vite.svg
```

### 桌面应用
使用 Tauri 构建原生桌面应用：

```bash
npm run tauri build
```

## 待办事项

- [ ] 实现 Zustand 状态管理
- [ ] 添加 React Query 数据获取
- [ ] 实现 WebSocket 实时数据
- [ ] 完成所有页面开发
- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 性能优化
- [ ] 文档完善

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 创建 Pull Request

## 许可证

MIT License
