// 更新积分
function dailyCheckIn() {
  return new Promise((resolve, reject) => {
    const checkDate = getApp().globalData.checkDate;
    const now = new Date();
    // 没有签到数据或者签到数据已过期
    if(!checkDate || !checkSameDate(now, checkDate)) {
      wx.cloud.callFunction({
        name: 'getData',
        data: { type:'activity', checkIn: 1 },
        success: (res) => {
          const d = res.result;
          if(res.errMsg === 'cloud.callFunction:ok') {
            if(!d.err) {
              getApp().globalData.score = d.score;
              getApp().globalData.checkDate = now;
              wx.setStorage({key: 'checkDate', data: now.getTime()});
              resolve(d);
            } else {
              wx.showToast({
                title: d.err,
                icon: 'error',
                duration: 2000
              });
              resolve(d);
            }
          }
          reject('每日签到失败');
        },
        fail:(err)=>{
          reject('每日签到失败');
        }
      });
    } else {
      reject('本日已签到');
    }
  });
}

// 更新积分
function getScore() {
  return new Promise((resolve, reject) => {
    const table = wx.cloud.database({throwOnNotFound: false}).collection('users');
    getApp().getOpenID((openid)=>{
      if(!openid) {
        return reject('访问数据失败');
      }
      table.doc(openid).get().then((res)=>{
        const d = res.data;
        if(d) {
          const g = getApp().globalData
          g.score = d.score;
          g.vip = d.vip || 0;
          if(!g.checkDate || g.checkDate.getTime() !== d.ts) {
            g.checkDate = new Date(d.ts);
            wx.setStorage({key: 'checkDate', data: d.ts});
          }
          return resolve(d);
        }
        return resolve({score:0, vip: 0});
      }).catch(err=>{
        return reject('访问数据失败');
      })
    });
  });
}

// 比较两个日期是否为同一天
function checkSameDate(date1, date2) {
  const offset = date1.getTimezoneOffset()*60000;
  return Math.floor((date1.getTime()-offset)/(24*3600*1000)) === Math.floor((date2.getTime()-offset)/(24*3600*1000))
}

// 看完广告获取奖励分
function viewAds(time = 15) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'setData',
      data: { type:'adsBonus', adType: time===15? '15秒广告': '30秒广告' },
      success: (res) => {
        if(res.errMsg === 'cloud.callFunction:ok') {
          if(!res.err) {
            getApp().globalData.score = res.result.score;
            wx.showToast({ title: '积分+30', icon: 'success' })
            resolve(res.result.score);
          }
        }
        reject('获取积分失败');
      },
      fail:(err)=>{
        reject('获取积分失败');
      }
    });
  });
}

module.exports = {
  dailyCheckIn,
  getScore,
  checkSameDate,
  viewAds,
}