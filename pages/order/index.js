const sourceData = require('../../data/dishes') || {}
const categories = Array.isArray(sourceData.categories) ? sourceData.categories : []
const dishes = Array.isArray(sourceData.dishes) ? sourceData.dishes : []
const { addDishToDate, getSelectedDishIds } = require('../../utils/storage')

const DISH_MAP = dishes.reduce((accumulator, dish) => {
  if (dish && dish.id) {
    accumulator[dish.id] = dish
  }
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
    pageReady: false,
    initError: '',
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
    this.initPageData()
  },

  onShow() {
    if (!this.data.pageReady) {
      return
    }

    const today = formatDate(new Date())
    if (today !== this.data.today) {
      this.setData({ today }, () => {
        this.syncSelectedDishesSafe()
      })
    } else {
      this.syncSelectedDishesSafe()
    }
  },

  initPageData() {
    try {
      const windowInfo = typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : {}
      const rawStatusBarHeight = Number(windowInfo.statusBarHeight) || 0
      const menuRect =
        typeof wx.getMenuButtonBoundingClientRect === 'function'
          ? wx.getMenuButtonBoundingClientRect()
          : null
      const statusBarHeight =
        menuRect && menuRect.top && menuRect.bottom
          ? Number(menuRect.bottom + menuRect.top - rawStatusBarHeight) || rawStatusBarHeight + 44
          : rawStatusBarHeight + 44
      const today = formatDate(new Date())

      this.setData(
        {
          statusBarHeight,
          today,
          initError: ''
        },
        () => {
          this.syncSelectedDishesSafe()
          wx.nextTick(() => {
            this.setData({ pageReady: true })
          })
        }
      )
    } catch (error) {
      console.error('[order] initPageData failed', error)
      this.setData({
        pageReady: true,
        initError: 'init_failed'
      })
      this.syncSelectedDishesSafe()
    }
  },

  syncSelectedDishesSafe() {
    try {
      const selectedDishIds = getSelectedDishIds(this.data.today)
      const safeIds = Array.isArray(selectedDishIds) ? selectedDishIds : []
      const selectedDishes = safeIds
        .map((dishId) => DISH_MAP[dishId])
        .filter((dish) => !!dish)

      this.setData(
        {
          selectedDishIds: safeIds,
          selectedDishes
        },
        () => {
          this.applyFiltersSafe()
        }
      )
    } catch (error) {
      console.error('[order] syncSelectedDishes failed', error)
      this.setData({
        selectedDishIds: [],
        selectedDishes: [],
        visibleDishes: []
      })
    }
  },

  onSearchChange(event) {
    const keyword = (event.detail.value || '').replace(/^\s+/, '')
    this.setData(
      {
        searchKeyword: keyword
      },
      () => {
        this.applyFiltersSafe()
      }
    )
  },

  onCategoryChange(event) {
    this.setData(
      {
        selectedCategory: event.detail.value || 'all'
      },
      () => {
        this.applyFiltersSafe()
      }
    )
  },

  applyFiltersSafe() {
    try {
      const selectedCategory = this.data.selectedCategory
      const keyword = (this.data.searchKeyword || '').trim().toLowerCase()
      const selectedMap = {}
      const selectedIds = Array.isArray(this.data.selectedDishIds) ? this.data.selectedDishIds : []

      selectedIds.forEach((dishId) => {
        if (dishId) {
          selectedMap[dishId] = true
        }
      })

      const visibleDishes = dishes
        .filter((dish) => {
          if (!dish || !dish.id) {
            return false
          }
          const matchCategory = selectedCategory === 'all' || dish.category === selectedCategory
          const source = `${dish.name || ''} ${dish.desc || ''}`.toLowerCase()
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
    } catch (error) {
      console.error('[order] applyFilters failed', error)
      this.setData({
        visibleDishes: []
      })
    }
  },

  onAddDish(event) {
    try {
      const { dishId } = event.detail || {}
      const isAdded = addDishToDate(this.data.today, dishId)
      wx.showToast({
        title: isAdded ? '已加入' : '已加入今日菜单',
        icon: isAdded ? 'success' : 'none'
      })
      this.syncSelectedDishesSafe()
    } catch (error) {
      console.error('[order] onAddDish failed', error)
      wx.showToast({
        title: '加入失败，请重试',
        icon: 'none'
      })
    }
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
