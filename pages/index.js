const currentVersion = '241126';
const tipText = '追加2.6的角色，光锥和遗器。项目即将开源，后续本项目将暂停更新。';

let videoAd = null; // 激励广告实例
Page({
  data: {
    tab: '遗器配装',
    evt: null,
  },
  onLoad() {
    this.setData({tid:0, cid: 1});
    if (!videoAd && wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-35f4e603b7c5381b'})
      videoAd.onError((err)=>console.error('激励视频广告加载失败', err))
      videoAd.onClose((res)=>{
        if(res.isEnded)this.setData({evt:{ event:'adClose', time: 15 }})
      });
    }
  },
  onReady() {
  },
  onShow() {
    const self = this;
    getApp().team(0).battleMode = false;
    const g = getApp().globalData;
    if(g.shareID && g.needUpdate) {
      const v = wx.getStorageSync('v');
      g.needUpdate = false;
      if(!v) {
        self.showSharedTeam(g.shareID);
      } else {
        wx.showModal({
          title: '队伍替换提示',
          content: '您正通过他人分享的链接打开小程序，您是否要用对方分享的队伍替换您的当前队伍？',
          cancelText: '不用了',
          confirmText: '马上替换',
          success(res) {
            if(res.confirm) {
              self.showSharedTeam(g.shareID);
            }
          }
        });
      }
    } else {
      wx.getStorage({ key:'v',
        success(res) {
          if(res.data===currentVersion)return;
          wx.showModal({
            title: '更新提示',
            content: tipText,
            showCancel: false,
          })
          wx.setStorage({ key:'v', data: currentVersion })
        },
        fail() {
          wx.showModal({
            title: '数据同步提示',
            content: '您似乎是第一次使用本工具，需要立即导入您的展柜数据吗？',
            cancelText: '不用了',
            confirmText: '立即导入',
            success(res) {
              if(res.confirm) {
                self.setData({tab:'管理队伍'});
              }
            }
          })
          wx.setStorage({ key:'v', data: currentVersion })
        }
      })
    }
  },
  onHide() {
  },
  onUnload() {
  },
  onPullDownRefresh() {
  },
  onReachBottom() {
  },
  // 更新数据
  onUpdateData() {
    this.setData({evt:{event:'update'}})
  },
  onShareAppMessage() {
    return {
      title: '黑塔配装助手',
      path: '/pages/index',
      promise: getApp().shareTeam(),
    }
  },
  // 展示广告
  onShowAds() {
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            console.error('激励视频 广告显示失败', err)
          })
      })
    }
  },
  // 获取并展示分享的队伍
  showSharedTeam(id) {
    wx.showLoading({title: '正在导入'});
    wx.cloud.callFunction({
      name: 'getData',
      data: {type: 'shared', id},
      success: (res)=>{
        wx.hideLoading();
        if(res.errMsg === 'cloud.callFunction:ok') {
          wx.showToast({
            title: '导入完成',
            icon: 'success',
          });
          const team = getApp().team(0);
          team.fromBase64(res.result.base64);
          team.updateData(true);
          this.setData({tab:'数据对比'});
        } else {
          wx.showToast({
            title: '导入队伍失败',
            icon: 'error',
          });
        }
      },
      fail: (err)=>{
        wx.hideLoading();
        wx.showToast({
          title: '导入队伍失败',
          icon: 'error',
        });
        console.log(err);
      }
    });
  }
})