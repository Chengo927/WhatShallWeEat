const STORAGE_KEY = 'MEAL_PLAN_BY_DATE'

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

function getMealPlanByDate() {
  try {
    const rawValue = wx.getStorageSync(STORAGE_KEY)
    return normalizeStorageMap(rawValue)
  } catch (error) {
    return {}
  }
}

function setMealPlanByDate(planByDate) {
  const safeValue = normalizeStorageMap(planByDate)
  wx.setStorageSync(STORAGE_KEY, safeValue)
}

function getSelectedDishIds(dateStr) {
  if (!dateStr) {
    return []
  }
  const planByDate = getMealPlanByDate()
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
  setMealPlanByDate(planByDate)
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

  setMealPlanByDate(planByDate)
  return true
}

module.exports = {
  STORAGE_KEY,
  getMealPlanByDate,
  getSelectedDishIds,
  addDishToDate,
  removeDishFromDate
}
