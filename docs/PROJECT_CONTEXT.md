# WhatShallWeEat 项目上下文（给 Agent 快速加载）

最后更新：2026-03-06

## 1) 项目是做什么的
- 这是一个微信小程序，用于解决“今天吃什么”决策问题。
- 用户可以按日期选菜、维护候选池（“容我想想”）、用抽奖从候选池随机选菜，并写入当天菜单。

## 2) 技术与约束
- 技术栈：微信小程序原生（WXML / WXSS / JS）。
- 组件框架：`glass-easel`。
- 数据存储：本地存储 `wx.getStorageSync / wx.setStorageSync`（无后端）。
- 当前主页面：`pages/order/index`（`app.json` 只注册了这一页）。
- 当前 `pages/order/index.json` 使用 `renderer: "skyline"` + `componentFramework: "glass-easel"`。

## 3) 目录速览（核心）
- `pages/order/index.*`：主业务页面（筛选、点菜、候选池、抽奖、日历、弹窗）。
- `pages/calendar/index.*`：Tab 页“日历”占位页（Skyline）。
- `pages/mine/index.*`：Tab 页“我的”占位页（Skyline）。
- `custom-tab-bar/*`：官方 `tabBar.custom` 底部导航（菜单/日历/我的）。
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
9. 菜品列表/已选列表/抽奖结果统一使用菜品缩略图展示（本地图片映射 + placeholder 兜底）。
10. 全局底部 Tab 导航（官方 tabBar + 自定义 UI）：支持菜单/日历/我的切换与选中态同步。

## 5) 关键流程（简版）
1. 页面初始化
- 通过 `wx.getSystemInfoSync + wx.getMenuButtonBoundingClientRect` 计算 `navBarHeight` 与胶囊避让宽度，生成菜单页自定义头部布局参数。
- 确定默认日期（今天），拉取该日期菜单/候选池/日历标记，生成可见菜品列表。

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
- `{ id: string, name: string, emoji?: string, img?: string }`
- 说明：当前采用渲染前补齐策略，storage 里旧数据无 `img` 也可通过 `id -> /assets/dishes/<id>.png` 映射显示。

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
1. 主页面已使用 Skyline（`renderer: skyline`），`order` 页 WXSS 应保持 class 选择器，避免 Skyline 选择器告警。
2. `pages/index` 与 `navigation-bar` 是模板/备用结构，未在 `app.json` 启用。
3. 抽奖确认有保护：若抽奖后修改了数量（`selectedK !== lotteryCount`）会要求重抽。
4. 菜品图片默认按 `id` 读取 `/assets/dishes/<id>.png`，加载失败后按 `dishId` 记录回退并统一显示 `/assets/dishes/placeholder.png`。

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
- 日期：2026-03-06
- 目标：新增底部固定导航栏（菜单/日历/我的），并适配菜单页底部避让。
- 改动文件：`app.json`、`custom-tab-bar/index.json`、`custom-tab-bar/index.js`、`custom-tab-bar/index.wxml`、`custom-tab-bar/index.wxss`、`pages/calendar/index.json`、`pages/calendar/index.js`、`pages/calendar/index.wxml`、`pages/calendar/index.wxss`、`pages/mine/index.json`、`pages/mine/index.js`、`pages/mine/index.wxml`、`pages/mine/index.wxss`、`pages/order/index.js`、`pages/order/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - `app.json` 启用官方 `tabBar.custom`，新增 3 个 Tab 页面路由配置。
  - 新增 `custom-tab-bar`：三等分按钮、选中态高亮、点击通过 `wx.switchTab` 切换，含底部安全区处理。
  - 新增 `calendar` 与 `mine` Skyline 占位页，并在 `onShow` 同步 tab 选中态。
  - 菜单页底部操作条与弹窗整体上提到 tabBar 之上，内容区底部 padding 增加，避免底部遮挡。
- 验证步骤：
  - 打开小程序，确认底部固定 3 个 Tab：菜单/日历/我的。
  - 依次点击 3 个 Tab，确认页面可切换、无白屏，当前 Tab 高亮正确。
  - 在菜单页滚动到底部，确认列表内容与底部按钮不被 tabBar 遮挡。
  - 在 iOS/Android 真机检查 home indicator 安全区与点击区域正常。
- 风险与回滚点：
  - 底部偏移值为经验常量，若个别机型视觉间距过大/过小，可调整 `pages/order/index.wxss` 的底部 `calc(...)` 常量。
- 日期：2026-03-06
- 目标：菜单页标题与系统胶囊按钮纵向对齐，并整体上移搜索/列表区域（Skyline）。
- 改动文件：`pages/order/index.js`、`pages/order/index.wxml`、`pages/order/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜单页顶部改为自定义 header：左侧标题、右侧胶囊占位（宽度动态取 `screenWidth - menuRect.left`），避免标题被系统胶囊覆盖。
  - 使用动态导航参数（`navBarHeight/menuButtonTop/menuButtonHeight`）控制标题行与胶囊同一视觉水平线。
  - 清理原先顶部占位 + 大间距写死样式，日期行、搜索框、分类与列表整体上移。
- 验证步骤：
  - 打开【菜单】Tab，确认“今天吃什么呢？”与右上角胶囊按钮处于同一行（垂直中心基本平齐）。
  - 检查顶部无被遮挡：标题不压状态栏/胶囊，搜索框和列表不被 header 覆盖。
  - 上下滚动列表、切换到其他 Tab 再返回，确认布局不抖动、不会二次偏移。
  - 分别在 iOS/Android 真机检查无胶囊遮挡与点击错位。
- 风险与回滚点：
  - 若极端机型返回异常胶囊尺寸，顶部可能出现轻微误差；可回滚到本次变更前的 `page-head-main + status-placeholder` 结构。
- 日期：2026-03-05
- 目标：将菜品列表左侧“绿底 + emoji”替换为菜品照片缩略图，并补齐无图兜底逻辑（Skyline）。
- 改动文件：`pages/order/index.js`、`pages/order/index.wxml`、`pages/order/index.wxss`、`pages/order/index.json`、`components/dish-card/dish-card.wxml`、`components/dish-card/dish-card.wxss`、`components/dish-card/dish-card.js`、`assets/dishes/*`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 列表卡片改为固定尺寸 `aspectFill` 缩略图，去除原绿色底块与 emoji 主展示。
  - “查看已选”与“抽奖结果”中的菜品项也改为缩略图 + 名称。
  - 新增本地图片映射 `id -> /assets/dishes/<id>.png`，并通过 `binderror` 将失败项回退到 placeholder，避免破图与布局抖动。
  - `pages/order/index` renderer 从 `webview` 切换到 `skyline`，并移除该页 tag 选择器用法。
- 验证步骤：
  - 进入点菜列表，确认每行左侧显示缩略图且行高稳定。
  - 进入“查看已选”，确认列表缩略图正常。
  - 进入抽奖弹窗并执行一次抽奖，确认结果列表缩略图正常。
  - 临时改错某个图片路径后触发加载失败，确认回退 placeholder 且不出现破图占位符。
- 风险与回滚点：
  - 新增了本地图片资源，包体积增加；如需快速回滚，可先回退 `assets/dishes/*` 与 `img` 显示逻辑为 emoji。
- 日期：2026-03-05
- 目标：建立项目上下文文档，沉淀当前功能与实现，便于后续 Agent 低 token 接力。
- 改动文件：`docs/PROJECT_CONTEXT.md`
- 行为变化：无运行时行为变化（仅文档）。
- 验证步骤：打开文档检查“功能清单/流程/存储模型/维护规则”是否完整。
- 风险与回滚点：无代码风险；如信息过期，后续按真实改动更新即可。
