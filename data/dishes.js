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

const dishes = [
  {
    id: 'dish_001',
    name: '小炒肉',
    desc: '辣椒与肉片快炒，口感鲜香下饭。',
    categoryId: 'pork',
    category: 'pork',
    emoji: '🐖'
  },
  {
    id: 'dish_002',
    name: '小炒黄牛肉',
    desc: '嫩牛肉搭配青椒，香辣开胃。',
    categoryId: 'beef',
    category: 'beef',
    emoji: '🥘'
  },
  {
    id: 'dish_003',
    name: '清蒸鱼',
    desc: '鱼肉细嫩，葱姜提鲜，口味清爽。',
    categoryId: 'fish',
    category: 'fish',
    emoji: '🐟'
  },
  {
    id: 'dish_004',
    name: '清蒸虾',
    desc: '虾肉弹嫩，低油清淡，适合晚餐。',
    categoryId: 'shrimp',
    category: 'shrimp',
    emoji: '🦐'
  },
  {
    id: 'dish_005',
    name: '宫保鸡丁',
    desc: '鸡丁配花生与微辣酱汁，咸香平衡。',
    categoryId: 'chicken',
    category: 'chicken',
    emoji: '🍗'
  },
  {
    id: 'dish_006',
    name: '柠香鸡胸',
    desc: '鸡胸肉口感轻盈，带微酸柠檬香。',
    categoryId: 'chicken',
    category: 'chicken',
    emoji: '🍋'
  },
  {
    id: 'dish_007',
    name: '番茄龙利鱼',
    desc: '番茄汤底酸甜适中，鱼片软嫩。',
    categoryId: 'fish',
    category: 'fish',
    emoji: '🍅'
  },
  {
    id: 'dish_008',
    name: '啤酒鸭',
    desc: '鸭肉焖煮入味，酱香里带一点酒香。',
    categoryId: 'duck',
    category: 'duck',
    emoji: '🦆'
  },
  {
    id: 'dish_009',
    name: '红烧排骨',
    desc: '排骨酱香浓郁，咸甜平衡，适合配饭。',
    categoryId: 'pork',
    category: 'pork',
    emoji: '🍖'
  },
  {
    id: 'dish_010',
    name: '蒜蓉粉丝虾',
    desc: '蒜蓉香味浓郁，虾与粉丝吸汁入味。',
    categoryId: 'shrimp',
    category: 'shrimp',
    emoji: '🍤'
  },
  {
    id: 'dish_011',
    name: '白灼生菜',
    desc: '清爽脆嫩，蒜蓉酱汁提味，适合搭配重口菜。',
    categoryId: 'vegetable',
    category: 'vegetable',
    emoji: '🥬'
  },
  {
    id: 'dish_012',
    name: '地三鲜',
    desc: '茄子土豆青椒同炒，口感丰富又下饭。',
    categoryId: 'vegetable',
    category: 'vegetable',
    emoji: '🍆'
  },
  {
    id: 'dish_013',
    name: '寿喜锅',
    desc: '锅物搭配丰富食材，适合想吃点特别的时候。',
    categoryId: 'special',
    category: 'special',
    emoji: '🍲'
  },
  {
    id: 'dish_014',
    name: '麻辣香锅',
    desc: '可搭配多种荤素食材，麻辣浓郁，选择自由。',
    categoryId: 'special',
    category: 'special',
    emoji: '🌶️'
  },
  {
    id: 'dish_015',
    name: '柠檬鸭',
    desc: '酸香开胃，鸭肉紧实，风味偏广西家常。',
    categoryId: 'duck',
    category: 'duck',
    emoji: '🍋'
  }
]

module.exports = {
  categories,
  categoryMap,
  dishes
}
