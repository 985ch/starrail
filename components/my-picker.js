// components/my-picker.js
Component({
  properties: {
    type: {
      type: String,
      value: 'number', // 'array'
    },
    list: {
      type: Array,
      value: [],
    },
    key: {
      type: String,
      value: 'text',
    },
    start: {
      type: Number,
      value: 0,
    },
    end: {
      type: Number,
      value: 10,
    },
    show: {
      type: Boolean,
      value: false,
    },
    value: {
      type: Number,
      value: 0,
    },
  },
  data: {
    selected: [0],
    showDrawer: false,
  },
  methods: {
    showDrawer() {
      this.setData({showDrawer:true, selected: this.data.selected});
    },
    onChange(e) {
      const selected = [e.detail.value[0]];
      this.setData({ selected })
    },
    onCancel() {
      this.setData({showDrawer:false});
    },
    onOK() {
      const sel = this.data.selected[0];
      const value = this.data.type==='number' ? sel + this.data.start : sel;
      this.setData({ showDrawer:false, value }, () => {
        this.triggerEvent('select', { value });
      });
    },
  },
  observers: {
    value: function(v){
      if(this.data.type === 'number') {
        this.setData({ selected: [v - this.data.start] });
      } else {
        this.setData({ selected: [v] });
      }
    },
    show: function(v) {
      this.setData({ showDrawer: v })
    }
  }
})
