Component({
  properties: {
    categories: {
      type: Array,
      value: []
    },
    selected: {
      type: String,
      value: 'all'
    },
    vertical: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onTapChip(event) {
      const value = event.currentTarget.dataset.value
      if (!value || value === this.data.selected) {
        return
      }

      this.triggerEvent('change', { value })
    }
  }
})
