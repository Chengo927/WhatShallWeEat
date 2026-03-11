# WhatShallWeEat 项目上下文（给 Agent 快速加载）

最后更新：2026-03-11

## 1) 项目是做什么的
- 这是一个微信小程序，用于解决“今天吃什么”决策问题。
- 用户可以按日期选菜、维护候选池（“容我想想”）、用抽奖从候选池随机选菜，并写入当天菜单。

## 2) 技术与约束
- 技术栈：微信小程序原生（WXML / WXSS / JS）。
- 技术实现以微信小程序原生能力为主。
- 数据存储：本地存储 `wx.getStorageSync / wx.setStorageSync`（无后端）。
- 当前页面结构：`pages/order/index`、`pages/calendar/index`、`pages/mine/index`（通过 tabBar 切换）。
- 当前主页面仍保留 `renderer: "skyline"` + `componentFramework: "glass-easel"` + `navigationStyle: "custom"` 配置，但项目目标已改为“稳定优先”，不再把 Skyline 作为专项目标。

## 3) 目录速览（核心）
- `pages/order/index.*`：主业务页面（筛选、点菜、候选池、抽奖、弹窗）。
- `pages/calendar/index.*`：Tab 页“日历”页面。
- `pages/mine/index.*`：Tab 页“我的”页面。
- `custom-tab-bar/*`：官方 `tabBar.custom` 底部导航（菜单/日历/我的）。
- `components/meal-calendar/*`：内嵌式日历组件（年月切换、日期选择、marker 展示）。
- `components/dish-card/*`：菜品卡片（加入/取消、候选切换）。
- `components/category-chips/*`：分类筛选。
- `components/search-bar/*`：搜索输入。
- `components/calendar-popup/*`：日期弹窗与标记渲染。
- `utils/storage.js`：核心数据模型、读写、迁移、去重、日历标记同步。
- `utils/lottery.js`：抽奖算法（无放回抽样）。
- `data/dishes.js`：静态分类与菜品数据（标准字段：`dishId/name/categoryId/emoji/img/imgFileId/xhsLink`，兼容 `id/category` 别名）。
- `pages/dish-link/index.*`：菜品做法链接页（有链接时直出 `web-view`，无链接时显示空状态）。

## 4) 已实现功能清单
1. 分类筛选与关键词搜索（按 `name + desc` 过滤）；当前静态分类包含鸡肉、牛肉、猪肉、鸭肉、鱼肉、虾类、蔬菜、特殊。
2. 加入/取消“今日菜单”。
3. 菜品加入/取消“容我想想”（候选池）。
4. “查看已选”菜单弹窗。
5. 抽奖弹窗：设置抽取数量、开始抽奖、再抽、确认写入。
6. 日历 Tab（内嵌日历）：切换年月、选择日期、查看并编辑当日菜品，支持补录添加。
7. 日历 emoji 标记：按当日菜单生成标记，超出显示 `+N`。
8. 存储兼容迁移：兼容旧 key，迁移至按日期 key 与 THINK_POOL。
9. 菜品列表/已选列表/抽奖结果统一使用菜品缩略图展示（本地图片映射 + placeholder 兜底）。
10. 全局底部 Tab 导航（官方 tabBar + 自定义 UI）：支持菜单/日历/我的切换与选中态同步，当前文案显示在上方圆形区域内（无下方独立文字行）。
11. 日历能力已迁移到“日历 Tab”主页面承载，菜单页不再提供日历入口/弹层。
12. 菜品链接页：点击菜品可进入对应链接页；标准链接字段为 `xhsLink`，旧 `link / url / recipeUrl / recipeLink` 仅作兼容读取。
## 5) 关键流程（简版）
1. 页面初始化
- 通过 `wx.getWindowInfo + wx.getMenuButtonBoundingClientRect` 计算 `navBarHeight` 与胶囊避让宽度，生成菜单页自定义头部布局参数。
- 菜单页默认使用当天日期，拉取该日期菜单/候选池并生成可见菜品列表；日历标记由日历 Tab 读取。

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
- `meal-calendar` 接收 `marks`（`date -> emoji[]`）渲染每个日期下方标记。
- 选中日期后日历页刷新该日期菜单摘要；菜单页不再承载日期切换入口。
- 日历摘要区展示“当前菜品 X 道”，右侧提供“添加”与“编辑/完成”。
- “添加”面板展示全部菜品（同菜单页“全部”数据源），可将漏选菜品补录到当前日期。
- 编辑态支持移除该日期菜品。

## 6) 本地存储模型（当前）
- `THINK_POOL`：`DishItem[]`，全局候选池。
- `TODAY_MENU_YYYY-MM-DD`：`DishItem[]`，某天菜单（新结构）。
- `LAST_LOTTERY_RESULT_YYYY-MM-DD`：`DishItem[]`，某天最近一次确认的抽奖结果。
- `meal_calendar_marks_v1`：`{ [date]: string[] }`，日历 emoji 标记。
- `MEAL_PLAN_BY_DATE`：`{ [date]: dishId[] }`，旧结构（兼容）。
- `MEAL_PENDING_BY_DATE`：`{ [date]: dishId[] }`，旧结构（兼容）。

`DishItem` 规范：
- 标准字段：`{ dishId: string, name: string, categoryId: string, emoji?: string, img?: string, imgFileId?: string, xhsLink?: string }`
- 兼容字段：运行时继续保留 `id` 作为 `dishId` 别名，便于旧页面、旧 storage、旧事件契约继续工作。
- 说明：本地标准化会把历史上的 `link / url / recipeUrl / recipeLink` 统一归并为 `xhsLink`；旧数据缺图时仍可按 `id -> /assets/dishes/<id>.png` 回退显示。

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

- `meal-calendar`
  - 输入：`value`, `marks`, `yearSpan`
  - 事件：`confirm` -> `{ date }`，`change` -> `{ date }`

## 8) 当前注意点（后续改动请先看）
1. 当前主页面仍保留 Skyline 配置，但后续改动以稳定和体验优先；除非明确需要，不要为了追 `renderer` 做专项改造。`order` 页 WXSS 仍建议保持 class 选择器，减少不同渲染层下的兼容风险。
2. `pages/index` 与 `navigation-bar` 是模板/备用结构，未在 `app.json` 启用。
3. 抽奖确认有保护：若抽奖后修改了数量（`selectedK !== lotteryCount`）会要求重抽。
4. 菜品种子数据优先直接提供 `img`；旧数据或缺图场景仍按 `id -> /assets/dishes/<id>.png` 回退，最终统一兜底到 `/assets/dishes/placeholder.png`。

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
- 日期：2026-03-11
- 目标：修复误注册 Demo 样例页导致的小程序编译失败。
- 改动文件：`app.json`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 从 `app.json` 的 `pages` 中移除了 `Demo/list`。
  - `Demo` 目录继续保留为样例数据/素材目录，不再参与正式页面编译。
- 验证步骤：
  - 在微信开发者工具重新编译，确认不再出现 `WXML file not found: ./Demo/list.wxml`。
  - 打开“菜单 / 日历 / 我的”三个 Tab，确认页面都能正常进入，没有白屏和 `__route__ is not defined`。
- 风险与回滚点：
  - 若后续确实需要一个独立 Demo 页面，应该把它放到正式页面目录并补齐路由设计，而不是直接把样例目录挂进 `pages`。回滚点为 `app.json` 中本次删除的 `Demo/list`。
- 日期：2026-03-11
- 目标：统一静态菜品与本地存储的数据模型，为后续云菜库和历史快照复用同一套字段。
- 改动文件：`data/dishes.js`、`utils/storage.js`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - `data/dishes.js` 的每道菜现在都补齐了 `dishId / name / categoryId / emoji / img / imgFileId / xhsLink`。
  - 为了不打断当前菜单页、日历页和组件调用，运行时仍保留 `id` 与 `category` 兼容别名。
  - `utils/storage.js` 会把旧 `link / url / recipeUrl / recipeLink` 统一归并为 `xhsLink`，并让新写入的 `DishItem` 带上标准字段。
- 验证步骤：
  - 打开 `data/dishes.js`，确认每个菜对象都存在 `dishId/categoryId/img/imgFileId/xhsLink`。
  - 打开菜单页与日历页，确认现有加菜、候选池、日历标记仍正常，不因为 `id` 改造而失效。
  - 若 storage 中仍有旧结构菜品对象，重新进入页面后确认仍能正常显示名称、emoji 和图片。
- 风险与回滚点：
  - 当前页面仍大量使用 `id`；本次通过兼容别名平滑过渡。若后续要彻底切到 `dishId`，需要同步改组件事件和页面消费点。回滚时优先回退 `data/dishes.js` 与 `utils/storage.js`。
- 日期：2026-03-11
- 目标：把项目执行口径从“Skyline 优先”调整为“稳定与体验优先”。
- 改动文件：`AI_RULES.md`、`.agents/rules/coder.md`、`.agents/rules/debuger.md`、`.agents/rules/planner.md`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - Agent 不再把 Skyline 视为默认目标或必须条件。
  - 现有页面若保留 `renderer: "skyline"`、`componentFramework: "glass-easel"`、`navigationStyle: "custom"`，以兼容现状为主，不再为追 Skyline 单独改造。
  - 任务规划、编码与排障的验收重点改为用户体验、稳定性和可验证性。
- 验证步骤：
  - 打开上述规则与上下文文档，确认 Skyline 表述已从“硬约束/必选”改为“兼容现状/非目标”。
  - 后续让 Planner 输出一次任务包，确认不再默认要求页面必须开启 `renderer: "skyline"`。
- 风险与回滚点：
  - 本次仅调整规则与文档，不影响运行时行为；如需恢复 Skyline 优先口径，可回滚上述文档。
- ???2026-03-10
- ???????????????????????????
- ?????`app.json`?`components/dish-card/dish-card.js`?`components/dish-card/dish-card.wxml`?`components/dish-card/dish-card.wxss`?`pages/order/index.js`?`pages/order/index.wxml`?`docs/PROJECT_CONTEXT.md`
- ?????
  - ??????????????????????????
  - ????????????????????????????
  - ?????? `app.json` ????????????????????????
- ?????
  - ??????Tab???????????????????????????
  - ????????????????????????????????????
  - ???????? / ?????????????
- ???????
  - ????? `data/dishes.js` ???????????????????????? `pages/dish-link/*` ?????????
- 日期：2026-03-10
- 目标：删除菜品链接页内的显式返回按钮，恢复仅使用系统导航返回。
- 改动文件：`pages/dish-link/index.js`、`pages/dish-link/index.wxml`、`pages/dish-link/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 链接页移除页面内部“返回”按钮，不再覆盖在 `web-view` 之上。
  - 返回能力改回使用系统导航栏，空状态页顶部也不再额外展示返回控件。
- 验证步骤：
  - 从菜单页进入任意菜品链接页，确认页面内部不再显示“返回”按钮。
  - 使用系统导航返回，确认仍可正常回到上一页。
- 风险与回滚点：
  - 该变更只移除链接页内部返回控件；如需恢复，可回滚 `pages/dish-link/*` 中本次删除的按钮实现。
- 日期：2026-03-10
- 目标：去掉菜品链接页顶部导航栏中的菜名显示。
- 改动文件：`pages/dish-link/index.js`、`pages/dish-link/index.json`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜品链接页顶部导航栏标题清空，不再显示具体菜名。
  - 保留左上角返回按钮与白色导航栏背景，页面主体内容不变。
- 验证步骤：
  - 从菜单页点击“小炒肉”或任意其他菜进入链接页，确认顶部不再显示菜名文字。
  - 确认返回按钮仍可见且可正常返回上一页。
- 风险与回滚点：
  - 该变更只影响链接页导航标题；如需恢复展示菜名，可回滚 `pages/dish-link/index.js` 与 `pages/dish-link/index.json`。
- 日期：2026-03-10
- 目标：修复进入菜品链接页后顶部出现大块黑色区域的问题。
- 改动文件：`pages/dish-link/index.json`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜品链接页显式设置默认导航栏背景为白色，并保持黑色文字。
  - 进入 `web-view` 时顶部不再使用默认黑色导航背景，返回入口可正常识别。
- 验证步骤：
  - 从菜单页点击任意菜进入链接页，确认顶部不再出现大块黑色区域。
  - 确认顶部标题与返回入口可见，页面网页内容从白色导航栏下方正常开始。
- 风险与回滚点：
  - 该修复只调整链接页导航栏颜色配置；若后续改回自定义导航，可回滚 `pages/dish-link/index.json`。
- 日期：2026-03-10
- 目标：给菜品链接页补一个显式返回按钮，避免进入网页后缺少清晰回退入口。
- 改动文件：`pages/dish-link/index.js`、`pages/dish-link/index.wxml`、`pages/dish-link/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜品链接页左上角新增返回按钮；有链接时按钮覆盖在 `web-view` 之上，无链接时显示在空状态页顶部。
  - 点击返回优先执行 `wx.navigateBack`，若当前没有历史栈则回退到“菜单”Tab。
- 验证步骤：
  - 从菜单页点开任意已配置链接的菜，确认链接页左上角能看到“返回”按钮。
  - 点击“返回”，确认能回到上一个页面；若用直达方式打开该页，也能安全回到菜单页。
- 风险与回滚点：
  - `web-view` 覆盖层使用 `cover-view`；若个别机型上层级异常，可回滚 `pages/dish-link/*` 中的返回按钮实现。
- 日期：2026-03-10
- 目标：支持点击菜品进入对应做法链接页，并在已配置链接时自动打开网页。
- 改动文件：`app.json`、`components/dish-card/dish-card.js`、`components/dish-card/dish-card.wxml`、`components/dish-card/dish-card.wxss`、`pages/order/index.js`、`pages/order/index.wxml`、`pages/dish-link/index.js`、`pages/dish-link/index.json`、`pages/dish-link/index.wxml`、`pages/dish-link/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜单页菜卡支持点击进入链接页；“查看已选”和“抽奖结果”里的菜品也可点击进入。
  - 链接页会按菜品 id 从 `data/dishes.js` 读取 `link / url / recipeUrl / recipeLink`；若存在则直接用 `web-view` 打开。
  - 若菜品还没配置链接，则展示“暂无做法链接”的空状态，不影响原有加菜、待选、抽奖逻辑。
- 验证步骤：
  - 在 `data/dishes.js` 给任意菜补一个 `link` 字段后重新编译，点击该菜，确认进入新页面并自动打开网页。
  - 点击菜单页右侧“已加入 / 容我想想”等按钮，确认仍只执行原有操作，不会误跳转。
  - 打开“查看已选”和“抽奖结果”，点击菜品名称区域，确认也能进入对应链接页。
- 风险与回滚点：
  - 外部网页能否在小程序 `web-view` 中打开，仍取决于业务域名配置以及目标站点是否允许嵌入；若后续改为纯展示页或复制链接方案，可回滚 `pages/dish-link/*` 与相关点击绑定。
- 日期：2026-03-10
- 目标：消除菜单页与自定义 TabBar 中 wx.getSystemInfoSync 的弃用 warning。
- 改动文件：custom-tab-bar/index.js、pages/order/index.js、docs/PROJECT_CONTEXT.md
- 行为变化：
  - 自定义 TabBar 的安全区底部 inset 计算改用 wx.getWindowInfo()。
  - 菜单页自定义头部导航参数计算改用 wx.getWindowInfo()。
  - 现有安全区、胶囊避让、顶部布局和滚动区域行为保持不变，仅移除弃用 API 调用。
- 验证步骤：
  - 重新编译后进入“菜单”Tab，确认控制台不再出现 getSafeAreaInsetBottom 和 resolveNavLayout 对应的 wx.getSystemInfoSync is deprecated warning。
  - 检查底部自定义 TabBar 仍贴合安全区，无额外留白或遮挡。
  - 检查菜单页标题与右上角胶囊仍对齐，列表和底部按钮布局不抖动。
- 风险与回滚点：
  - 该变更只替换窗口信息读取 API；若个别基础库对 wx.getWindowInfo() 兼容异常，可回滚 custom-tab-bar/index.js 与 pages/order/index.js 的对应调用。
- 日期：2026-03-10
- 目标：修复新增菜品缺失本地缩略图时持续请求不存在图片导致的 500 控制台报错。
- 改动文件：`pages/order/index.js`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜单页图片映射改为仅命中已存在的本地资源文件。
  - 对没有对应 `/assets/dishes/<id>.png` 的菜品，首次渲染即直接使用 placeholder，不再先请求不存在文件再走 image error 回退。
  - 不影响已有图片菜品的缩略图展示，也不影响已选弹窗、候选池和抽奖结果的图片逻辑。
- 验证步骤：
  - 打开“菜单”Tab，切到 `鸭肉 / 猪肉 / 蔬菜 / 特殊` 分类，确认新菜品直接显示 placeholder，控制台不再出现 `dish_008 / 009 / 011 / 012 / 013 / 014 / 015` 的本地图片 500 报错。
  - 打开“查看已选”与“抽奖”弹窗，确认这些缺图菜品同样直接显示 placeholder。
  - 检查 `dish_001~007`、`dish_010` 仍正常显示原本缩略图。
- 风险与回滚点：
  - 该修复依赖 `pages/order/index.js` 中的已落盘图片白名单；后续若新增真实图片资源，需要同步补充映射。回滚点为该文件顶部 `DISH_IMAGE_BY_ID` 常量。
- 日期：2026-03-10
- 目标：扩充菜单页静态分类与菜品数据，支持猪肉、鸭肉、蔬菜、特殊等筛选。
- 改动文件：`data/dishes.js`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 菜单页分类筛选新增 `猪肉 / 鸭肉 / 蔬菜 / 特殊`。
  - 静态菜品数据新增对应分类示例菜，`小炒肉` 从牛肉改归为猪肉。
  - 新分类会自动复用现有筛选、搜索、日历 emoji 标记和本地存储兼容逻辑，无需额外页面改造。
- 验证步骤：
  - 打开“菜单”Tab，确认分类栏出现 `猪肉 / 鸭肉 / 蔬菜 / 特殊`。
  - 逐个点击上述分类，确认列表能筛出对应菜品，且“全部”下可见新增示例菜。
  - 将新增分类菜品加入今日菜单后进入“日历”Tab，确认对应日期出现新分类 emoji 标记。
- 风险与回滚点：
  - 新增菜品默认尝试读取 `/assets/dishes/<id>.png`，当前若无对应图片会回退 placeholder；如需回滚，仅回退 `data/dishes.js` 本次数据扩展。
- 日期：2026-03-06
- 目标：去除底部 Tab 文案后方灰色圆形背景，保留文案与选中切页逻辑。
- 改动文件：`custom-tab-bar/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - Tab 顶部文案后方不再渲染灰色/绿色圆形底。
  - 保持 3 个 Tab 等宽分布、`wx.switchTab` 跳转与 `selected` 选中态同步机制不变。
- 验证步骤：
  - 打开任一 Tab，确认“菜单 / 日历 / 我的”后方无灰色圆形背景。
  - 切换三个 Tab，确认当前项高亮与页面跳转正常。
  - 在带底部安全区设备检查无裁切、无异常留白、点击区域正常。
- 风险与回滚点：
  - 仅视觉样式调整；如需恢复圆形底，回滚 `custom-tab-bar/index.wxss` 的 `.tab-bar-icon-wrap*` 样式。
- 日期：2026-03-06
- 目标：将底部 Tab 文案移动到上方圆形区域，移除下方重复文案行。
- 改动文件：`custom-tab-bar/index.wxml`、`custom-tab-bar/index.wxss`、`custom-tab-bar/index.js`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 3 个 Tab 的圆形区域内文案改为“菜单 / 日历 / 我的”，不再显示“餐 / 历 / 我”。
  - 删除圆形下方独立文字行，避免重复展示。
  - 保持 `wx.switchTab` 切页逻辑与 `selected` 同步机制不变，safe-area 与三等分点击区不变。
- 验证步骤：
  - 打开任一 Tab，确认圆形内文案分别为“菜单 / 日历 / 我的”。
  - 确认底部不再出现额外一行“菜单 / 日历 / 我的”文字。
  - 依次点击三个 Tab，确认页面切换正常，当前项高亮准确。
  - 在带底部安全区设备检查文案无裁切、圆形无溢出、点击区域正常。
- 风险与回滚点：
  - 双字文案占用圆形空间更大，若个别机型观感偏挤可微调 `custom-tab-bar/index.wxss` 的圆形尺寸与字号；回滚点为 `custom-tab-bar` 三个文件。
- 日期：2026-03-06
- 目标：在日历页摘要行新增“添加”入口，支持按当前日期补录漏选菜品。
- 改动文件：`pages/calendar/index.js`、`pages/calendar/index.wxml`、`pages/calendar/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - “编辑”按钮左侧新增“添加”按钮，点击后展开菜品添加面板。
  - 添加面板菜品来源与菜单页“全部”一致（`data/dishes.js`），已在当前日期的菜品显示“已选”。
  - 点击“添加”后将该菜品写入当前选中日期，并实时更新“当前菜品 X 道”、菜品列表与日历标记。
- 验证步骤：
  - 进入“日历”Tab，点击不同日期，确认摘要行右侧显示“添加/编辑”两个按钮。
  - 点击“添加”展开列表，确认候选项与菜单页“全部”一致，已存在菜品显示“已选”。
  - 对未选菜品点击“添加”，确认提示成功且当日菜品数量 +1，日历标记同步更新。
- 风险与回滚点：
  - 添加面板使用同源静态菜品数据，若后续“全部”来源变更需同步调整；可回滚 `pages/calendar/index.*` 到本次变更前版本。
- 日期：2026-03-06
- 目标：日历页去除“已选日期”文案，并补齐按日期编辑/移除菜品能力。
- 改动文件：`pages/calendar/index.js`、`pages/calendar/index.wxml`、`pages/calendar/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 日历摘要区移除“已选日期：XXXX年X月X日”文案。
  - “当前菜品 X 道”放到摘要首行（原“已选日期”位置），并沿用该行字体与字号风格。
  - 摘要首行右侧保留“编辑/完成”按钮；切换日期后可进入编辑态，支持移除该日期下的菜品并即时刷新列表与日历标记。
- 验证步骤：
  - 进入“日历”Tab，确认摘要区不再出现“已选日期：...”。
  - 点击不同日期，确认摘要首行始终显示“当前菜品 X 道”，且右侧可见“编辑”按钮。
  - 点击“编辑”后对某菜品点“移除”，确认菜品从列表消失、计数变化，返回日历格子标记同步更新。
- 风险与回滚点：
  - 编辑态仅支持移除，不涉及新增逻辑；若交互不符合预期，可回滚 `pages/calendar/index.*` 到本次变更前版本。
- 日期：2026-03-06
- 目标：去除菜单页标题“今天吃什么呢？”背后的黄色底色。
- 改动文件：`pages/order/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 顶部标题容器背景由黄色改为透明，仅保留文字与布局，不影响胶囊避让与对齐逻辑。
- 验证步骤：
  - 打开菜单页，确认“今天吃什么呢？”后方不再有黄色块背景。
  - 检查标题与右上角胶囊仍保持同一行对齐。
- 风险与回滚点：
  - 仅视觉调整，风险低；如需恢复可回滚 `custom-header-title-wrap` 的 `background` 样式。
- 日期：2026-03-06
- 目标：将菜单页日历入口/弹层迁移到“日历 Tab”主页面，并抽出可复用日历组件。
- 改动文件：`components/meal-calendar/index.json`、`components/meal-calendar/index.js`、`components/meal-calendar/index.wxml`、`components/meal-calendar/index.wxss`、`pages/calendar/index.json`、`pages/calendar/index.js`、`pages/calendar/index.wxml`、`pages/calendar/index.wxss`、`pages/order/index.json`、`pages/order/index.js`、`pages/order/index.wxml`、`pages/order/index.wxss`、`docs/PROJECT_CONTEXT.md`
- 行为变化：
  - 新增可复用组件 `meal-calendar`，承载日历核心能力（年月切换、日期选择、emoji marker）。
  - `pages/calendar/index` 改为直接渲染日历组件并读取 `getMealCalendarMarks`，可在页面内查看某天菜单。
  - 菜单页移除日历入口图标、日历弹层节点及相关状态/事件；菜单逻辑默认以当天日期写入/读取菜单。
  - “菜单选菜 -> 日历标记展示”链路保持不变：标记数据仍来自 `utils/storage` 的 `meal_calendar_marks_v1`。
- 验证步骤：
  - 打开菜单页，确认没有日历入口按钮与日历弹层 UI。
  - 进入日历 Tab，确认可切换年月、选择日期，并展示日期标记。
  - 在菜单页新增/取消菜品后切回日历 Tab，确认对应日期标记更新。
  - 检查菜单页与日历页底部内容均不被自定义 tabBar 遮挡。
- 风险与回滚点：
  - 菜单页不再支持按任意日期点菜；若需恢复，可回滚 `pages/order/index.*` 中日历入口与 `today` 切换逻辑。
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
