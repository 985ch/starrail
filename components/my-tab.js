// components/my-tab.js
Component({
  properties: {
    tabs: { // 标签
      type: Array,
      value: [{text:'标签1', value:0}, {text:'标签2', value:1}],
    },
    selected: { // 当前标签
      type: Number,
      value: 0
    },
  },
  data: {
  },
  methods: {
    onTap(e) {
      const data = e.currentTarget.dataset;
      const value = data.value;
      const index = data.index;
      this.setData({ selected: index });
      this.triggerEvent('change', { value, index });
    }
  }
})
