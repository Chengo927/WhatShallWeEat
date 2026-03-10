const TAB_LIST = [
  {
    pagePath: '/pages/order/index',
    text: '菜单'
  },
  {
    pagePath: '/pages/calendar/index',
    text: '日历'
  },
  {
    pagePath: '/pages/mine/index',
    text: '我的'
  }
]

function getSafeAreaInsetBottom() {
  try {
    const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
    const safeArea = windowInfo && windowInfo.safeArea ? windowInfo.safeArea : null
    const screenHeight = Number(windowInfo.screenHeight) || 0
    const safeBottom = safeArea ? Number(safeArea.bottom) || 0 : 0
    if (screenHeight > 0 && safeBottom > 0) {
      return Math.max(0, screenHeight - safeBottom)
    }
    return 0
  } catch (error) {
    console.error('[tabbar] getSafeAreaInsetBottom failed', error)
    return 0
  }
}

Component({
  data: {
    selected: 0,
    tabList: TAB_LIST,
    safeAreaInsetBottom: 0
  },

  lifetimes: {
    attached() {
      this.setData({
        safeAreaInsetBottom: getSafeAreaInsetBottom()
      })
      this.syncSelectedFromRoute()
    }
  },

  pageLifetimes: {
    show() {
      this.syncSelectedFromRoute()
    }
  },

  methods: {
    syncSelectedFromRoute() {
      const pages = getCurrentPages()
      if (!Array.isArray(pages) || !pages.length) {
        return
      }

      const currentPage = pages[pages.length - 1] || {}
      const currentPath = `/${currentPage.route || ''}`
      const selected = this.data.tabList.findIndex((tab) => tab.pagePath === currentPath)
      if (selected >= 0 && selected !== this.data.selected) {
        this.setData({
          selected
        })
      }
    },

    onSwitchTab(event) {
      const dataset =
        event && event.currentTarget && event.currentTarget.dataset
          ? event.currentTarget.dataset
          : {}
      const nextPath = dataset.path || ''
      const nextIndex = Number(dataset.index)
      const currentTab = this.data.tabList[this.data.selected] || {}
      const currentPath = currentTab.pagePath || ''

      if (!nextPath || nextPath === currentPath) {
        return
      }

      if (!Number.isNaN(nextIndex) && nextIndex >= 0) {
        this.setData({
          selected: nextIndex
        })
      }

      wx.switchTab({
        url: nextPath
      })
    }
  }
})
