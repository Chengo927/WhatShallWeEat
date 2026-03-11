### 目标
实现 5 个明确能力：
- 点击菜品后跳转到该菜对应的小红书链接
- 在“我的”页面接入微信云开发登录
- 在“我的”页面增加“菜品管理”，支持客户端录入名字、分类、图片和链接并自动上云
- 给云存储建立清晰的数据边界与落库规范
- 让云端能够稳定保存菜品名、照片、链接，以及日历里记录过的历史菜品

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
