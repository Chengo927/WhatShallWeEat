const sourceData = require('../../data/dishes') || {}
const categories = Array.isArray(sourceData.categories) ? sourceData.categories : []
const dishes = Array.isArray(sourceData.dishes) ? sourceData.dishes : []
const DISH_PLACEHOLDER = '/assets/dishes/placeholder.png'
const DISH_IMAGE_BY_ID = dishes.reduce((accumulator, dish) => {
  if (!dish || !dish.id) {
    return accumulator
  }
  accumulator[dish.id] = `/assets/dishes/${dish.id}.png`
  return accumulator
}, {})
const {
  addDishToDate,
  removeDishFromDate,
  getTodayMenu,
  getPendingDishIds,
  getThinkPool,
  confirmLotteryResult,
  togglePendingDishToDate,
  removePendingDishFromDate,
  getMealCalendarMarks
} = require('../../utils/storage')
const { clampLotteryCount, drawWithoutReplacement } = require('../../utils/lottery')

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

function resolveDishImage(dish, imageFallbackMap) {
  if (!dish || typeof dish !== 'object') {
    return DISH_PLACEHOLDER
  }

  const dishId = typeof dish.id === 'string' ? dish.id : ''
  if (dishId && imageFallbackMap && imageFallbackMap[dishId]) {
    return DISH_PLACEHOLDER
  }

  const explicitImage = typeof dish.img === 'string' ? dish.img.trim() : ''
  if (explicitImage) {
    return explicitImage
  }

  const mappedImage = dishId ? DISH_IMAGE_BY_ID[dishId] : ''
  return mappedImage || DISH_PLACEHOLDER
}

function attachDishImages(dishList, imageFallbackMap) {
  if (!Array.isArray(dishList)) {
    return []
  }

  return dishList
    .filter((dish) => dish && dish.id)
    .map((dish) => ({
      ...dish,
      img: resolveDishImage(dish, imageFallbackMap)
    }))
}

Page({
  data: {
    pageReady: false,
    initError: '',
    statusBarHeight: 0,
    today: '',
    dateLabel: '--',
    searchKeyword: '',
    selectedCategory: 'all',
    categories,
    placeholderImg: DISH_PLACEHOLDER,
    imageFallbackMap: {},
    selectedDishIds: [],
    pendingDishIds: [],
    selectedDishes: [],
    thinkPool: [],
    thinkPoolCount: 0,
    calendarMarks: {},
    visibleDishes: [],
    showSummaryPopup: false,
    showLotteryPopup: false,
    showCalendarPopup: false,
    lotteryCount: 1,
    lotteryMaxCount: 0,
    pendingResult: [],
    hasDrawn: false,
    selectedK: 0,
    bottomHint: '上滑查看更多菜品'
  },

  onLoad() {
    this.initPageData()
  },

  onShow() {
    if (!this.data.pageReady) {
      return
    }
    this.syncSelectedDishesSafe()
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
          dateLabel: formatDateLabel(today),
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
      const imageFallbackMap = this.data.imageFallbackMap || {}
      const selectedDishes = getTodayMenu(this.data.today)
      const safeSelectedDishes = attachDishImages(selectedDishes, imageFallbackMap)
      const safeIds = safeSelectedDishes.map((dish) => dish.id).filter((dishId) => !!dishId)
      const pendingDishIds = getPendingDishIds(this.data.today)
      const safePendingIds = Array.isArray(pendingDishIds) ? pendingDishIds : []
      const thinkPool = getThinkPool()
      const safeThinkPool = attachDishImages(thinkPool, imageFallbackMap)
      const calendarMarks = getMealCalendarMarks()
      const lotteryMaxCount = safeThinkPool.length
      const nextLotteryCount = clampLotteryCount(this.data.lotteryCount, lotteryMaxCount)
      const safeLotteryCount = nextLotteryCount || 0

      this.setData(
        {
          selectedDishIds: safeIds,
          pendingDishIds: safePendingIds,
          selectedDishes: safeSelectedDishes,
          thinkPool: safeThinkPool,
          thinkPoolCount: lotteryMaxCount,
          calendarMarks,
          lotteryCount: safeLotteryCount,
          lotteryMaxCount
        },
        () => {
          this.applyFiltersSafe()
        }
      )
    } catch (error) {
      console.error('[order] syncSelectedDishes failed', error)
      this.setData({
        selectedDishIds: [],
        pendingDishIds: [],
        selectedDishes: [],
        thinkPool: [],
        thinkPoolCount: 0,
        calendarMarks: {},
        lotteryCount: 0,
        lotteryMaxCount: 0,
        pendingResult: [],
        hasDrawn: false,
        selectedK: 0,
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
      const imageFallbackMap = this.data.imageFallbackMap || {}
      const selectedMap = {}
      const pendingMap = {}
      const selectedIds = Array.isArray(this.data.selectedDishIds) ? this.data.selectedDishIds : []
      const pendingIds = Array.isArray(this.data.pendingDishIds) ? this.data.pendingDishIds : []

      selectedIds.forEach((dishId) => {
        if (dishId) {
          selectedMap[dishId] = true
        }
      })

      pendingIds.forEach((dishId) => {
        if (dishId) {
          pendingMap[dishId] = true
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
            img: resolveDishImage(dish, imageFallbackMap),
            added: !!selectedMap[dish.id],
            pending: !!pendingMap[dish.id]
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

  markDishImageFallback(dishId) {
    if (!dishId) {
      return
    }

    const currentFallbackMap = this.data.imageFallbackMap || {}
    if (currentFallbackMap[dishId]) {
      return
    }

    const nextFallbackMap = {
      ...currentFallbackMap,
      [dishId]: true
    }

    this.setData(
      {
        imageFallbackMap: nextFallbackMap,
        selectedDishes: attachDishImages(this.data.selectedDishes, nextFallbackMap),
        thinkPool: attachDishImages(this.data.thinkPool, nextFallbackMap),
        pendingResult: attachDishImages(this.data.pendingResult, nextFallbackMap)
      },
      () => {
        this.applyFiltersSafe()
      }
    )
  },

  onDishImageError(event) {
    const dishId = event && event.detail ? event.detail.dishId : ''
    this.markDishImageFallback(dishId)
  },

  onSummaryImageError(event) {
    const dishId =
      event && event.currentTarget && event.currentTarget.dataset
        ? event.currentTarget.dataset.dishId
        : ''
    this.markDishImageFallback(dishId)
  },

  onLotteryImageError(event) {
    const dishId =
      event && event.currentTarget && event.currentTarget.dataset
        ? event.currentTarget.dataset.dishId
        : ''
    this.markDishImageFallback(dishId)
  },

  onAddDish(event) {
    try {
      const { dishId, added } = event.detail || {}
      if (added) {
        const removed = removeDishFromDate(this.data.today, dishId)
        wx.showToast({
          title: removed ? '已取消' : '取消失败',
          icon: removed ? 'success' : 'none'
        })
      } else {
        const created = addDishToDate(this.data.today, dishId)
        if (created) {
          removePendingDishFromDate(this.data.today, dishId)
        }
        wx.showToast({
          title: created ? '已加入' : '已加入今日菜单',
          icon: created ? 'success' : 'none'
        })
      }
      this.syncSelectedDishesSafe()
    } catch (error) {
      console.error('[order] onAddDish failed', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  onTogglePending(event) {
    try {
      const { dishId, dish } = event.detail || {}
      const isPending = togglePendingDishToDate(this.data.today, dishId, dish)
      wx.showToast({
        title: isPending ? '已设为待选' : '已取消待选',
        icon: 'success'
      })
      this.syncSelectedDishesSafe()
    } catch (error) {
      console.error('[order] onTogglePending failed', error)
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  onOpenSummary() {
    this.setData({
      showSummaryPopup: true
    })
  },

  onOpenLottery() {
    const maxCount = Number(this.data.thinkPoolCount) || 0
    if (!maxCount) {
      wx.showToast({
        title: '容我想想里还没有菜',
        icon: 'none'
      })
      return
    }

    this.setData({
      showLotteryPopup: true,
      lotteryMaxCount: maxCount,
      lotteryCount: clampLotteryCount(this.data.lotteryCount, maxCount),
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  onCloseLottery() {
    this.setData({
      showLotteryPopup: false,
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  onDecreaseLotteryCount() {
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    if (!maxCount) {
      return
    }

    const current = clampLotteryCount(this.data.lotteryCount, maxCount)
    const nextCount = Math.max(1, current - 1)
    this.setData({
      lotteryCount: nextCount,
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  onIncreaseLotteryCount() {
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    if (!maxCount) {
      return
    }

    const current = clampLotteryCount(this.data.lotteryCount, maxCount)
    const nextCount = Math.min(maxCount, current + 1)
    this.setData({
      lotteryCount: nextCount,
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  onLotteryCountInput(event) {
    const rawValue = event && event.detail ? event.detail.value : ''
    const inputCount = Number(rawValue) || 0
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    const nextCount = clampLotteryCount(inputCount, maxCount)
    this.setData({
      lotteryCount: nextCount,
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  runLotteryDraw() {
    try {
      const thinkPool = Array.isArray(this.data.thinkPool) ? this.data.thinkPool : []
      const poolSize = thinkPool.length
      if (!poolSize) {
        wx.showToast({
          title: '容我想想里还没有菜',
          icon: 'none'
        })
        return
      }

      const lotteryCount = clampLotteryCount(this.data.lotteryCount, poolSize)
      if (!lotteryCount) {
        wx.showToast({
          title: '请先选择抽取数量',
          icon: 'none'
        })
        return
      }

      const pendingResult = drawWithoutReplacement(thinkPool, lotteryCount)

      this.setData({
        lotteryCount,
        pendingResult,
        hasDrawn: true,
        selectedK: lotteryCount
      })
      wx.showToast({
        title: '抽奖完成，请确认',
        icon: 'none'
      })
    } catch (error) {
      console.error('[order] runLotteryDraw failed', error)
      wx.showToast({
        title: '抽奖失败，请重试',
        icon: 'none'
      })
    }
  },

  onStartLottery() {
    this.runLotteryDraw()
  },

  onRedrawLottery() {
    if (!this.data.hasDrawn) {
      wx.showToast({
        title: '请先开始抽奖',
        icon: 'none'
      })
      return
    }
    this.runLotteryDraw()
  },

  onConfirmLottery() {
    const pendingResult = Array.isArray(this.data.pendingResult) ? this.data.pendingResult : []
    const hasValidResult = this.data.hasDrawn && pendingResult.length > 0

    if (!hasValidResult || this.data.selectedK !== this.data.lotteryCount) {
      wx.showToast({
        title: '请先抽一次',
        icon: 'none'
      })
      return
    }

    try {
      const result = confirmLotteryResult(this.data.today, pendingResult)
      if (!result || !result.success) {
        wx.showToast({
          title: '结果无效，请重抽',
          icon: 'none'
        })
        return
      }

      const addedCount = Number(result.addedCount) || 0
      this.setData({
        showLotteryPopup: false,
        pendingResult: [],
        hasDrawn: false,
        selectedK: 0
      })
      this.syncSelectedDishesSafe()

      wx.showToast({
        title: addedCount > 0 ? `新增${addedCount}道菜` : '已写入抽奖结果',
        icon: 'none'
      })
    } catch (error) {
      console.error('[order] onConfirmLottery failed', error)
      wx.showToast({
        title: '确认失败，请重试',
        icon: 'none'
      })
    }
  },

  onOpenCalendar() {
    this.setData({
      showCalendarPopup: true
    })
  },

  onCloseCalendar() {
    this.setData({
      showCalendarPopup: false
    })
  },

  onCalendarConfirm(event) {
    const { date } = event.detail || {}
    if (!date) {
      this.onCloseCalendar()
      return
    }

    this.setData(
      {
        today: date,
        dateLabel: formatDateLabel(date),
        showCalendarPopup: false
      },
      () => {
        this.syncSelectedDishesSafe()
      }
    )
  },

  onCloseSummary() {
    this.setData({
      showSummaryPopup: false,
      showLotteryPopup: false,
      pendingResult: [],
      hasDrawn: false,
      selectedK: 0
    })
  },

  onScrollToLower() {
    this.setData({
      bottomHint: '已滑动到底部'
    })
  }
})
