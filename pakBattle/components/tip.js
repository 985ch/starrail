Component({
  properties: {
    logs: {
      type: Array,
      value: [],
      observer(val) {
        this.updateLogs(val);
      }
    },
  },
  lifetimes: {
    attached() {
      if(this.timer)clearInterval(this.timer)
    },
    detached() {
      if(this.timer)clearInterval(this.timer)
    }
  },
  data: {
    idx: 0,
    list: [],
    totalCount: 0,
  },
  methods: {
    countAndHide() {
      const { totalCount, list } = this.data;
      for(let i = 0; i < list.length; i++) {
        const log = list[i];
        if(log.count<=0) continue;
        log.count--;
        if(log.count<=0) {
          const id = '#tip'+log.idx;
          if(log.showed) {
            this.animate(id, [{opacity: 1},{ opacity: 0 }], 100, ()=>{
              this.clearAnimation(id);
            })
          } else {
            log.showed = true;
            log.count = 30;
            this.animate(id, [{opacity: 0},{ opacity: 1 }], 100)
          }
        }
      }
      const newCount = totalCount - 1;
      if(this.timer && newCount<=0) {
        clearInterval(this.timer);
      }
      this.setData({list, totalCount: newCount});
    },
    updateLogs(logs) {
      const list = [];
      const idx = this.data.idx;
      for(let i = 0; i < logs.length; i++) {
        list.push({
          type: logs[i].type,
          text: logs[i].text,
          count: i + 1,
          idx: idx + i,
          showed: false,
        });
      }
      let totalCount = logs.length + 30 + 5;
      this.setData({list, totalCount, idx: idx + logs.length}, ()=>{
        if(this.timer) clearInterval(this.timer);
        if(list.length > 0)this.timer = setInterval(()=>{
          this.countAndHide();
        }, 100);
      });
    },
  }
})