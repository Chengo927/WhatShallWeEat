const { getMealCalendarMarks, getTodayMenu } = require('../../utils/storage')

function getStatusBarHeight() {
  try {
    const systemInfo = typeof wx.getSystemInfoSync === 'function' ? wx.getSystemInfoSync() : {}
    return Number(systemInfo.statusBarHeight) || 0
  } catch (error) {
    console.error('[calendar] getStatusBarHeight failed', error)
    return 0
  }
}

function formatDate(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(dateStr) {
  const matches = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '')
  if (!matches) {
    return dateStr || ''
  }
  const [, year, month, day] = matches
  return `${year}年${Number(month)}月${Number(day)}日`
}

Page({
  data: {
    statusBarHeight: 0,
    selectedDate: '',
    selectedDateLabel: '--',
    calendarMarks: {},
    selectedMenu: []
  },

  onLoad() {
    const today = formatDate(new Date())
    this.setData({
      statusBarHeight: getStatusBarHeight(),
      selectedDate: today,
      selectedDateLabel: formatDateLabel(today)
    })
    this.syncCalendarData()
  },

  syncCalendarData() {
    const fallbackDate = formatDate(new Date())
    const selectedDate = this.data.selectedDate || fallbackDate
    const selectedMenu = getTodayMenu(selectedDate)
    const calendarMarks = getMealCalendarMarks()

    this.setData({
      selectedDate,
      selectedDateLabel: formatDateLabel(selectedDate),
      selectedMenu,
      calendarMarks
    })
  },

  onShow() {
    this.syncTabBarSelected()
    this.syncCalendarData()
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
      selected: 1
    })
  },

  onCalendarChange(event) {
    const nextDate = event && event.detail ? event.detail.date : ''
    if (!nextDate) {
      return
    }

    this.setData(
      {
        selectedDate: nextDate,
        selectedDateLabel: formatDateLabel(nextDate),
        selectedMenu: getTodayMenu(nextDate)
      },
      () => {
        this.syncCalendarData()
      }
    )
  }
})
