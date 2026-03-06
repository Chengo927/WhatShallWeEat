# WhatShallWeEat 项目上下文（给 Agent 快速加载）

最后更新：2026-03-05

## 1) 项目是做什么的
- 这是一个微信小程序，用于解决“今天吃什么”决策问题。
- 用户可以按日期选菜、维护候选池（“容我想想”）、用抽奖从候选池随机选菜，并写入当天菜单。

## 2) 技术与约束
- 技术栈：微信小程序原生（WXML / WXSS / JS）。
- 组件框架：`glass-easel`。
- 数据存储：本地存储 `wx.getStorageSync / wx.setStorageSync`（无后端）。
- 当前主页面：`pages/order/index`（`app.json` 只注册了这一页）。
- 当前 `pages/order/index.json` 使用 `renderer: "webview"`（不是 skyline）。

## 3) 目录速览（核心）
- `pages/order/index.*`：主业务页面（筛选、点菜、候选池、抽奖、日历、弹窗）。
- `components/dish-card/*`：菜品卡片（加入/取消、候选切换）。
- `components/category-chips/*`：分类筛选。
- `components/search-bar/*`：搜索输入。
- `components/calendar-popup/*`：日期弹窗与标记渲染。
- `utils/storage.js`：核心数据模型、读写、迁移、去重、日历标记同步。
- `utils/lottery.js`：抽奖算法（无放回抽样）。
- `data/dishes.js`：静态分类与菜品数据源。

## 4) 已实现功能清单
1. 分类筛选与关键词搜索（按 `name + desc` 过滤）。
2. 加入/取消“今日菜单”。
3. 菜品加入/取消“容我想想”（候选池）。
4. “查看已选”菜单弹窗。
5. 抽奖弹窗：设置抽取数量、开始抽奖、再抽、确认写入。
6. 日历弹窗：切换年月、选择日期。
7. 日历 emoji 标记：按当日菜单生成标记，超出显示 `+N`。
8. 存储兼容迁移：兼容旧 key，迁移至按日期 key 与 THINK_POOL。

## 5) 关键流程（简版）
1. 页面初始化
- 计算状态栏高度，确定默认日期（今天），拉取该日期菜单/候选池/日历标记，生成可见菜品列表。

2. 点菜
- 点击“加入”调用 `addDishToDate(date, dishId)`。
- 若成功加入，会从候选池移除该菜（避免重复语义）。

3. 候选池
- 点击“容我想想”调用 `togglePendingDishToDate(date, dishId, dish)`。
- 候选池是全局池（`THINK_POOL`），并同步兼容旧的 pending map。

4. 抽奖
- 仅从 `THINK_POOL` 抽取。
- “开始/再抽”只生成预览结果，不落库。
- 点击“确定”才调用 `confirmLotteryResult(date, pendingResult)` 写入当天菜单。

5. 日历
- `calendar-popup` 接收 `marks`（`date -> emoji[]`）渲染每个日期下方标记。
- 选中日期后主页面切换 `today` 并重新同步菜单状态。

## 6) 本地存储模型（当前）
- `THINK_POOL`：`DishItem[]`，全局候选池。
- `TODAY_MENU_YYYY-MM-DD`：`DishItem[]`，某天菜单（新结构）。
- `LAST_LOTTERY_RESULT_YYYY-MM-DD`：`DishItem[]`，某天最近一次确认的抽奖结果。
- `meal_calendar_marks_v1`：`{ [date]: string[] }`，日历 emoji 标记。
- `MEAL_PLAN_BY_DATE`：`{ [date]: dishId[] }`，旧结构（兼容）。
- `MEAL_PENDING_BY_DATE`：`{ [date]: dishId[] }`，旧结构（兼容）。

`DishItem` 规范：
- `{ id: string, name: string, emoji: string }`

## 7) 组件事件契约（给 Agent 快速对接）
- `dish-card`
  - 输入：`dish`, `disabled`, `pending`, `actionText` 等。
  - 事件：
    - `action` -> `{ dishId, added, dish }`
    - `pendingaction` -> `{ dishId, pending, dish }`

- `category-chips`
  - 输入：`categories`, `selected`, `vertical`
  - 事件：`change` -> `{ value }`

- `search-bar`
  - 输入：`value`, `placeholder`
  - 事件：`change` -> `{ value }`

- `calendar-popup`
  - 输入：`visible`, `value`, `marks`, `yearSpan`
  - 事件：`confirm` -> `{ date }`，`change` -> `{ date }`，`close`

## 8) 当前注意点（后续改动请先看）
1. 主页面已使用自定义导航风格，但目前 renderer 仍是 `webview`。
2. `pages/index` 与 `navigation-bar` 是模板/备用结构，未在 `app.json` 启用。
3. 抽奖确认有保护：若抽奖后修改了数量（`selectedK !== lotteryCount`）会要求重抽。

## 9) 维护规则（强制）
每次代码改动后，必须更新本文件，至少包含：
1. 涉及功能章节（若行为变更）。
2. 下方“变更日志”新增一条记录。
3. 记录要能让下一个 Agent 在低 token 下快速理解“改了什么、为什么、怎么验证”。

建议日志格式：
- 日期：
- 目标：
- 改动文件：
- 行为变化：
- 验证步骤：
- 风险与回滚点：

## 10) 变更日志
- 日期：2026-03-05
- 目标：建立项目上下文文档，沉淀当前功能与实现，便于后续 Agent 低 token 接力。
- 改动文件：`docs/PROJECT_CONTEXT.md`
- 行为变化：无运行时行为变化（仅文档）。
- 验证步骤：打开文档检查“功能清单/流程/存储模型/维护规则”是否完整。
- 风险与回滚点：无代码风险；如信息过期，后续按真实改动更新即可。
