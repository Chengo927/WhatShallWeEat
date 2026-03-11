const sourceData = require('../../data/dishes') || {}
const dishes = Array.isArray(sourceData.dishes) ? sourceData.dishes : []
const DISH_MAP = dishes.reduce((accumulator, dish) => {
  if (!dish || !dish.id) {
    return accumulator
  }
  accumulator[dish.id] = dish
  return accumulator
}, {})

function resolveDishLink(dish) {
  if (!dish || typeof dish !== 'object') {
    return ''
  }

  const candidateKeys = ['link', 'url', 'recipeUrl', 'recipeLink']
  for (let index = 0; index < candidateKeys.length; index += 1) {
    const key = candidateKeys[index]
    const value = typeof dish[key] === 'string' ? dish[key].trim() : ''
    if (value) {
      return value
    }
  }

  return ''
}

Page({
  data: {
    dishName: '',
    link: '',
    hasLink: false,
    emptyText: '暂无做法链接'
  },

  onLoad(options) {
    const dishId = options && typeof options.id === 'string' ? decodeURIComponent(options.id) : ''
    const dish = dishId ? DISH_MAP[dishId] : null

    if (!dish) {
      this.setData({
        dishName: '未找到菜品',
        link: '',
        hasLink: false,
        emptyText: '这个菜还没有配置链接。'
      })
      return
    }

    const link = resolveDishLink(dish)
    const dishName = typeof dish.name === 'string' ? dish.name : '菜谱链接'

    this.setData({
      dishName,
      link,
      hasLink: !!link,
      emptyText: link ? '' : '这个菜暂时还没有配置做法链接。'
    })
  }
})
