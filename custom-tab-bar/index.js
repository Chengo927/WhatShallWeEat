Component({
  data: {
    selected: 0,
    list: [
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
  },

  methods: {
    onTabItemTap(event) {
      const dataset = event.currentTarget ? event.currentTarget.dataset : {}
      const path = dataset.path
      const index = Number(dataset.index)

      if (!path || Number.isNaN(index)) {
        return
      }

      if (index === this.data.selected) {
        return
      }

      wx.switchTab({
        url: path
      })
    }
  }
})
