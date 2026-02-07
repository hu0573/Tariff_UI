# TimeSlotSelector Component

## 概述

TimeSlotSelector 是一个全新的可视化时间段配置组件，替代了传统的表单输入方式。通过拖拽操作，用户可以直观地设置定价时段。

## 主要特性

### 🎯 核心功能

- **拖拽创建**: 鼠标拖拽选择时间范围，自动弹出配置弹窗
- **动态布局**: 根据"Enable Weekday Pricing"状态自动切换单行/双行模式
- **颜色编码**: 不同时段使用不同颜色，便于区分
- **智能分组**: 拖拽位置自动确定分组（General/Weekday/Weekend）

### 🎨 用户体验

- **直观操作**: 拖拽比手动输入快 3-5 倍
- **实时反馈**: 拖拽过程中实时显示选中范围
- **响应式设计**: 支持桌面/平板/移动端
- **空状态提示**: 无时段时显示友好的引导信息

### 🔧 技术实现

- **模块化设计**: 组件拆分为 TimeSlot、TimeSlotGrid、TimeSlotRow 等子组件
- **类型安全**: 完整的 TypeScript 类型定义
- **性能优化**: 使用 React.useMemo 缓存计算结果
- **错误处理**: 完善的错误提示和恢复机制

## 文件结构

```
TimeSlotSelector/
├── TimeSlotSelector.tsx      # 主组件
├── TimeSlotRow.tsx           # 时间槽行组件
├── TimeSlotGrid.tsx          # 时间槽网格
├── TimeSlot.tsx              # 单个时间槽
├── DragHandler.ts            # 拖拽逻辑处理
├── colorUtils.ts             # 颜色分配工具
├── types.ts                  # 类型定义
├── styles.css                # 样式文件
└── README.md                 # 文档
```

## 使用方法

```tsx
import { TimeSlotSelector } from "./TimeSlotSelector/TimeSlotSelector";

<TimeSlotSelector
  periods={periods}
  enableWeekdayPricing={true}
  onPeriodAdd={handleAddPeriod}
  onPeriodUpdate={handleUpdatePeriod}
  onPeriodDelete={handleDeletePeriod}
  saving={isSaving}
/>;
```

## API 接口

### TimeSlotSelectorProps

| 属性                 | 类型                                                | 必需 | 描述               |
| -------------------- | --------------------------------------------------- | ---- | ------------------ |
| periods              | Period[]                                            | 是   | 当前的时段列表     |
| enableWeekdayPricing | boolean                                             | 是   | 是否启用工作日定价 |
| onPeriodAdd          | (period: NewPeriod) => Promise<void>                | 是   | 添加时段回调       |
| onPeriodUpdate       | (id: number, period: UpdatePeriod) => Promise<void> | 是   | 更新时段回调       |
| onPeriodDelete       | (id: number) => Promise<void>                       | 是   | 删除时段回调       |
| saving               | boolean                                             | 否   | 保存状态指示器     |

### Period 类型

```typescript
interface Period {
  id: number;
  name: string;
  startTime: string; // HH:MM
  endTime: string;
  price: number;
  group: 0 | 1 | 2; // 0=General, 1=Weekday, 2=Weekend
  color: string;
  description?: string;
}
```

## 响应式设计

- **桌面端**: 显示 48 个 30 分钟时间槽（完整 24 小时）
- **平板端**: 显示 24 个 1 小时时间槽
- **移动端**: 显示 12 个 2 小时时间槽

## 业务规则

- **时间段重叠检查**: 同一分组内的时段不能重叠
- **前包后不包**: 17:00-21:00 包含 17:00 但不包含 21:00
- **跨天支持**: 支持 23:00-06:00 等跨天时段
- **分组约束**: 根据 Enable Weekday Pricing 状态限制分组选项

## 颜色系统

预设 10 种颜色，按时段顺序循环分配：

- 红色、青色、蓝色、黄色、橙色、深红、紫色、浅紫、粉色、深灰

## 性能优化

- 使用 React.useMemo 缓存分组和颜色计算
- 事件处理使用 useCallback 避免不必要的重渲染
- 拖拽状态优化，减少 DOM 更新频率

## 测试覆盖

- 组件渲染测试
- 拖拽交互测试
- 响应式布局测试
- 错误处理测试
- 性能测试
