// components/my-picker.js
Component({
  properties: {
    list: {
      type: Array,
      value: [],
    },
    value: {
      type: Array,
      value: [ 0, 0 ],
    },
    show: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    selected: [ 0, 0],
    showDrawer: false,
  },
  methods: {
    showDrawer() {
      this.setData({showDrawer: true})
    },
    onChange(e) {
      this.setData({ selected: e.detail.value})
    },
    onCancel() {
      this.setData({showDrawer: false})
    },
    onOK() {
      const { list, selected } = this.data;
      this.setData({showDrawer: false})
      if(list.length===0) return;
      const idx1 = Math.min(list.length-1, Math.max(0, selected[0]));
      const idx2 = Math.min(list[idx1].data.length-1, Math.max(0, selected[1]));
      const item = this.data.list[idx1].data[idx2]
      const name = item.name || item;
      this.triggerEvent('select', {
        value: [ idx1, idx2 ],
        name,
      });
    },
  },
  observers: {
    value: function(v){
      const { list } = this.data;
      if(list.length===0) return;
      v[0] = Math.min(list.length-1, Math.max(0, v[0]));
      const subList = list[v[0]].data;
      v[1] =  Math.min( subList.length-1, Math.max(0, v[1]));
      this.setData({ selected: v });
    },
    show: function(v) {
      this.setData({showDrawer: v})
    }
  }
})
