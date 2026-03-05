const sourceData = require('../../data/dishes') || {}
const categories = Array.isArray(sourceData.categories) ? sourceData.categories : []
const dishes = Array.isArray(sourceData.dishes) ? sourceData.dishes : []
const {
  addDishToDate,
  removeDishFromDate,
  getTodayMenu,
  getPendingDishIds,
  getThinkPool,
  appendDishesToDate,
  getLastLotteryResult,
  setLastLotteryResult,
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
    lotteryResult: [],
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
      const selectedDishes = getTodayMenu(this.data.today)
      const safeSelectedDishes = Array.isArray(selectedDishes) ? selectedDishes : []
      const safeIds = safeSelectedDishes.map((dish) => dish.id).filter((dishId) => !!dishId)
      const pendingDishIds = getPendingDishIds(this.data.today)
      const safePendingIds = Array.isArray(pendingDishIds) ? pendingDishIds : []
      const thinkPool = getThinkPool()
      const safeThinkPool = Array.isArray(thinkPool) ? thinkPool : []
      const calendarMarks = getMealCalendarMarks()
      const lotteryMaxCount = safeThinkPool.length
      const nextLotteryCount = clampLotteryCount(this.data.lotteryCount, lotteryMaxCount)
      const lotteryResult = getLastLotteryResult(this.data.today)

      this.setData(
        {
          selectedDishIds: safeIds,
          pendingDishIds: safePendingIds,
          selectedDishes: safeSelectedDishes,
          thinkPool: safeThinkPool,
          thinkPoolCount: lotteryMaxCount,
          calendarMarks,
          lotteryCount: nextLotteryCount || 0,
          lotteryMaxCount,
          lotteryResult: Array.isArray(lotteryResult) ? lotteryResult : []
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
        lotteryResult: [],
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
      lotteryCount: clampLotteryCount(this.data.lotteryCount, maxCount)
    })
  },

  onCloseLottery() {
    this.setData({
      showLotteryPopup: false
    })
  },

  onDecreaseLotteryCount() {
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    if (!maxCount) {
      return
    }

    const current = clampLotteryCount(this.data.lotteryCount, maxCount)
    this.setData({
      lotteryCount: Math.max(1, current - 1)
    })
  },

  onIncreaseLotteryCount() {
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    if (!maxCount) {
      return
    }

    const current = clampLotteryCount(this.data.lotteryCount, maxCount)
    this.setData({
      lotteryCount: Math.min(maxCount, current + 1)
    })
  },

  onLotteryCountInput(event) {
    const rawValue = event && event.detail ? event.detail.value : ''
    const inputCount = Number(rawValue) || 0
    const maxCount = Number(this.data.lotteryMaxCount) || 0
    this.setData({
      lotteryCount: clampLotteryCount(inputCount, maxCount)
    })
  },

  onStartLottery() {
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

      const lotteryResult = drawWithoutReplacement(thinkPool, lotteryCount)
      setLastLotteryResult(this.data.today, lotteryResult)
      const appendResult = appendDishesToDate(this.data.today, lotteryResult)
      const addedCount =
        appendResult && typeof appendResult.addedCount === 'number' ? appendResult.addedCount : 0

      this.setData({
        lotteryCount,
        lotteryResult
      })
      this.syncSelectedDishesSafe()

      let toastTitle = '抽奖完成'
      if (addedCount > 0) {
        toastTitle = `新增${addedCount}道菜`
      } else {
        toastTitle = '结果已在今日菜单'
      }

      wx.showToast({
        title: toastTitle,
        icon: 'none'
      })
    } catch (error) {
      console.error('[order] onStartLottery failed', error)
      wx.showToast({
        title: '抽奖失败，请重试',
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
      showLotteryPopup: false
    })
  },

  onScrollToLower() {
    this.setData({
      bottomHint: '已滑动到底部'
    })
  }
})
