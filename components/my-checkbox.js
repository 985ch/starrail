// components/my-checkbox.js
Component({
  properties: {
    checked: {
      type: Boolean,
      value: false,
    },
    type: {
      type: String,
      value: 'normal',
    },
    label: {
      type: String,
      value: 'Checkbox',
    },
    left: {
      type: Boolean,
      value: false,
    },
    right: {
      type: Boolean,
      value: false,
    },
    size: {
      type: String,
      value: 'normal',
    },
    disabled: {
      type: Boolean,
      value: false,
    },
  },
  data: {
  },
  methods: {
    onTap() {
      if(this.data.disabled) return;
      const checked = !this.data.checked;
      this.triggerEvent('change', {
        checked
      });
      this.setData({
        checked,
      })
    }
  }
})
