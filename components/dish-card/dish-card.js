Component({
  properties: {
    dish: {
      type: Object,
      value: {}
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
  methods: {
    onThumbError() {
      const { dish } = this.data
      if (!dish || !dish.id) {
        return
      }

      this.triggerEvent('imageerror', {
        dishId: dish.id
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
