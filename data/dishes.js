const categories = [
  { id: 'all', label: '全部' },
  { id: 'chicken', label: '鸡肉🐔', emoji: '🐔' },
  { id: 'beef', label: '牛肉🥩', emoji: '🥩' },
  { id: 'pork', label: '猪肉🐖', emoji: '🐖' },
  { id: 'duck', label: '鸭肉🦆', emoji: '🦆' },
  { id: 'fish', label: '鱼肉🐟', emoji: '🐟' },
  { id: 'shrimp', label: '虾类🦐', emoji: '🦐' },
  { id: 'vegetable', label: '蔬菜🥬', emoji: '🥬' },
  { id: 'special', label: '特殊✨', emoji: '✨' }
]

const categoryMap = {
  chicken: {
    name: '鸡肉',
    emoji: '🐔'
  },
  beef: {
    name: '牛肉',
    emoji: '🥩'
  },
  pork: {
    name: '猪肉',
    emoji: '🐖'
  },
  duck: {
    name: '鸭肉',
    emoji: '🦆'
  },
  fish: {
    name: '鱼肉',
    emoji: '🐟'
  },
  shrimp: {
    name: '虾类',
    emoji: '🦐'
  },
  vegetable: {
    name: '蔬菜',
    emoji: '🥬'
  },
  special: {
    name: '特殊',
    emoji: '✨'
  }
}

const PLACEHOLDER_IMG = '/assets/dishes/placeholder.png'

const LOCAL_DISH_IMAGE_MAP = {
  dish_001: '/assets/dishes/dish_001.png',
  dish_002: '/assets/dishes/dish_002.png',
  dish_003: '/assets/dishes/dish_003.png',
  dish_004: '/assets/dishes/dish_004.png',
  dish_005: '/assets/dishes/dish_005.png',
  dish_006: '/assets/dishes/dish_006.png',
  dish_007: '/assets/dishes/dish_007.png',
  dish_010: '/assets/dishes/dish_010.png'
}

function createDish({
  dishId,
  name,
  desc,
  categoryId,
  emoji,
  img = '',
  imgFileId = '',
  xhsLink = ''
}) {
  const normalizedDishId = typeof dishId === 'string' ? dishId : ''
  const normalizedCategoryId = typeof categoryId === 'string' ? categoryId : ''
  const normalizedImg =
    typeof img === 'string' && img ? img : LOCAL_DISH_IMAGE_MAP[normalizedDishId] || PLACEHOLDER_IMG

  return {
    dishId: normalizedDishId,
    id: normalizedDishId,
    name,
    desc,
    categoryId: normalizedCategoryId,
    category: normalizedCategoryId,
    emoji,
    img: normalizedImg,
    imgFileId: typeof imgFileId === 'string' ? imgFileId : '',
    xhsLink: typeof xhsLink === 'string' ? xhsLink : ''
  }
}

const dishes = [
  createDish({
    dishId: 'dish_001',
    name: '小炒肉',
    desc: '辣椒与肉片快炒，口感鲜香下饭。',
    categoryId: 'pork',
    emoji: '🐖'
  }),
  createDish({
    dishId: 'dish_002',
    name: '小炒黄牛肉',
    desc: '嫩牛肉搭配青椒，香辣开胃。',
    categoryId: 'beef',
    emoji: '🥘'
  }),
  createDish({
    dishId: 'dish_003',
    name: '清蒸鱼',
    desc: '鱼肉细嫩，葱姜提鲜，口味清爽。',
    categoryId: 'fish',
    emoji: '🐟'
  }),
  createDish({
    dishId: 'dish_004',
    name: '清蒸虾',
    desc: '虾肉弹嫩，低油清淡，适合晚餐。',
    categoryId: 'shrimp',
    emoji: '🦐'
  }),
  createDish({
    dishId: 'dish_005',
    name: '宫保鸡丁',
    desc: '鸡丁配花生与微辣酱汁，咸香平衡。',
    categoryId: 'chicken',
    emoji: '🍗'
  }),
  createDish({
    dishId: 'dish_006',
    name: '柠香鸡胸',
    desc: '鸡胸肉口感轻盈，带微酸柠檬香。',
    categoryId: 'chicken',
    emoji: '🍋'
  }),
  createDish({
    dishId: 'dish_007',
    name: '番茄龙利鱼',
    desc: '番茄汤底酸甜适中，鱼片软嫩。',
    categoryId: 'fish',
    emoji: '🍅'
  }),
  createDish({
    dishId: 'dish_008',
    name: '啤酒鸭',
    desc: '鸭肉焖煮入味，酱香里带一点酒香。',
    categoryId: 'duck',
    emoji: '🦆'
  }),
  createDish({
    dishId: 'dish_009',
    name: '红烧排骨',
    desc: '排骨酱香浓郁，咸甜平衡，适合配饭。',
    categoryId: 'pork',
    emoji: '🍖'
  }),
  createDish({
    dishId: 'dish_010',
    name: '蒜蓉粉丝虾',
    desc: '蒜蓉香味浓郁，虾与粉丝吸汁入味。',
    categoryId: 'shrimp',
    emoji: '🍤'
  }),
  createDish({
    dishId: 'dish_011',
    name: '白灼生菜',
    desc: '清爽脆嫩，蒜蓉酱汁提味，适合搭配重口菜。',
    categoryId: 'vegetable',
    emoji: '🥬'
  }),
  createDish({
    dishId: 'dish_012',
    name: '地三鲜',
    desc: '茄子土豆青椒同炒，口感丰富又下饭。',
    categoryId: 'vegetable',
    emoji: '🍆'
  }),
  createDish({
    dishId: 'dish_013',
    name: '寿喜锅',
    desc: '锅物搭配丰富食材，适合想吃点特别的时候。',
    categoryId: 'special',
    emoji: '🍲'
  }),
  createDish({
    dishId: 'dish_014',
    name: '麻辣香锅',
    desc: '可搭配多种荤素食材，麻辣浓郁，选择自由。',
    categoryId: 'special',
    emoji: '🌶️'
  }),
  createDish({
    dishId: 'dish_015',
    name: '柠檬鸭',
    desc: '酸香开胃，鸭肉紧实，风味偏广西家常。',
    categoryId: 'duck',
    emoji: '🍋'
  })
]

module.exports = {
  categories,
  categoryMap,
  dishes
}
