// components/my-label.js
Component({
  properties: {
    label:{
      type: String,
      value: 'Label',
    },
    size: {
      type: String,
      value: 'normal', // mini
    },
    showtip: {
      type: Boolean,
      value: false,
    },
    tipText: {
      type: String,
      value: '说明',
    },
    labelwidth: {
      type: Number,
      value: 5,
    },
  },
  data: {
  },
  methods: {
    onTipTap() {
      this.triggerEvent('tip',{})
    }
  }
})
