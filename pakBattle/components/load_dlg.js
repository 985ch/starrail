const timelineStore = require('../../simulator/timeline_store');
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    lists: [[],[]], // 两个列表，前一个是匹配的排轴，后续是不匹配的
  },
  methods: {
    updateList() {
      const team = getApp().team(0);
      const lists = timelineStore.getList(team);
      this.setData({lists});
    },
    onDelete(e) {
      const key = e.detail.key;
      timelineStore.removeTimeline(key, ()=>this.updateList());
    },
    onLoad(e) {
      const { members, key } = e.detail;
      const team = getApp().team(0);
      timelineStore.loadTimeline(team, {members, key}, ()=>this.updateList());
      this.triggerEvent('loaded');
    }
  },
  observers: {
    show: function(show) {
      if(show) {
        this.updateList();
      }
    }
  }
})