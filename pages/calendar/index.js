const sourceData = require('../../data/dishes') || {}
const allDishes = Array.isArray(sourceData.dishes) ? sourceData.dishes : []
const {
  getMealCalendarMarks,
  getTodayMenu,
  removeDishFromDate,
  addDishToDate
} = require('../../utils/storage')

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

function buildAllDishOptions(selectedMenu) {
  const selectedIdMap = {}
  const safeSelectedMenu = Array.isArray(selectedMenu) ? selectedMenu : []
  safeSelectedMenu.forEach((dish) => {
    if (dish && dish.id) {
      selectedIdMap[dish.id] = true
    }
  })

  return allDishes
    .filter((dish) => dish && dish.id && dish.name)
    .map((dish) => ({
      id: dish.id,
      name: dish.name,
      emoji: dish.emoji || '',
      added: !!selectedIdMap[dish.id]
    }))
}

Page({
  data: {
    statusBarHeight: 0,
    selectedDate: '',
    calendarMarks: {},
    selectedMenu: [],
    isEditing: false,
    allDishOptions: []
  },

  onLoad() {
    const today = formatDate(new Date())
    this.setData({
      statusBarHeight: getStatusBarHeight(),
      selectedDate: today
    })
    this.syncCalendarData()
  },

  syncCalendarData() {
    const fallbackDate = formatDate(new Date())
    const selectedDate = this.data.selectedDate || fallbackDate
    const selectedMenu = getTodayMenu(selectedDate)
    const calendarMarks = getMealCalendarMarks()
    const allDishOptions = buildAllDishOptions(selectedMenu)

    this.setData({
      selectedDate,
      selectedMenu,
      calendarMarks,
      isEditing: !!this.data.isEditing,
      allDishOptions
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
        selectedMenu: getTodayMenu(nextDate),
        isEditing: false
      },
      () => {
        this.syncCalendarData()
      }
    )
  },

  onAddDish(event) {
    const dishId =
      event && event.currentTarget && event.currentTarget.dataset
        ? event.currentTarget.dataset.dishId
        : ''
    const selectedDate = this.data.selectedDate

    if (!dishId || !selectedDate) {
      return
    }

    const added = addDishToDate(selectedDate, dishId)
    wx.showToast({
      title: added ? '已添加' : '已在当前菜品',
      icon: 'none'
    })

    if (!added) {
      return
    }

    this.syncCalendarData()
  },

  onToggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  onRemoveDish(event) {
    const dishId =
      event && event.currentTarget && event.currentTarget.dataset
        ? event.currentTarget.dataset.dishId
        : ''
    const selectedDate = this.data.selectedDate

    if (!dishId || !selectedDate) {
      return
    }

    const removed = removeDishFromDate(selectedDate, dishId)
    wx.showToast({
      title: removed ? '已移除' : '移除失败',
      icon: 'none'
    })

    if (!removed) {
      return
    }

    this.syncCalendarData()
  }
})
