Component({
  properties: {
    item: { type: Object, value: null },
    type: { type: String, value: 'damage' },
    simple: { type: Boolean, value: false },
  },
  data: {
  },
  methods: {
    onTapNumber(e) {
      const value = e.detail.value;
      this.triggerEvent('tapNumber', { value });
    }
  }
})