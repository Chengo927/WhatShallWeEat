你在这个仓库的目标：实现微信小程序，“每天吃什么”功能优先，其它功能后续迭代。稳定性和体验优先，不再把 Skyline 当作默认目标。

硬约束：
1) 默认只做最小可运行改动；每次改动尽量 < 200 行。
2) 不引入外部框架（先用原生小程序能力）。
3) 不把 Skyline 当作硬约束：现有页面若已使用 `renderer:"skyline"`、`componentFramework:"glass-easel"`、`navigationStyle:"custom"`，以兼容现状为主；除非明确要求或确有收益，不要为了追 Skyline 单独折腾页面配置。
   页面滚动仍优先用 `scroll-view`，并显式设置高度。
4) 数据先用本地存储（wx.setStorageSync / getStorageSync）。
5) 输出必须包含：改动文件列表 + 关键代码片段 + 在开发者工具里如何验证（点击路径）。
6) 不要“想当然”新增页面；先复用现有结构，除非 Planner 明确拆分。
