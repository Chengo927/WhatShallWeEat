const { getMealCalendarMarks, getTodayMenu } = require('../../utils/storage')

function formatDate(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

Page({
  data: {
    selectedDate: '',
    calendarMarks: {},
    selectedDishes: []
  },

  onLoad() {
    this.refreshCalendarData(formatDate(new Date()))
  },

  onShow() {
    this.updateTabBarSelected()
    this.refreshCalendarData(this.data.selectedDate || formatDate(new Date()))
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
  },

  refreshCalendarData(dateStr) {
    const selectedDate = typeof dateStr === 'string' && dateStr ? dateStr : formatDate(new Date())

    try {
      const calendarMarks = getMealCalendarMarks()
      const selectedDishes = getTodayMenu(selectedDate)

      this.setData({
        selectedDate,
        calendarMarks: calendarMarks && typeof calendarMarks === 'object' ? calendarMarks : {},
        selectedDishes: Array.isArray(selectedDishes) ? selectedDishes : []
      })
    } catch (error) {
      console.error('[calendar] refreshCalendarData failed', error)
      this.setData({
        selectedDate,
        calendarMarks: {},
        selectedDishes: []
      })
    }
  },

  onCalendarChange(event) {
    const date = event && event.detail ? event.detail.date : ''
    if (!date) {
      return
    }
    this.refreshCalendarData(date)
  }
})
