// components/roundBtn.js
Component({
  properties: {
    text: {
      type: String,
      value: '文本内容',
      observer: function (val) {
        const l = val.length;
        const p = l / 2 + (l % 2);
        this.setData({
          texts: [val.substr(0, p), val.substr(p, l)]
        })
      }
    },
    activated: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    texts: ['文本','内容'],
  },
  methods: {

  }
})