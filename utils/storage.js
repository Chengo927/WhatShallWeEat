const { dishes, categoryMap } = require('../data/dishes')

const STORAGE_KEY = 'MEAL_PLAN_BY_DATE'
const PENDING_STORAGE_KEY = 'MEAL_PENDING_BY_DATE'
const CALENDAR_MARKS_STORAGE_KEY = 'meal_calendar_marks_v1'

function getCategoryEmoji(categoryId) {
  if (!categoryId || !categoryMap || typeof categoryMap !== 'object') {
    return ''
  }

  const category = categoryMap[categoryId]
  if (!category || typeof category !== 'object') {
    return ''
  }

  return typeof category.emoji === 'string' ? category.emoji : ''
}

function getDishCategoryEmoji(dish) {
  if (!dish || typeof dish !== 'object') {
    return ''
  }

  const categoryId = dish.categoryId || dish.category || ''
  const categoryEmoji = getCategoryEmoji(categoryId)
  if (categoryEmoji) {
    return categoryEmoji
  }

  return typeof dish.emoji === 'string' ? dish.emoji : ''
}

const DISH_CATEGORY_EMOJI_MAP = (Array.isArray(dishes) ? dishes : []).reduce((accumulator, dish) => {
  if (!dish || !dish.id) {
    return accumulator
  }

  const emoji = getDishCategoryEmoji(dish)
  if (emoji) {
    accumulator[dish.id] = emoji
  }
  return accumulator
}, {})

function normalizeStorageMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {}
  }

  const normalized = {}
  const dateKeys = Object.keys(rawValue)
  dateKeys.forEach((dateKey) => {
    const rawIds = rawValue[dateKey]
    if (!Array.isArray(rawIds)) {
      return
    }

    const validIds = rawIds.filter((id) => typeof id === 'string' && id)
    if (!validIds.length) {
      return
    }

    normalized[dateKey] = Array.from(new Set(validIds))
  })
  return normalized
}

function normalizeEmojiList(rawValue) {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const validEmojiList = rawValue.filter((emoji) => typeof emoji === 'string' && emoji)
  return Array.from(new Set(validEmojiList))
}

function normalizeMarksMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {}
  }

  const normalized = {}
  Object.keys(rawValue).forEach((dateKey) => {
    const normalizedEmojiList = normalizeEmojiList(rawValue[dateKey])
    if (normalizedEmojiList.length) {
      normalized[dateKey] = normalizedEmojiList
    }
  })

  return normalized
}

function getMealPlanByDate() {
  try {
    const rawValue = wx.getStorageSync(STORAGE_KEY)
    return normalizeStorageMap(rawValue)
  } catch (error) {
    return {}
  }
}

function getPendingPlanByDate() {
  try {
    const rawValue = wx.getStorageSync(PENDING_STORAGE_KEY)
    return normalizeStorageMap(rawValue)
  } catch (error) {
    return {}
  }
}

function setMealPlanByDate(planByDate) {
  const safeValue = normalizeStorageMap(planByDate)
  wx.setStorageSync(STORAGE_KEY, safeValue)
  return safeValue
}

function setPendingPlanByDate(planByDate) {
  const safeValue = normalizeStorageMap(planByDate)
  wx.setStorageSync(PENDING_STORAGE_KEY, safeValue)
  return safeValue
}

function setMealCalendarMarks(marksByDate) {
  const safeValue = normalizeMarksMap(marksByDate)
  wx.setStorageSync(CALENDAR_MARKS_STORAGE_KEY, safeValue)
  return safeValue
}

function buildDateEmojiMarks(dishIds) {
  if (!Array.isArray(dishIds) || !dishIds.length) {
    return []
  }

  const emojiList = []
  dishIds.forEach((dishId) => {
    const emoji = DISH_CATEGORY_EMOJI_MAP[dishId]
    if (emoji && !emojiList.includes(emoji)) {
      emojiList.push(emoji)
    }
  })

  return emojiList
}

function refreshMealCalendarMarks(planByDate) {
  const safePlan = normalizeStorageMap(planByDate)
  const marksByDate = {}

  Object.keys(safePlan).forEach((dateKey) => {
    const emojiList = buildDateEmojiMarks(safePlan[dateKey])
    if (emojiList.length) {
      marksByDate[dateKey] = emojiList
    }
  })

  return setMealCalendarMarks(marksByDate)
}

function getMealCalendarMarks() {
  try {
    const rawValue = wx.getStorageSync(CALENDAR_MARKS_STORAGE_KEY)
    const marksByDate = normalizeMarksMap(rawValue)
    if (Object.keys(marksByDate).length) {
      return marksByDate
    }

    const planByDate = getMealPlanByDate()
    if (!Object.keys(planByDate).length) {
      return {}
    }

    return refreshMealCalendarMarks(planByDate)
  } catch (error) {
    return {}
  }
}

function getSelectedDishIds(dateStr) {
  if (!dateStr) {
    return []
  }
  const planByDate = getMealPlanByDate()
  const ids = planByDate[dateStr]
  return Array.isArray(ids) ? ids : []
}

function getPendingDishIds(dateStr) {
  if (!dateStr) {
    return []
  }
  const planByDate = getPendingPlanByDate()
  const ids = planByDate[dateStr]
  return Array.isArray(ids) ? ids : []
}

function addDishToDate(dateStr, dishId) {
  if (!dateStr || !dishId) {
    return false
  }

  const planByDate = getMealPlanByDate()
  const currentIds = planByDate[dateStr] || []
  if (currentIds.includes(dishId)) {
    return false
  }

  planByDate[dateStr] = currentIds.concat(dishId)
  const safePlan = setMealPlanByDate(planByDate)
  refreshMealCalendarMarks(safePlan)
  return true
}

function removePendingDishFromDate(dateStr, dishId) {
  if (!dateStr || !dishId) {
    return false
  }

  const planByDate = getPendingPlanByDate()
  const currentIds = planByDate[dateStr]
  if (!Array.isArray(currentIds) || !currentIds.length) {
    return false
  }

  const nextIds = currentIds.filter((id) => id !== dishId)
  if (nextIds.length === currentIds.length) {
    return false
  }

  if (nextIds.length) {
    planByDate[dateStr] = nextIds
  } else {
    delete planByDate[dateStr]
  }

  setPendingPlanByDate(planByDate)
  return true
}

function togglePendingDishToDate(dateStr, dishId) {
  if (!dateStr || !dishId) {
    return false
  }

  const planByDate = getPendingPlanByDate()
  const currentIds = planByDate[dateStr] || []
  if (currentIds.includes(dishId)) {
    removePendingDishFromDate(dateStr, dishId)
    return false
  }

  planByDate[dateStr] = currentIds.concat(dishId)
  setPendingPlanByDate(planByDate)
  return true
}

function removeDishFromDate(dateStr, dishId) {
  if (!dateStr || !dishId) {
    return false
  }

  const planByDate = getMealPlanByDate()
  const currentIds = planByDate[dateStr]
  if (!Array.isArray(currentIds) || !currentIds.length) {
    return false
  }

  const nextIds = currentIds.filter((id) => id !== dishId)
  if (nextIds.length === currentIds.length) {
    return false
  }

  if (nextIds.length) {
    planByDate[dateStr] = nextIds
  } else {
    delete planByDate[dateStr]
  }

  const safePlan = setMealPlanByDate(planByDate)
  refreshMealCalendarMarks(safePlan)
  return true
}

module.exports = {
  STORAGE_KEY,
  PENDING_STORAGE_KEY,
  CALENDAR_MARKS_STORAGE_KEY,
  getMealPlanByDate,
  getPendingPlanByDate,
  getMealCalendarMarks,
  getSelectedDishIds,
  getPendingDishIds,
  addDishToDate,
  togglePendingDishToDate,
  removePendingDishFromDate,
  removeDishFromDate,
  refreshMealCalendarMarks
}
