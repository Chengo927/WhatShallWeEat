Component({
  properties: {
    dish: {
      type: Object,
      value: {}
    },
    actionText: {
      type: String,
      value: '加入'
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
      value: '待选'
    },
    pendingActiveText: {
      type: String,
      value: '待选中'
    }
  },
  methods: {
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
