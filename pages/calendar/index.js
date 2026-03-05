Page({
  onShow() {
    this.updateTabBarSelected()
  },

  updateTabBarSelected() {
    if (typeof this.getTabBar !== 'function') {
      return
    }

    const tabBar = this.getTabBar()
    if (!tabBar || typeof tabBar.setData !== 'function') {
      return
    }

    tabBar.setData({
      selected: 1
    })
  }
})
