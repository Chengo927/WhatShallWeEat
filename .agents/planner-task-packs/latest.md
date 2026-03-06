### 目标
修复两个滚动 Bug：1) 菜单 tab（`pages/order/index`）主菜品列表可稳定下滑浏览全部菜品；2) 日历 tab 的“添加”区域可下滑浏览 `allDishOptions` 全量菜品（不再停在“小炒黄牛肉”附近）。

### 方案（指定）
- 先做根因排查并区分是“滚动容器样式限制”还是“触摸事件被上层节点拦截”：重点检查 `scroll-view` 祖先节点的 `height/min-height/overflow/flex` 组合、fixed 层叠关系、`catchtouchmove`/`catchtap` 影响。
- 对菜单 tab：修正主列表滚动链路，确保 `dish-scroll` 拥有可计算高度，且不存在阻断纵向手势的覆盖层；必要时调整底部固定栏与内容区的安全区/底部 padding 关系，避免视觉可见但不可滚动。
- 对日历 tab：将“添加菜品列表”改为独立可滚动区域或确保外层 `calendar-scroll` 在展开添加面板后仍可持续滚动；同时核对 `allDishOptions.length` 与实际渲染条数，排除数据截断假象。
- 补充回归：验证菜单页弹层（已选菜单/抽奖）打开与关闭后不影响主列表滚动；验证日历页切换日期、添加/移除后滚动行为稳定。

### 文件范围
- `pages/order/index.wxml`
- `pages/order/index.wxss`
- `pages/order/index.js`（仅在需要处理滚动状态或层级状态时）
- `pages/calendar/index.wxml`
- `pages/calendar/index.wxss`
- `pages/calendar/index.js`（仅在需要处理展开态滚动逻辑时）
- （如排查确认与 tabBar 覆盖层相关）`custom-tab-bar/index.wxss`

### 约束（必须遵守）
1. **Skyline 页面配置**：涉及页面 `page.json` 必须包含 `"renderer": "skyline"`, `"componentFramework": "glass-easel"`（当前 `pages/order/index.json`、`pages/calendar/index.json` 已满足，不得破坏），并关注 `scroll-view` 在 Skyline 下的滚动容器高度计算与 `navigationStyle: custom` 兼容。
2. **WXSS 选择器限制**：避免 tag selector / #id / attribute selector，统一用 class。
3. **特定业务约束**：不改变现有菜品数据源与存储结构；若涉及本地缓存，统一使用 `wx.getStorageSync` / `wx.setStorageSync`，并沿用现有 key 体系；不得影响底部 tabBar 点击切换。
4. **版本管理**：建议分支名 `bugfix/menu-calendar-scroll-fix`，建议 Commit 规范 `fix: 修复菜单与日历添加列表无法下滑`。

### 验收标准
- 菜单 tab：在真机与开发者工具 Skyline 下，主菜品列表可连续下滑到末尾，并可回滑到顶部。
- 日历 tab：点击“添加”后，可下滑浏览完整菜品列表，能够看到并操作“小炒黄牛肉”之后的菜品。
- 数据一致性：`allDishOptions` 全量条目均可触达；添加后状态从“添加”切为“已选”且不影响继续滚动。
- 交互回归：打开/关闭菜单页弹层后，主列表滚动能力不丢失；日历页切换日期后“添加”面板滚动仍正常。
- 手工测试步骤：
  - 进入“菜单”tab，连续上滑 3-5 屏，确认可到达底部提示并正常回滑。
  - 进入“日历”tab，展开“添加”，持续上滑直到列表末尾，随机添加 2-3 个位于后半段的菜品。
  - 切换日期后重复上述操作，再返回原日期确认滚动与状态均正常。
