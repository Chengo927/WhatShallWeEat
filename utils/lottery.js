function clampLotteryCount(count, poolSize) {
  const safePoolSize = Number(poolSize) || 0
  if (safePoolSize <= 0) {
    return 0
  }

  const safeCount = Number(count) || 1
  return Math.max(1, Math.min(safeCount, safePoolSize))
}

function drawWithoutReplacement(pool, count) {
  const safePool = Array.isArray(pool) ? pool.slice() : []
  const safeCount = clampLotteryCount(count, safePool.length)
  if (!safeCount) {
    return []
  }

  for (let index = safePool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = safePool[index]
    safePool[index] = safePool[randomIndex]
    safePool[randomIndex] = current
  }

  return safePool.slice(0, safeCount)
}

module.exports = {
  clampLotteryCount,
  drawWithoutReplacement
}
