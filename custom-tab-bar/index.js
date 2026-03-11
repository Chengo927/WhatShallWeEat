const TAB_LIST = [
  {
    pagePath: '/pages/order/index',
    text: '\u83dc\u5355'
  },
  {
    pagePath: '/pages/calendar/index',
    text: '\u65e5\u5386'
  },
  {
    pagePath: '/pages/mine/index',
    text: '\u6211\u7684'
  }
]

Component({
  data: {
    selected: 0,
    tabList: TAB_LIST
  },

  lifetimes: {
    attached() {
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
      const currentPath = '/' + (currentPage.route || '')
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
