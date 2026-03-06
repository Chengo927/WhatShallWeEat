function getStatusBarHeight() {
  try {
    const systemInfo = typeof wx.getSystemInfoSync === 'function' ? wx.getSystemInfoSync() : {}
    return Number(systemInfo.statusBarHeight) || 0
  } catch (error) {
    console.error('[mine] getStatusBarHeight failed', error)
    return 0
  }
}

Page({
  data: {
    statusBarHeight: 0
  },

  onLoad() {
    this.setData({
      statusBarHeight: getStatusBarHeight()
    })
  },

  onShow() {
    this.syncTabBarSelected()
  },

  syncTabBarSelected() {
    if (typeof this.getTabBar !== 'function') {
      return
    }
    const tabBar = this.getTabBar()
    if (!tabBar || typeof tabBar.setData !== 'function') {
      return
    }
    tabBar.setData({
      selected: 2
    })
  }
})
