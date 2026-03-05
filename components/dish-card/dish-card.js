const DISH_PLACEHOLDER_IMAGE = '/assets/dishes/placeholder.png'

function buildDishImageById(dishId) {
  if (typeof dishId !== 'string' || !dishId) {
    return ''
  }

  return `/assets/dishes/${dishId}.png`
}

function resolveDishImage(dish) {
  if (!dish || typeof dish !== 'object') {
    return DISH_PLACEHOLDER_IMAGE
  }

  const preferredImage =
    (typeof dish.img === 'string' && dish.img) ||
    (typeof dish.image === 'string' && dish.image) ||
    (typeof dish.imageUrl === 'string' && dish.imageUrl) ||
    ''

  return preferredImage || buildDishImageById(dish.id) || DISH_PLACEHOLDER_IMAGE
}

Component({
  properties: {
    dish: {
      type: Object,
      value: {},
      observer() {
        this.syncThumbSrc()
      }
    },
    actionText: {
      type: String,
      value: '大吃特吃'
    },
    actionVariant: {
      type: String,
      value: 'primary'
    },
    disabled: {
      type: Boolean,
      value: false
    },
    disabledText: {
      type: String,
      value: '已加入'
    },
    pending: {
      type: Boolean,
      value: false
    },
    pendingText: {
      type: String,
      value: '容我想想'
    },
    pendingActiveText: {
      type: String,
      value: '容我想想'
    }
  },
  data: {
    thumbSrc: DISH_PLACEHOLDER_IMAGE
  },
  lifetimes: {
    attached() {
      this.syncThumbSrc()
    }
  },
  methods: {
    syncThumbSrc() {
      const nextThumbSrc = resolveDishImage(this.data.dish)
      if (nextThumbSrc === this.data.thumbSrc) {
        return
      }

      this.setData({
        thumbSrc: nextThumbSrc
      })
    },

    onThumbError() {
      if (this.data.thumbSrc === DISH_PLACEHOLDER_IMAGE) {
        return
      }

      this.setData({
        thumbSrc: DISH_PLACEHOLDER_IMAGE
      })
    },

    onTapAction() {
      const { dish, disabled } = this.data
      if (!dish || !dish.id) {
        return
      }

      this.triggerEvent('action', {
        dishId: dish.id,
        added: !!disabled,
        dish
      })
    },

    onTapPending() {
      const { dish, pending } = this.data
      if (!dish || !dish.id) {
        return
      }

      this.triggerEvent('pendingaction', {
        dishId: dish.id,
        pending: !!pending,
        dish
      })
    }
  }
})
