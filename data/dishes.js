const categories = [
  { id: 'all', label: '全部' },
  { id: 'chicken', label: '鸡肉🐔' },
  { id: 'beef', label: '牛肉🥩' },
  { id: 'fish', label: '鱼肉🐟' },
  { id: 'shrimp', label: '虾类🦐' }
]

const dishes = [
  {
    id: 'dish_001',
    name: '小炒肉',
    desc: '辣椒与肉片快炒，口感鲜香下饭。',
    category: 'beef',
    emoji: '🥩'
  },
  {
    id: 'dish_002',
    name: '小炒黄牛肉',
    desc: '嫩牛肉搭配青椒，香辣开胃。',
    category: 'beef',
    emoji: '🥘'
  },
  {
    id: 'dish_003',
    name: '清蒸鱼',
    desc: '鱼肉细嫩，葱姜提鲜，口味清爽。',
    category: 'fish',
    emoji: '🐟'
  },
  {
    id: 'dish_004',
    name: '清蒸虾',
    desc: '虾肉弹嫩，低油清淡，适合晚餐。',
    category: 'shrimp',
    emoji: '🦐'
  },
  {
    id: 'dish_005',
    name: '宫保鸡丁',
    desc: '鸡丁配花生与微辣酱汁，咸香平衡。',
    category: 'chicken',
    emoji: '🍗'
  },
  {
    id: 'dish_006',
    name: '柠香鸡胸',
    desc: '鸡胸肉口感轻盈，带微酸柠檬香。',
    category: 'chicken',
    emoji: '🍋'
  },
  {
    id: 'dish_007',
    name: '番茄龙利鱼',
    desc: '番茄汤底酸甜适中，鱼片软嫩。',
    category: 'fish',
    emoji: '🍅'
  },
  {
    id: 'dish_010',
    name: '蒜蓉粉丝虾',
    desc: '蒜蓉香味浓郁，虾与粉丝吸汁入味。',
    category: 'shrimp',
    emoji: '🍤'
  }
]

module.exports = {
  categories,
  dishes
}
