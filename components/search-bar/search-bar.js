Component({
  properties: {
    value: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: 'Search'
    }
  },
  methods: {
    onInput(event) {
      this.triggerEvent('change', {
        value: event.detail.value || ''
      })
    }
  }
})
