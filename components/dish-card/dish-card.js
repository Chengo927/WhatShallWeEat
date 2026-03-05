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
    }
  },
  methods: {
    onTapAction() {
      const { dish, disabled } = this.data
      if (disabled || !dish || !dish.id) {
        return
      }

      this.triggerEvent('action', {
        dishId: dish.id,
        dish
      })
    }
  }
})
