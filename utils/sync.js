const {saveData, loadData} = require('./util');
const sd = require('./savedata');
const lzString = require('./lz-string');
const equipStore = require('../simulator/equip_store');
const timelineStore = require('../simulator/timeline_store');

const dataKeys = [
  'aiConfigs',
  'enemyTemplates',
  'teams',
  'allTeams',
  'allCharacters',
  'defaultCharacters',
  'equipSetting',
  'wordSetting',
  'upgradeSetting',
  'enemiesTeam',
  'equips_head',
  'equips_hand',
  'equips_body',
  'equips_foot',
  'equips_link',
  'equips_ball',
  'timeline',
  'timeline_data',
]
function uploadData(func){
  wx.showLoading({title: '正在上传数据'});
  const allData = {};
  for(let i = 0; i < dataKeys.length; i++){
    allData[dataKeys[i]] = loadData(dataKeys[i]);
  }
  const base64 = lzString.compressToBase64(JSON.stringify(allData));
  wx.cloud.callFunction({
    name: 'setData',
    data: {
      type: 'uploadData',
      base64: wx.cloud.CDN(base64),
    },
    success: (res) => {
      wx.hideLoading();
      if(res.errMsg === 'cloud.callFunction:ok') {
        if(res.result.err) {
          wx.showToast({
            title: res.result.err,
            icon: 'error',
          });
        } else {
          getApp().globalData.score = res.result.score;
          if(func) func(res.result.score);
          wx.showToast({title: '上传成功', icon: 'success'});
        }
      }
    },
    fail:(err)=>{
      console.log(err);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'error',
      });
    }
  });
}
function downloadData(func) {
  wx.showLoading({title: '正在下载数据'});
  wx.cloud.callFunction({
    name: 'setData',
    data: {
      type: 'downloadData',
    },
    success: (res) => {
      wx.hideLoading();
      if(res.errMsg === 'cloud.callFunction:ok') {
        if(res.result.err) {
          wx.showToast({
            title: res.result.err,
            icon: 'error',
          });
        } else {
          getApp().globalData.score = res.result.score;
          saveAllData(res.result.base64);
          if(func) func(res.result.score);
          wx.showToast({title: '数据下载完成', icon: 'success'});
        }
      }
    },
    fail:(err)=>{
      wx.hideLoading();
      wx.showToast({
        title: '下载失败',
        icon: 'error',
      });
    }
  });
}
function saveAllData(base64) {
  const raw = lzString.decompressFromBase64(base64);
  const allData = JSON.parse(raw);
  for(const key in allData) {
    saveData(key, allData[key]);
  }
  // 重新加载各数据
  const g = getApp().globalData;
  sd('aiConfigs', true).reload();
  sd('enemyTemplates', false).reload();
  sd('equipSetting', false).reload();
  sd('wordSetting', false).reload();
  sd('upgradeSetting', false).reload();
  sd('timeline_data', false).reload();
  g.allTeams = null;
  g.allCharacters = null;
  g.defaultCharacters = null;
  equipStore.reset();
  timelineStore.reset();
  // 重新加载队伍
  getApp().loadTeams();
}
module.exports = {
  uploadData,
  downloadData,
}