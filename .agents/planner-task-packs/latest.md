### 目标
实现 5 个明确能力：
- 点击菜品后跳转到该菜对应的小红书链接
- 在“我的”页面接入微信云开发登录
- 在“我的”页面增加“菜品管理”，支持客户端录入名字、分类、图片和链接并自动上云
- 给云存储建立清晰的数据边界与落库规范
- 让云端能够稳定保存菜品名、照片、链接，以及日历里记录过的历史菜品

### TODO 状态（2026-03-11）
- [x] 统一 `data/dishes.js` 和 `utils/storage.js` 的菜品字段：`dishId / name / categoryId / emoji / img / imgFileId / xhsLink`
- [x] 保留 `id / category` 兼容别名，避免当前菜单页、日历页、组件事件契约被一次性打断
- [x] 修复误注册 `Demo/list` 导致的编译阻塞，恢复正式页面路由为 `菜单 / 日历 / 我的`
- [ ] 建立 `dish-card detailtap -> pages/dish-link/index` 的统一跳转链路
- [ ] 验证小红书链接在微信小程序内的可打开方式，并补承接页兜底
- [ ] 接入云开发初始化、登录态、同步状态和最近同步时间展示
- [ ] 增加“菜品管理”入口、列表页、添加表单、图片上传和写库链路
- [ ] 建立 `users / dish_library / meal_history` 云函数与落库边界
- [ ] 打通本地成功后再异步同步云端的历史菜单同步策略
- [ ] 做包体积与资源预算复查，明确哪些图片留主包、哪些走云存储/CDN

### 方案（指定）
- 菜品数据模型统一为一套字段，不再混用 `link / url / recipeUrl / recipeLink`。建议统一成：
  - `dishId`
  - `name`
  - `categoryId`
  - `emoji`
  - `imgFileId`
  - `img`
  - `xhsLink`
- 点击菜品统一走一条详情链路：`dish-card detailtap -> 链接承接页/跳转页`。
- 小红书链接必须先验证能否在小程序内直接打开；若不能直开，则降级为“承接页 + 复制链接”。
- 云能力采用“本地可用 + 登录后同步”的策略，不把主业务一次性改成纯云端。
- “我的”页增加一个明确入口：`菜品管理`。
- “菜品管理”至少包含两块能力：
  - 菜品列表
  - 添加菜品
- “添加菜品”表单字段至少包含：
  - 菜名
  - 分类
  - 菜品图片
  - 小红书链接
- 自动上云链路固定为：
  1. 客户端选择图片
  2. 客户端上传图片到云存储
  3. 拿到图片 `fileID`
  4. 再调用云函数写入 `dish_library`
  5. 写库成功后刷新“菜品管理”列表
- 不建议让客户端直接把整条菜品文档裸写进数据库。更稳的方式是：图片可以由客户端直传云存储，但元数据新增/修改通过云函数统一校验和落库。
- 云端主数据拆成 3 类：
  - `users`
  - `dish_library`
  - `meal_history`
- 历史记录不要只存 `dishId[]`，还要存一份 `dishesSnapshot[]`，至少包含：
  - `dishId`
  - `name`
  - `img`
  - `xhsLink`
- 当前 `菜单 / 日历 / 我的` 都是 `tabBar` 页面，而微信开放文档要求 `tabBar` 页面必须在主包内，所以“我的”页和登录入口必须留在主包。
- 包体积策略不要写成“某张图超过多少就拆包”。真正要盯的是整体包体积预算：总包、主包、单分包。

### 文件范围
- `app.js`
- `app.json`
- `pages/order/index.js`
- `pages/order/index.wxml`
- `pages/calendar/index.js`
- `pages/calendar/index.wxml`
- `pages/mine/index.js`
- `pages/mine/index.wxml`
- `pages/mine/index.wxss`
- `pages/dish-link/index.js`（新增或补回）
- `pages/dish-link/index.json`（新增）
- `pages/dish-link/index.wxml`（新增）
- `pages/dish-link/index.wxss`（新增）
- `pages/dish-manage/index.js`（新增，若不直接写在 mine 页）
- `pages/dish-manage/index.json`（新增）
- `pages/dish-manage/index.wxml`（新增）
- `pages/dish-manage/index.wxss`（新增）
- `pages/dish-manage-form/index.js`（新增）
- `pages/dish-manage-form/index.json`（新增）
- `pages/dish-manage-form/index.wxml`（新增）
- `pages/dish-manage-form/index.wxss`（新增）
- `components/dish-card/dish-card.js`
- `components/dish-card/dish-card.wxml`
- `data/dishes.js`
- `utils/storage.js`
- `utils/cloud.js`（新增）
- `cloudfunctions/login/index.js`（新增）
- `cloudfunctions/createDish/index.js`（新增）
- `cloudfunctions/listDishes/index.js`（新增）
- `cloudfunctions/updateDish/index.js`（新增，可选）
- `cloudfunctions/syncMealHistory/index.js`（新增）
- `cloudfunctions/getMealHistory/index.js`（新增）
- `docs/PROJECT_CONTEXT.md`
- `package-manage/*` 或类似分包目录（可选）
- `package-history/*` 或类似分包目录（可选）

### 约束（必须遵守）
1. **页面配置约束**：保留当前页面已存在的 `renderer` / `componentFramework` / `navigationStyle` 配置；除非本次任务明确要求调整，并写明原因。
2. **WXSS 选择器限制**：避免 tag selector / #id / attribute selector，统一用 class。
3. **链接跳转约束**：不能假设小红书链接一定能在小程序里直接打开；必须先验证 `web-view` / 业务域名能力，不通过时要有可用兜底，不允许“点击后无反馈”。
4. **云存储边界约束**：第一版只做“登录 + 菜库主数据 + 历史菜单同步 + 菜品管理新增”；不要把所有本地状态一次性上云。
5. **数据一致性约束**：历史记录必须保留菜品快照，不能只存 `dishId`。
6. **同步策略约束**：先本地成功，再同步云端；云同步失败不能阻断本地核心点菜链路。
7. **包体积约束**：按微信开放文档，整个小程序所有分包总大小不超过 30M（服务商代开发不超过 20M），单个主包/分包不能超过 2M；`tabBar` 页面必须在主包内。
8. **图片资源约束**：不要把大量菜品大图直接塞进仓库主包；主包只保留首屏必需资源、占位图和少量高频缩略图，其余优先考虑云存储/CDN/网络地址，或跟随非 tab 页一起进分包。
9. **菜品管理权限约束**：默认只有已登录用户才能进入“菜品管理”并执行新增；第一版可先不做复杂角色系统，但新增记录必须带上 `createdBy/openid`。
10. **写库约束**：创建菜品时，必须先上传图片，再写数据库；图片上传失败时不能落空文档，数据库写入失败时要能提示并允许重试。
11. **版本管理**：建议分支名 `feature/cloud-dish-management`，建议 Commit 规范 `feat: add cloud dish management flow`.

### 验收标准
- 菜单页点击任意已配置小红书链接的菜品时，能进入对应链接链路；若不能直接打开小红书，也至少能进入承接页并复制链接。
- “我的”页能看到明确的登录入口、登录状态、同步状态和最近同步时间。
- “我的”页能进入“菜品管理”，并看到已上云的菜品列表。
- 在“添加菜品”里填写菜名、分类、图片和链接后，能自动完成上传，并在云端生成一条新 `dish_library` 记录。
- 新增后的菜品能在菜品管理列表里立即看到；后续若菜单页改为读云菜库，则也应能在菜单页出现。
- 登录后，云端至少能看到 3 类数据：用户信息、菜品主数据、历史菜单记录。
- 历史菜单记录中，单日数据至少包含：日期、菜品列表、每道菜的名称、图片、链接快照。
- 本地已有的历史菜单在首次登录后能同步到云端；换设备后登录同一账号，至少能从云端拉回历史菜单。
- 未登录时，菜单、日历、本地点菜逻辑仍可正常工作；登录失败或云同步失败时不应破坏本地主链路。
- 引入菜品图片、链接承接页、云登录能力后，主包体积仍需控制在 2M 内；若接近限制，必须有明确的分包或云资源迁移方案。
- 若后续新增大量菜品图片，方案中必须说明哪些图片留本地、哪些走云存储，不允许模糊处理。
- 开发者工具和真机上没有新增的空白页、死链、明显报错或长时间无反馈。

### 详细实施步骤
1. **先定数据模型**
- 给 `data/dishes.js` 的每个菜补统一字段：`dishId`、`name`、`categoryId`、`emoji`、`img`、`imgFileId`、`xhsLink`。
- 统一约定后续历史快照也使用这套字段，不再混用 `url / recipeUrl / recipeLink / link`。

2. **建立菜品点击跳转链路**
- 在 `components/dish-card` 保持 `detailtap` 事件为唯一入口。
- `pages/order/index` 和后续历史列表都统一监听 `detailtap`。
- 点击后跳去 `pages/dish-link/index`，由承接页判断：
  - 有合法 `xhsLink`：尝试打开
  - 无链接：展示“暂无链接”
  - 链接不可直开：展示封面、标题、复制链接按钮、打开说明

3. **验证小红书打开方式**
- 先在微信开发者工具和真机验证：小红书链接是否允许放进 `web-view`。
- 如果不允许，不要继续赌技术细节，直接走“承接页 + 复制链接”的稳定方案。

4. **接入微信云开发基础能力**
- 在 `app.js` 初始化云开发环境。
- 明确 `envId` 配置来源，避免写死在多个文件里。
- 新增 `utils/cloud.js`，统一封装：
  - 云环境初始化
  - 获取登录态
  - 调用云函数
  - 上传图片到云存储
  - 本地缓存最近登录/同步状态

5. **先做包体积与资源预算**
- 先把当前本地图片、未来要新增的小红书封面图、菜品管理页资源、云登录相关代码、历史页资源放进同一个包体积预算表。
- 明确哪些资源必须留主包：
  - `tabBar` 相关页面代码
  - 首页首屏必要资源
  - 通用占位图
- 明确哪些资源不应留主包：
  - 大量菜品原图
  - 菜品管理详情页资源
  - 历史详情页资源
  - 链接承接页里可延迟加载的封面/说明资源
- 如果菜品图片量继续增长，优先方案是“主包只留 placeholder + 少量缩略图，完整图片走云存储/网络地址”；分包是第二层手段，不是唯一手段。

6. **实现“我的”页登录卡片**
- 当前“我的”页还是占位页，第一版改成：
  - 登录按钮
  - 当前登录状态
  - 最近同步时间
  - 菜品管理入口
  - 云端说明文案
- 登录成功后，在本地缓存最小用户信息，并更新页面状态。

7. **实现“菜品管理”客户端链路**
- 入口放在“我的”页。
- 第一版推荐结构：
  - “我的”页只放入口卡片
  - 点击进入 `菜品管理页`
  - `菜品管理页` 展示已有菜品列表 + “添加菜品”按钮
  - 点击“添加菜品”进入表单页
- “添加菜品”表单字段：
  - `name`
  - `categoryId`
  - `localImagePath`
  - `xhsLink`
- 图片选择建议用：
  - `wx.chooseMedia` 或同级图片选择能力
- 提交流程必须固定为：
  1. 校验表单
  2. 上传图片到云存储
  3. 拿到 `imgFileId`
  4. 调用 `createDish` 云函数写数据库
  5. 返回列表页刷新
- 若图片上传成功但写库失败，页面必须提示失败，并保留重试能力；不能让用户重新选一遍所有字段。

8. **建立云函数和数据库结构**
- `login` 云函数：返回当前用户 `openid`，首次登录时初始化 `users` 文档。
- `createDish` 云函数：校验参数、补充 `createdBy/openid`、写入 `dish_library`。
- `listDishes` 云函数：返回当前可管理的菜品列表。
- `updateDish` 云函数：后续支持编辑时使用。
- `syncMealHistory` 云函数：接收本地历史菜单，按 `openid + date` upsert。
- `getMealHistory` 云函数：按 `openid` 拉取历史菜单。
- `dish_library` 可有两种落法：
  - 第一版兼容方案：本地 `data/dishes.js` 继续作为种子数据，云端新增菜品追加在 `dish_library`
  - 更完整方案：菜单页逐步切换为“静态种子 + 云端菜库合并读取”，最终再考虑完全云端化
- 若时间有限，优先顺序应为：`users` > `dish_library` > `meal_history`。

9. **规范哪些数据应该上云**
- **第一优先级，必须上云**
  - `users`
    - `openid`
    - `nickname`
    - `avatarUrl`
    - `createdAt`
    - `lastLoginAt`
    - `lastSyncAt`
  - `dish_library`
    - `dishId`
    - `name`
    - `categoryId`
    - `emoji`
    - `imgFileId`
    - `img`
    - `xhsLink`
    - `createdBy`
    - `createdAt`
    - `updatedAt`
    - `source`
  - `meal_history`
    - `openid`
    - `date`
    - `dishIds`
    - `dishesSnapshot`
    - `marks`
    - `source`
    - `updatedAt`
- **第二优先级，可二期再上云**
  - `THINK_POOL`
  - `LAST_LOTTERY_RESULT_YYYY-MM-DD`
  - 用户偏好
  - 分类偏好
- **不建议上云**
  - `searchKeyword`
  - 当前弹窗开关
  - 当前选中分类
  - 抽奖预览结果
  - 纯 UI 状态

10. **定义同步策略**
- 首次登录：
  - 从本地读取 `TODAY_MENU_*`、`MEAL_PLAN_BY_DATE`、`meal_calendar_marks_v1`
  - 生成标准化 `meal_history`
  - 批量推送云端
- 菜品管理新增：
  - 表单提交后先上传图片
  - 再创建 `dish_library`
  - 成功后刷新客户端列表
- 日常使用：
  - 本地点菜/移除成功后，异步调用 `syncMealHistory`
  - 云端失败只提示“同步失败，可稍后重试”，不回滚本地菜单
- 换设备登录：
  - 登录成功后拉取云端 `meal_history`
  - 回填到本地 storage
  - 刷新日历页标记和菜单页状态

11. **历史记录展示建议**
- 第一版不必立刻在“我的”页做完整历史时间线。
- 但至少要保证云端数据结构已经支持以后展示：
  - 某天吃了什么
  - 点击历史菜品还能继续打开对应小红书链接
  - 即使菜库后续变化，历史仍显示当时名称/图片/链接快照

12. **上线前验证顺序**
- 先验证小红书链接链路。
- 再验证“我的”页登录。
- 再验证“菜品管理 -> 添加菜品 -> 自动上云”。
- 再验证本地历史首次上云。
- 最后验证新设备拉回历史。
- 每次新增图片或资源后，都要重新检查主包/总包体积，不要只在最终提审前才发现超限。

### 开发分期建议
- **P1：菜品链接**
  - 完成 `xhsLink` 字段、点击链路、承接页/兜底页
- **P2：云登录**
  - 完成 `app.js` 云开发初始化、“我的”页登录状态、`login` 云函数
- **P3：菜品管理自动上云**
  - 完成“我的”页入口、菜品管理列表、添加表单、图片上传和 `createDish` 云函数
- **P4：历史菜单上云**
  - 完成 `meal_history` 数据模型、首次迁移、本地改动后增量同步
- **P5：云端菜库**
  - 视时间再决定是否把 `dish_library` 从静态文件切换成云端主数据源

### 页面分包建议清单
| 页面/能力 | 是否必须主包 | 建议处理 | 原因 |
| --- | --- | --- | --- |
| `pages/order/index` | 是 | 留主包 | 是 `tabBar` 页面，且是启动后高频入口 |
| `pages/calendar/index` | 是 | 留主包 | 是 `tabBar` 页面 |
| `pages/mine/index` | 是 | 留主包 | 是 `tabBar` 页面；登录入口也必须跟着留主包 |
| `pages/dish-manage/index` | 否 | 推荐分包 | 非启动页，适合按需加载 |
| `pages/dish-manage-form/index` | 否 | 推荐分包 | 表单页低频访问 |
| `pages/dish-link/index` | 否 | 推荐分包 | 非启动页，点击菜品后才进入 |
| 历史详情页（若新增） | 否 | 放分包 | 低频访问，适合按需加载 |
| 云同步说明页/帮助页（若新增） | 否 | 放分包 | 非核心主链路 |
| 大图预览页（若新增） | 否 | 放分包 | 体积大、访问低频 |

### 图片与资源落地建议
| 资源类型 | 建议存放位置 | 是否进 Git 仓库 | 是否进主包 | 云端字段怎么存 |
| --- | --- | --- | --- | --- |
| 通用占位图 `placeholder` | 本地 `assets` | 是 | 是 | 不需要单独存 |
| 少量高频菜品缩略图 | 本地 `assets` | 是 | 是，但数量要控 | `img` 存本地路径或后续替换成 URL |
| 大量菜品封面图 | 云存储 / CDN / 网络地址 | 否 | 否 | `img` 存 URL，`imgFileId` 存文件标识 |
| 小红书封面图 | 优先云存储 / 网络地址 | 否 | 否 | `img` 或 `coverUrl` 存 URL |
| 用户头像 | 微信返回或云端 URL | 否 | 否 | `avatarUrl` 存 URL |
| 历史记录里的图片 | 不存二进制，只存快照 URL | 否 | 否 | `dishesSnapshot[].img` 存字符串 URL/路径 |

### 建议上云字段细化
| 集合 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `users` | `openid` | string | 用户唯一标识 |
| `users` | `nickname` | string | 用户昵称，可为空 |
| `users` | `avatarUrl` | string | 头像 URL，可为空 |
| `users` | `createdAt` | number/date | 首次创建时间 |
| `users` | `lastLoginAt` | number/date | 最近登录时间 |
| `users` | `lastSyncAt` | number/date | 最近同步时间 |
| `dish_library` | `dishId` | string | 菜品 id |
| `dish_library` | `name` | string | 菜名 |
| `dish_library` | `categoryId` | string | 分类 id |
| `dish_library` | `emoji` | string | 分类/菜品 emoji |
| `dish_library` | `imgFileId` | string | 云存储文件 ID |
| `dish_library` | `img` | string | 菜品图片 URL 或路径 |
| `dish_library` | `xhsLink` | string | 小红书链接 |
| `dish_library` | `createdBy` | string | 创建者 openid |
| `dish_library` | `createdAt` | number/date | 创建时间 |
| `dish_library` | `updatedAt` | number/date | 最近更新时间 |
| `dish_library` | `source` | string | 来源，例如 `manual_demo_import` / `client_create` |
| `meal_history` | `openid` | string | 所属用户 |
| `meal_history` | `date` | string | `YYYY-MM-DD` |
| `meal_history` | `dishIds` | string[] | 当天菜品 id 列表 |
| `meal_history` | `marks` | string[] | 日历标记 |
| `meal_history` | `source` | string | `local_migrated` / `cloud_edit` |
| `meal_history` | `updatedAt` | number/date | 最近更新时间 |
| `meal_history` | `dishesSnapshot` | object[] | 历史快照，必须保留 |

### 包体积检查点
1. 新增 5 张以上本地图片时，立即检查一次主包大小。
2. 新增新页面且不是 `tabBar` 页面时，优先先判断是否应该直接进分包。
3. 引入云登录后，如果“我的”页只是文案和按钮增加，一般不是代码体积风险点；真正容易超的是图片和静态资源。
4. 每次准备提审前，必须检查：
   - 主包是否 < 2M
   - 总包是否 < 30M
   - 是否把不该留主包的图片继续留在主包

### Demo 样例上云方式
你当前 `Demo/demo.md` 的结构是：
- `dish name`：`农家小炒肉`
- `dish photo`：本地文件 `Demo\Weixin Image_20260310204625_15_75.jpg`
- `dish link to redbook`：一段带说明文字的小红书分享文案，里面包含短链接 `http://xhslink.com/o/9XzlPQqCYIN`

对于这种结构，不要把 `demo.md` 整个文件直接丢进数据库。正确拆法是：
1. 图片文件上传到云存储
2. 菜品元数据写入云数据库
3. 小红书链接只保存清洗后的真实链接字符串

### 客户端自动上云的直接方案
如果你希望以后不再手工去云开发控制台录数据，而是在客户端自己加菜，推荐把流程定成下面这样：
1. 用户进入“我的”
2. 点击“菜品管理”
3. 点击“添加菜品”
4. 填：
   - 菜名
   - 分类
   - 图片
   - 小红书链接
5. 点击提交后：
   - 客户端先上传图片到云存储
   - 拿到 `imgFileId`
   - 再调用 `createDish` 云函数
   - 云函数把 `name/categoryId/imgFileId/xhsLink/createdBy` 写入 `dish_library`
6. 成功后返回菜品管理列表

### 关键风险
- 小红书链接未必能在小程序里直接打开，这是本次需求最大的不确定项。
- 云开发登录成功不等于云同步一定成功，必须把这两步拆开处理。
- 如果历史只存 `dishId`，后续改菜名或图片时，过去记录会失真。
- 如果第一版就把候选池、抽奖、偏好、历史全部同时上云，极容易把需求做散。
- 如果菜品图片持续增加，本地主包很容易先碰到 2M 限制；而 `tabBar` 页面必须在主包内，这意味着“我的”页登录能力本身不能靠挪分包解决，必须提前做资源预算。
- 如果客户端直接写数据库而不经过云函数，后续做权限控制、字段校验、脏数据修复会更麻烦；因此第一版最好就把“新增菜品”收口到云函数。
