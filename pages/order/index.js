const { categories, dishes } = require('../../data/dishes')
const { addDishToDate, getSelectedDishIds } = require('../../utils/storage')

const DISH_MAP = dishes.reduce((accumulator, dish) => {
  accumulator[dish.id] = dish
  return accumulator
}, {})

function formatDate(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

Page({
  data: {
    statusBarHeight: 0,
    today: '',
    searchKeyword: '',
    selectedCategory: 'all',
    categories,
    selectedDishIds: [],
    selectedDishes: [],
    visibleDishes: [],
    showSummaryPopup: false,
    bottomHint: '上滑查看更多菜品'
  },

  onLoad() {
    const windowInfo = wx.getSystemInfoSync()
    const statusBarHeight = windowInfo.statusBarHeight || 0
    const today = formatDate(new Date())

    this.setData(
      {
        statusBarHeight,
        today
      },
      () => {
        this.syncSelectedDishes()
      }
    )
  },

  onShow() {
    const today = formatDate(new Date())
    if (today !== this.data.today) {
      this.setData({ today }, () => {
        this.syncSelectedDishes()
      })
    } else {
      this.syncSelectedDishes()
    }
  },

  syncSelectedDishes() {
    const selectedDishIds = getSelectedDishIds(this.data.today)
    const selectedDishes = selectedDishIds
      .map((dishId) => DISH_MAP[dishId])
      .filter((dish) => !!dish)

    this.setData(
      {
        selectedDishIds,
        selectedDishes
      },
      () => {
        this.applyFilters()
      }
    )
  },

  onSearchChange(event) {
    const keyword = (event.detail.value || '').replace(/^\s+/, '')
    this.setData(
      {
        searchKeyword: keyword
      },
      () => {
        this.applyFilters()
      }
    )
  },

  onCategoryChange(event) {
    this.setData(
      {
        selectedCategory: event.detail.value || 'all'
      },
      () => {
        this.applyFilters()
      }
    )
  },

  applyFilters() {
    const selectedCategory = this.data.selectedCategory
    const keyword = (this.data.searchKeyword || '').trim().toLowerCase()
    const selectedMap = {}

    this.data.selectedDishIds.forEach((dishId) => {
      selectedMap[dishId] = true
    })

    const visibleDishes = dishes
      .filter((dish) => {
        const matchCategory = selectedCategory === 'all' || dish.category === selectedCategory
        const source = `${dish.name} ${dish.desc}`.toLowerCase()
        const matchKeyword = !keyword || source.includes(keyword)
        return matchCategory && matchKeyword
      })
      .map((dish) => {
        return {
          ...dish,
          added: !!selectedMap[dish.id]
        }
      })

    this.setData({
      visibleDishes
    })
  },

  onAddDish(event) {
    const { dishId } = event.detail
    const isAdded = addDishToDate(this.data.today, dishId)
    wx.showToast({
      title: isAdded ? '已加入' : '已加入今日菜单',
      icon: isAdded ? 'success' : 'none'
    })

    this.syncSelectedDishes()
  },

  onOpenSummary() {
    this.setData({
      showSummaryPopup: true
    })
  },

  onCloseSummary() {
    this.setData({
      showSummaryPopup: false
    })
  },

  onScrollToLower() {
    this.setData({
      bottomHint: '已滑动到底部'
    })
  }
})
