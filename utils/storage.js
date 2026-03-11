const { dishes, categoryMap } = require('../data/dishes')

const STORAGE_KEY = 'MEAL_PLAN_BY_DATE'
const PENDING_STORAGE_KEY = 'MEAL_PENDING_BY_DATE'
const CALENDAR_MARKS_STORAGE_KEY = 'meal_calendar_marks_v1'

const THINK_POOL_KEY = 'THINK_POOL'
const TODAY_MENU_PREFIX = 'TODAY_MENU_'
const LAST_LOTTERY_RESULT_PREFIX = 'LAST_LOTTERY_RESULT_'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

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

function getDishId(dish) {
  if (!dish || typeof dish !== 'object') {
    return ''
  }

  if (typeof dish.dishId === 'string' && dish.dishId) {
    return dish.dishId
  }

  return typeof dish.id === 'string' ? dish.id : ''
}

function getDishLink(dish) {
  if (!dish || typeof dish !== 'object') {
    return ''
  }

  const fieldNames = ['xhsLink', 'recipeUrl', 'recipeLink', 'recipe_link', 'url', 'link']
  for (let index = 0; index < fieldNames.length; index += 1) {
    const fieldName = fieldNames[index]
    if (typeof dish[fieldName] === 'string' && dish[fieldName]) {
      return dish[fieldName]
    }
  }

  return ''
}

const DISH_META_MAP = (Array.isArray(dishes) ? dishes : []).reduce((accumulator, dish) => {
  const dishId = getDishId(dish)
  if (!dishId) {
    return accumulator
  }

  const categoryId =
    typeof dish.categoryId === 'string' && dish.categoryId
      ? dish.categoryId
      : typeof dish.category === 'string'
      ? dish.category
      : ''

  accumulator[dishId] = {
    dishId,
    id: dishId,
    name: typeof dish.name === 'string' ? dish.name : '',
    categoryId,
    category: categoryId,
    emoji: getDishCategoryEmoji(dish)
  }

  accumulator[dishId].img = typeof dish.img === 'string' ? dish.img : ''
  accumulator[dishId].imgFileId = typeof dish.imgFileId === 'string' ? dish.imgFileId : ''
  accumulator[dishId].xhsLink = getDishLink(dish)

  return accumulator
}, {})

const DISH_CATEGORY_EMOJI_MAP = Object.keys(DISH_META_MAP).reduce((accumulator, dishId) => {
  const dish = DISH_META_MAP[dishId]
  if (dish && dish.emoji) {
    accumulator[dishId] = dish.emoji
  }
  return accumulator
}, {})

function isValidDateStr(dateStr) {
  return typeof dateStr === 'string' && DATE_RE.test(dateStr)
}

function getTodayMenuStorageKey(dateStr) {
  return `${TODAY_MENU_PREFIX}${dateStr}`
}

function getLastLotteryResultStorageKey(dateStr) {
  return `${LAST_LOTTERY_RESULT_PREFIX}${dateStr}`
}

function normalizeStorageMap(rawValue) {
  if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
    return {}
  }

  const normalized = {}
  const dateKeys = Object.keys(rawValue)
  dateKeys.forEach((dateKey) => {
    if (!isValidDateStr(dateKey)) {
      return
    }

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

function normalizeDishItem(rawDish) {
  if (!rawDish || typeof rawDish !== 'object') {
    return null
  }

  const dishId = getDishId(rawDish)
  if (!dishId) {
    return null
  }

  const fallbackDish = DISH_META_MAP[dishId] || {}
  const name =
    typeof rawDish.name === 'string' && rawDish.name
      ? rawDish.name
      : typeof fallbackDish.name === 'string'
      ? fallbackDish.name
      : ''
  const emoji =
    typeof rawDish.emoji === 'string' && rawDish.emoji
      ? rawDish.emoji
      : typeof fallbackDish.emoji === 'string'
      ? fallbackDish.emoji
      : ''
  const categoryId =
    typeof rawDish.categoryId === 'string' && rawDish.categoryId
      ? rawDish.categoryId
      : typeof rawDish.category === 'string' && rawDish.category
      ? rawDish.category
      : typeof fallbackDish.categoryId === 'string'
      ? fallbackDish.categoryId
      : ''
  const img =
    typeof rawDish.img === 'string' && rawDish.img
      ? rawDish.img
      : typeof fallbackDish.img === 'string'
      ? fallbackDish.img
      : ''
  const imgFileId =
    typeof rawDish.imgFileId === 'string'
      ? rawDish.imgFileId
      : typeof fallbackDish.imgFileId === 'string'
      ? fallbackDish.imgFileId
      : ''
  const xhsLink = getDishLink(rawDish) || (typeof fallbackDish.xhsLink === 'string' ? fallbackDish.xhsLink : '')

  return {
    dishId,
    id: dishId,
    name,
    categoryId,
    category: categoryId,
    emoji,
    img,
    imgFileId,
    xhsLink
  }
}

function normalizeDishList(rawValue) {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const normalized = []
  const usedIds = {}
  rawValue.forEach((rawDish) => {
    const item = normalizeDishItem(rawDish)
    if (!item || usedIds[item.id]) {
      return
    }
    usedIds[item.id] = true
    normalized.push(item)
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
    if (!isValidDateStr(dateKey)) {
      return
    }

    const normalizedEmojiList = normalizeEmojiList(rawValue[dateKey])
    if (normalizedEmojiList.length) {
      normalized[dateKey] = normalizedEmojiList
    }
  })

  return normalized
}

function readLegacyMap(storageKey) {
  try {
    return normalizeStorageMap(wx.getStorageSync(storageKey))
  } catch (error) {
    return {}
  }
}

function setLegacyMap(storageKey, planByDate) {
  const safeValue = normalizeStorageMap(planByDate)
  wx.setStorageSync(storageKey, safeValue)
  return safeValue
}

function buildDishItemFromId(dishId) {
  if (!dishId) {
    return null
  }
  const fallbackDish = DISH_META_MAP[dishId]
  if (!fallbackDish) {
    return null
  }
  return { ...fallbackDish }
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

function buildDateEmojiMarksFromMenu(dishList) {
  if (!Array.isArray(dishList) || !dishList.length) {
    return []
  }

  const emojiList = []
  dishList.forEach((dish) => {
    const dishId = getDishId(dish)
    if (!dishId) {
      return
    }
    const emoji = (typeof dish.emoji === 'string' && dish.emoji) || DISH_CATEGORY_EMOJI_MAP[dishId]
    if (emoji && !emojiList.includes(emoji)) {
      emojiList.push(emoji)
    }
  })

  return emojiList
}

function setMealCalendarMarks(marksByDate) {
  const safeValue = normalizeMarksMap(marksByDate)
  wx.setStorageSync(CALENDAR_MARKS_STORAGE_KEY, safeValue)
  return safeValue
}

function syncLegacyMealPlanForDate(dateStr, dishList) {
  if (!isValidDateStr(dateStr)) {
    return
  }

  const safeDishList = normalizeDishList(dishList)
  const legacyMap = readLegacyMap(STORAGE_KEY)
  if (safeDishList.length) {
    legacyMap[dateStr] = safeDishList.map((dish) => dish.id)
  } else {
    delete legacyMap[dateStr]
  }

  setLegacyMap(STORAGE_KEY, legacyMap)
}

function syncLegacyPendingForDate(dateStr, dishId, shouldExist) {
  if (!isValidDateStr(dateStr) || !dishId) {
    return
  }

  const legacyMap = readLegacyMap(PENDING_STORAGE_KEY)
  const currentIds = legacyMap[dateStr] || []
  const nextIds = shouldExist
    ? Array.from(new Set(currentIds.concat(dishId)))
    : currentIds.filter((id) => id !== dishId)

  if (nextIds.length) {
    legacyMap[dateStr] = nextIds
  } else {
    delete legacyMap[dateStr]
  }

  setLegacyMap(PENDING_STORAGE_KEY, legacyMap)
}

function syncMealCalendarMarkForDate(dateStr, dishList) {
  if (!isValidDateStr(dateStr)) {
    return
  }

  let marksByDate = {}
  try {
    marksByDate = normalizeMarksMap(wx.getStorageSync(CALENDAR_MARKS_STORAGE_KEY))
  } catch (error) {
    marksByDate = {}
  }

  const emojiList = buildDateEmojiMarksFromMenu(dishList)
  if (emojiList.length) {
    marksByDate[dateStr] = emojiList
  } else {
    delete marksByDate[dateStr]
  }

  setMealCalendarMarks(marksByDate)
}

function getThinkPool() {
  try {
    const rawValue = wx.getStorageSync(THINK_POOL_KEY)
    if (Array.isArray(rawValue)) {
      const normalized = normalizeDishList(rawValue)
      if (normalized.length !== rawValue.length) {
        wx.setStorageSync(THINK_POOL_KEY, normalized)
      }
      return normalized
    }

    const legacyMap = readLegacyMap(PENDING_STORAGE_KEY)
    const usedIds = {}
    const migrated = []
    Object.keys(legacyMap).forEach((dateKey) => {
      const dishIds = legacyMap[dateKey] || []
      dishIds.forEach((dishId) => {
        if (usedIds[dishId]) {
          return
        }
        const dish = buildDishItemFromId(dishId)
        if (!dish) {
          return
        }
        usedIds[dishId] = true
        migrated.push(dish)
      })
    })
    wx.setStorageSync(THINK_POOL_KEY, migrated)
    return migrated
  } catch (error) {
    return []
  }
}

function setThinkPool(dishList) {
  const safeList = normalizeDishList(dishList)
  wx.setStorageSync(THINK_POOL_KEY, safeList)
  return safeList
}

function toggleDishInThinkPool(dishInfo) {
  const safeDish = normalizeDishItem(dishInfo)
  if (!safeDish) {
    return false
  }

  const pool = getThinkPool()
  const currentIndex = pool.findIndex((item) => item.id === safeDish.id)
  if (currentIndex >= 0) {
    pool.splice(currentIndex, 1)
    setThinkPool(pool)
    return false
  }

  setThinkPool(pool.concat(safeDish))
  return true
}

function getTodayMenu(dateStr) {
  if (!isValidDateStr(dateStr)) {
    return []
  }

  const storageKey = getTodayMenuStorageKey(dateStr)
  try {
    const rawValue = wx.getStorageSync(storageKey)
    if (Array.isArray(rawValue)) {
      const normalized = normalizeDishList(rawValue)
      if (normalized.length !== rawValue.length) {
        wx.setStorageSync(storageKey, normalized)
      }
      return normalized
    }
  } catch (error) {
    return []
  }

  const legacyMap = readLegacyMap(STORAGE_KEY)
  const legacyIds = legacyMap[dateStr]
  if (!Array.isArray(legacyIds) || !legacyIds.length) {
    return []
  }

  const migrated = legacyIds.map((dishId) => buildDishItemFromId(dishId)).filter((dish) => !!dish)
  wx.setStorageSync(storageKey, migrated)
  return migrated
}

function setTodayMenu(dateStr, dishList) {
  if (!isValidDateStr(dateStr)) {
    return []
  }

  const safeList = normalizeDishList(dishList)
  wx.setStorageSync(getTodayMenuStorageKey(dateStr), safeList)
  syncLegacyMealPlanForDate(dateStr, safeList)
  syncMealCalendarMarkForDate(dateStr, safeList)
  return safeList
}

function appendDishesToDate(dateStr, dishList) {
  if (!isValidDateStr(dateStr)) {
    return { addedCount: 0, menu: [] }
  }

  const currentMenu = getTodayMenu(dateStr)
  const currentIds = {}
  currentMenu.forEach((dish) => {
    currentIds[dish.id] = true
  })

  const toAppend = normalizeDishList(dishList)
  let addedCount = 0
  const nextMenu = currentMenu.slice()
  toAppend.forEach((dish) => {
    if (currentIds[dish.id]) {
      return
    }
    currentIds[dish.id] = true
    nextMenu.push(dish)
    addedCount += 1
  })

  setTodayMenu(dateStr, nextMenu)
  return {
    addedCount,
    menu: nextMenu
  }
}

function getLastLotteryResult(dateStr) {
  if (!isValidDateStr(dateStr)) {
    return []
  }

  try {
    return normalizeDishList(wx.getStorageSync(getLastLotteryResultStorageKey(dateStr)))
  } catch (error) {
    return []
  }
}

function setLastLotteryResult(dateStr, dishList) {
  if (!isValidDateStr(dateStr)) {
    return []
  }

  const safeList = normalizeDishList(dishList)
  wx.setStorageSync(getLastLotteryResultStorageKey(dateStr), safeList)
  return safeList
}

function confirmLotteryResult(dateStr, pendingResult) {
  if (!isValidDateStr(dateStr)) {
    return {
      success: false,
      addedCount: 0,
      menu: [],
      finalResult: []
    }
  }

  const safePendingResult = normalizeDishList(pendingResult)
  if (!safePendingResult.length) {
    return {
      success: false,
      addedCount: 0,
      menu: getTodayMenu(dateStr),
      finalResult: []
    }
  }

  const appendResult = appendDishesToDate(dateStr, safePendingResult)
  const finalResult = setLastLotteryResult(dateStr, safePendingResult)
  const addedCount =
    appendResult && typeof appendResult.addedCount === 'number' ? appendResult.addedCount : 0
  const menu = appendResult && Array.isArray(appendResult.menu) ? appendResult.menu : getTodayMenu(dateStr)

  return {
    success: true,
    addedCount,
    menu,
    finalResult
  }
}

function getMealPlanByDate() {
  const legacyMap = readLegacyMap(STORAGE_KEY)
  const mergedMap = { ...legacyMap }

  try {
    const storageInfo = wx.getStorageInfoSync()
    const keys = Array.isArray(storageInfo.keys) ? storageInfo.keys : []
    keys.forEach((storageKey) => {
      if (typeof storageKey !== 'string' || storageKey.indexOf(TODAY_MENU_PREFIX) !== 0) {
        return
      }

      const dateStr = storageKey.slice(TODAY_MENU_PREFIX.length)
      if (!isValidDateStr(dateStr)) {
        return
      }

      const menu = getTodayMenu(dateStr)
      if (!menu.length) {
        delete mergedMap[dateStr]
        return
      }

      mergedMap[dateStr] = menu.map((dish) => dish.id)
    })
  } catch (error) {
    return legacyMap
  }

  return normalizeStorageMap(mergedMap)
}

function getPendingPlanByDate() {
  return readLegacyMap(PENDING_STORAGE_KEY)
}

function setMealPlanByDate(planByDate) {
  const safeValue = setLegacyMap(STORAGE_KEY, planByDate)
  Object.keys(safeValue).forEach((dateKey) => {
    const dishList = safeValue[dateKey]
      .map((dishId) => buildDishItemFromId(dishId))
      .filter((dish) => !!dish)
    setTodayMenu(dateKey, dishList)
  })
  refreshMealCalendarMarks(safeValue)
  return safeValue
}

function setPendingPlanByDate(planByDate) {
  return setLegacyMap(PENDING_STORAGE_KEY, planByDate)
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
  if (!isValidDateStr(dateStr)) {
    return []
  }
  return getTodayMenu(dateStr).map((dish) => dish.id)
}

function getPendingDishIds(dateStr) {
  if (!dateStr) {
    return []
  }
  const thinkPool = getThinkPool()
  return thinkPool.map((dish) => dish.id)
}

function addDishToDate(dateStr, dishId) {
  if (!isValidDateStr(dateStr) || !dishId) {
    return false
  }

  const dish = buildDishItemFromId(dishId)
  if (!dish) {
    return false
  }

  const currentMenu = getTodayMenu(dateStr)
  if (currentMenu.some((item) => item.id === dish.id)) {
    return false
  }

  setTodayMenu(dateStr, currentMenu.concat(dish))
  return true
}

function removePendingDishFromDate(dateStr, dishId) {
  if (!dishId) {
    return false
  }

  const thinkPool = getThinkPool()
  const nextPool = thinkPool.filter((dish) => dish.id !== dishId)
  const changed = nextPool.length !== thinkPool.length
  if (changed) {
    setThinkPool(nextPool)
  }

  if (isValidDateStr(dateStr)) {
    syncLegacyPendingForDate(dateStr, dishId, false)
  }
  return changed
}

function togglePendingDishToDate(dateStr, dishId, dishInfo) {
  if (!dishId) {
    return false
  }

  const fallbackDish = buildDishItemFromId(dishId)
  const safeDish = normalizeDishItem(dishInfo || fallbackDish)
  if (!safeDish) {
    return false
  }

  const isPending = toggleDishInThinkPool(safeDish)
  if (isValidDateStr(dateStr)) {
    syncLegacyPendingForDate(dateStr, dishId, isPending)
  }
  return isPending
}

function removeDishFromDate(dateStr, dishId) {
  if (!isValidDateStr(dateStr) || !dishId) {
    return false
  }

  const currentMenu = getTodayMenu(dateStr)
  if (!currentMenu.length) {
    return false
  }

  const nextMenu = currentMenu.filter((dish) => dish.id !== dishId)
  if (nextMenu.length === currentMenu.length) {
    return false
  }

  setTodayMenu(dateStr, nextMenu)
  return true
}

module.exports = {
  STORAGE_KEY,
  PENDING_STORAGE_KEY,
  CALENDAR_MARKS_STORAGE_KEY,
  THINK_POOL_KEY,
  TODAY_MENU_PREFIX,
  LAST_LOTTERY_RESULT_PREFIX,
  getTodayMenuStorageKey,
  getLastLotteryResultStorageKey,
  getMealPlanByDate,
  getPendingPlanByDate,
  getMealCalendarMarks,
  getSelectedDishIds,
  getPendingDishIds,
  getThinkPool,
  setThinkPool,
  toggleDishInThinkPool,
  getTodayMenu,
  setTodayMenu,
  appendDishesToDate,
  getLastLotteryResult,
  setLastLotteryResult,
  confirmLotteryResult,
  addDishToDate,
  togglePendingDishToDate,
  removePendingDishFromDate,
  removeDishFromDate,
  refreshMealCalendarMarks
}
