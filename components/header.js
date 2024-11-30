const { getScore, dailyCheckIn, checkSameDate, viewAds } = require('../utils/score');

const pages = [
  { title: '队伍配置', url:'/pages/index' },
  { title: '队伍试用', url:'/pakBattle/pages/battle'},
  { title: '配队广场', url:'/pakRank/pages/rank'},
]

Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    evt: {
      type: Object,
      value: null,
    }
  },
  data: {
    btnList: pages,
    showScoreDlg: false,
    score: -1,
    checkedIn: false,
  },
  methods: {
    // 页面跳转
    gotoPage(e) {
      const { idx } = e.currentTarget.dataset;
      if(pages[idx].title===this.data.title) return;
      wx.redirectTo({ url: pages[idx].url })
    },
    // 打开积分窗口
    onScoreDlg() {
      const self = this;
      if(this.data.score>=0) {
        this.setData({showScoreDlg: true});
        return;
      }
      getScore().then(res=>{
        self.setData({score: res.score, showScoreDlg: true});
      }).catch(err=>{
        console.log(err);
        wx.showToast({title: '读取积分失败', icon: 'none'})
      })
    },
    // 签到
    onCheckIn() {
      const self = this;
      dailyCheckIn().then(res =>{
        if(!res.err) {
          self.setData({ score: res.score, checkedIn: true });
        }
        wx.showToast({
          title: res.err || (res.add>0? '签到成功+' + res.add: '今日已签到'),
          icon: 'none'
        })
      }).catch(err => {
        if(typeof err === 'string'){
          wx.showToast({title: err, icon: 'none'})
        } else {
          throw err;
        }
      })
    },
    // 更新积分数值
    onUpdate() {
      const now = new Date();
      const cDate = getApp().globalData.checkDate? new Date(getApp().globalData.checkDate): null;
      const score = getApp().globalData.score;
      const checkedIn = cDate? checkSameDate(now, cDate): false;
      this.setData({ checkedIn, score });
    },
    // 支持作者
    onSupport() {
      const self = this;
      wx.showModal({
        title: '获取积分',
        content: '你将要观看一个6~15秒的视频广告以获取30积分，继续吗？',
        success: res => {
          if (res.confirm) {
            self.triggerEvent('showAd', {});
          }
        }
      })
    },
    // 广告关闭
    onAdClose(time) {
      const self = this;
      viewAds(time).then((score)=>{
        self.setData({ score });
      }).catch(err=>{
        console.log(err);
        wx.showToast({title: '获取积分失败，请向开发者反馈', icon: 'none', duration: 5000})
      });
    },
  },
  lifetimes: {
    created() {
      
    },
    attached() {
      const now = new Date();
      const cDate = getApp().globalData.checkDate? new Date(getApp().globalData.checkDate): null;
      const score = getApp().globalData.score;
      const checkedIn = cDate? checkSameDate(now, cDate): false;
      this.setData({ checkedIn, score });
      if(score<0) {
        getScore().then(res=>{
          this.setData({score: res.score});
        })
      }
    },
  },
  observers: {
    evt: function(evt) {
      if(!evt) return;
      if(evt.event === 'update') {
        this.onUpdate();
      } else if(evt.event === 'adClose') {
        this.onAdClose(evt.time);
      }
    }
  }
})