const createRecycleContext = require('miniprogram-recycle-view');

function initResult() {
  return {
    count: 0, // 次数
    maxStep: 0, // 最大步数
    minStep: 0, // 最小步数
    totalStep: 0, // 累计步数
    maxDmg: 0, // 最大伤害
    minDmg: 0, // 最小伤害
    totalDmg: 0, // 累计伤害
  };
}

Component({
  properties: {
    actions: {
      type: Array,
      value: [],
      observer(list, oldList) {
        if(this.ctx)this.ctx.splice(0, oldList.length, list);
        //this.setData({ top: this.data.selAction * 60 + 60 })
      }
    },
    images: {
      type: Object,
      value: {}
    },
  },
  data: {
    top: 0,
    showList: [],
    selAction: 0,
    dataIdx: [['A','B'],['B', 'A']], // 样式索引

    showDlg: false, // 是否展示排轴分析对话框
    process: 0, // 当前进度
    results: [initResult(), initResult()],
    // 滚动区域宽高
    scrollWidth: 745 * wx.getSystemInfoSync().windowWidth/750,
    scrollHeight: 280 * wx.getSystemInfoSync().windowWidth/750,
  },
  methods: {
    onSelect(e) {
      const { index } = e.currentTarget.dataset;
      this.setData({selAction: index})
    },
    onTest() {
      const self = this;
      const team = getApp().team(0);
      const tl = team.timelineB;
      if(tl.actList.length===0) {
        wx.showToast({
          title: '请先加载参考轴',
          icon: 'none'
        })
        return;
      }
      if(team.logger.logs.length>0) {
        wx.showModal({
          title: '提示',
          content: '重现参考轴将会清除当前日志，并用新的日志代替，确定继续吗？',
          success: (res) => {
            if(res.confirm) {
              tl.testOnce();
              self.triggerEvent('update');
            }
          }
        });
      } else {
        tl.testOnce();
        this.triggerEvent('update');
      }
    },
    getReport() {
      const self = this;
      const teamRaw = getApp().team(0);
      const tlRaw = teamRaw.timelineB;
      if(tlRaw.actList.length===0) {
        wx.showToast({
          title: '请先加载参考轴',
          icon: 'none'
        })
        return;
      }
      wx.showModal({
        title: '提示',
        content: '即将尝试复现参考轴100次之后进行统计，这需要消耗一定的时间，中途小程序无法进行其他操作，确定继续吗？',
        success: (res) => {
          if(res.confirm) {
            this.setData({
              showDlg: true,
              process: 0,
              results: [initResult(), initResult()]
            },()=>{
              const team = teamRaw.clone();
              const tl = team.timelineB;
              tl.fromJSON(tlRaw.toJSON());
              self.runTest(tl);
            })
          }
        }
      });
    },
    runTest(tl) {
      const res = tl.testOnce();
      const idx = res.state==='complete'? 0: 1;
      const result = this.data.results[idx];
      result.count++;
      result.totalStep += res.step;
      result.maxStep = Math.max(result.maxStep, res.step);
      result.minStep = result.minStep===0? res.step: Math.min(result.minStep, res.step);
      result.totalDmg += res.dmg;
      result.maxDmg = Math.max(result.maxDmg, res.dmg)
      result.minDmg = result.minDmg===0? res.dmg: Math.min(result.minDmg, res.dmg);
      this.setData({ process: this.data.process+1, ['results['+idx+']']: result }, ()=>{
        if(this.data.process<100) this.runTest(tl);
      })
    }
  },
  lifetimes: {
    detached() {
      if(this.ctx) this.ctx.destroy();
      this.ctx = null;
    },
    ready() {
      if(this.ctx) return;
      this.ctx = createRecycleContext({
        id: 'showList',
        dataKey: 'showList',
        page: this,
        itemSize: {
          width: 745 * wx.getSystemInfoSync().windowWidth/750,
          height: 60 * wx.getSystemInfoSync().windowWidth/750,
        },
      });
      const actions = this.data.actions;
      if(actions.length>0) {
        this.ctx.append(actions);
        this.setData({ top: actions.length * 60 + 60 })
      }
    },
  },
})