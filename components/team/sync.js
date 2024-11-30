const { uploadData, downloadData } = require('../../utils/sync');
const util = require('../../utils/util.js');

Component({
  properties: {

  },
  data: {
    score: 0,
  },
  methods: {
    onUpload: util.throttle(function(){
      const self = this;
      const cost = 20;
      if(this.data.score<cost) {
        wx.showToast({
          title: '积分不足无法上传',
          icon: 'none',
        });
      }
      wx.showModal({
        title: '提示',
        content: '是否花费'+cost+'积分上传你的存档数据？此次上传会覆盖旧数据。',
        success(res) {
          if (res.confirm) {
            uploadData((score)=>self.setData({score}));
            self.triggerEvent('update',{});
          }
        }
      })
    }, 500),
    onDownload: util.throttle(function() {
      const self = this;
      const cost = 10;
      if(this.data.score<cost) {
        wx.showToast({
          title: '积分不足无法下载',
          icon: 'none',
        });
      }
      wx.showModal({
        title: '提示',
        content: '是否花费'+cost+'积分下载存档？下载后本地存档数据将被覆盖。',
        success(res) {
          if (res.confirm) {
            downloadData((score)=>{
              self.setData({score});
              self.triggerEvent('update',{});
            });
          }
        }
      })
    }, 500),
  },
  lifetimes: {
    attached() {
      this.setData({
        score: getApp().globalData.score,
      })
    }
  }
})