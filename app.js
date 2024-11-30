const Team = require('./simulator/team');
const { fixJson } = require('./simulator/characters/index');
const { saveData, loadData } = require('./utils/util');
// app.js
App({
  onLaunch({ query }) {
    wx.cloud.init({
      env: 'starrail-1gdwst2671a0f8d2', // TODO: 换成你自己的小程序信息
      traceUser: false,
    });
    this.loadTeams();
    if(query && query.id) {
      this.globalData.shareID = query.id;
      this.globalData.needUpdate = true;
    }
  },
  onShow({ query }) {
    const g = this.globalData;
    if(!g.checkDate) {
      const ts = wx.getStorageSync('checkDate');
      g.checkDate = ts? new Date(ts): null;
    }
    if(query && query.id) {
      if(!g.needUpdate) g.needUpdate = (query.id !== g.shareID);
      g.shareID = query.id;
    }
  },
  onHide() {
    // do nothing
  },
  // 加载前后台队伍
  loadTeams() {
    const list = loadData('teams', true, false);
    const team0 = new Team(list? list[0]: null);
    const json0 = team0.toJSON();
    this.globalData.teams = [
      team0,
      new Team(list && list[1]? list[1]: json0),
      new Team(json0),
    ];
  },
  // 读取队伍
  team(idx) {
    return (idx===0 || idx)? this.globalData.teams[idx]: this.globalData.teams;
  },
  // 自动保存前后台队伍
  autoSave() {
    const teams = this.globalData.teams;
    const data = [ teams[0].toJSON(), teams[1].toJSON()]
    saveData('teams', data);
  },
  // 用指定名称保存队伍数据
  saveTeam(text, json) {
    const allTeams = this.getAllTeams();
    allTeams[text] = json;
    this.globalData.allTeams = allTeams;
    saveData('allTeams', allTeams);
  },
  // 读取队伍数据
  loadTeam(text) {
    const allTeams = this.getAllTeams();
    return allTeams[text] || null;
  },
  // 删除指定队伍数据
  deleteTeam(text) {
    const allTeams = this.getAllTeams();
    if(!allTeams[text]) return;
    delete allTeams[text];
    this.globalData.allTeams = allTeams;
    saveData('allTeams', allTeams);
  },
  // 获取队伍数据列表
  getTeamList() {
    const allTeams = this.getAllTeams();
    return Object.keys(allTeams);
  },
  // 重命名队伍
  renameTeam(oldText, newText) {
    const allTeams = this.getAllTeams();
    if(!allTeams[oldText]) return;
    const newObj = {};
    for(let key in allTeams) {
      if(key === oldText) {
        newObj[newText] = allTeams[key];
      } else {
        newObj[key] = allTeams[key];
      }
    }
    this.globalData.allTeams = newObj;
   saveData('allTeams', newObj);
  },
  // 获取全部队伍数据
  getAllTeams() {
    let allTeams = this.globalData.allTeams;
    if(!allTeams) {
      allTeams = loadData('allTeams') || {};
    }
    return allTeams;
  },
  // 保存角色配置数据
  saveCharacter(name, text, json) {
    const allCharacters = this.getAllCharacters();
    const obj = allCharacters[name] || {};
    obj[text] = json;
    allCharacters[name] = obj;
    this.globalData.allCharacters = allCharacters;
    saveData('allCharacters', allCharacters);
    
    const keyList = Object.keys(allCharacters[name]);
    if(keyList.length == 1) {
      this.setDefaultCharacter(name, keyList[0]);
    }
  },
  // 读取角色配置数据
  loadCharacter(name, text) {
    const allCharacters = this.getAllCharacters();
    return (allCharacters[name] && allCharacters[name][text]) || null;
  },
  // 重命名角色配置数据
  renameCharacterData(name, oldText, newText) {
    const allCharacters = this.getAllCharacters();
    const obj = allCharacters[name] || {};
    if(!obj[oldText]) return;
    const newObj = {};
    for(let key in obj) {
      if(key === oldText) {
        newObj[newText] = obj[key];
      } else {
        newObj[key] = obj[key];
      }
    }
    allCharacters[name] = newObj;
    this.globalData.allCharacters = allCharacters;
    saveData('allCharacters', allCharacters);
     // 若重命名的是默认角色配置则修改默认角色配置为新名字
     if(this.getDefaultCharacter(name) === oldText) {
       this.setDefaultCharacter(name, newText);
     }
  },
  // 删除角色配置数据
  deleteCharacter(name, text) {
    const allCharacters = this.getAllCharacters();
    if(!allCharacters[name] || !allCharacters[name][text]) {
      return;
    }
    delete allCharacters[name][text];
    this.globalData.allCharacters = allCharacters;
    saveData('allCharacters', allCharacters);
    // 若删除的是默认角色配置则修改默认角色配置为第一个配置
    if(this.getDefaultCharacter(name) === text) {
      const keyList = Object.keys(allCharacters[name]);
      if(keyList.length > 0) {
        this.setDefaultCharacter(name, keyList[0]);
      }
    }
  },
  // 获取角色配置数据列表
  getCharacterList(name) {
    const allCharacters = this.getAllCharacters();
    if(allCharacters[name]) {
      return Object.keys(allCharacters[name]);
    }
    return [];
  },
  // 获取全部角色配置数据
  getAllCharacters() {
    let allCharacters = this.globalData.allCharacters;
    if(!allCharacters) {
      allCharacters = loadData('allCharacters') || {};
      fixData(allCharacters, fixJson);
    }
    return allCharacters;
  },
  // 设置默认角色配置
  setDefaultCharacter(name, text) {
    const defaultCharacters = this.getDefaultCharacters();
    defaultCharacters[name] = text;
    this.globalData.defaultCharacters = defaultCharacters;
    saveData('defaultCharacters', defaultCharacters);
  },
  // 获取所有默认角色配置
  getDefaultCharacters() {
    let defaultCharacters = this.globalData.defaultCharacters;
    if(!defaultCharacters) {
      defaultCharacters = loadData('defaultCharacters') || {};
      fixData(defaultCharacters, fixJson);
    }
    return defaultCharacters;
  },
  // 获取默认角色配置的配置名称，若没有配置返回null
  getDefaultCharacter(name) {
    const characterList = this.getCharacterList(name);
    const defaultCharacters = this.getDefaultCharacters();
    if(characterList.indexOf(defaultCharacters[name]) === -1) {
      return null;
    }
    return defaultCharacters[name];
  },
  onError(msg, stack, title='系统错误', team = null) {
    wx.showToast({
      title,
      icon: 'error',
      duration: 2000
    });
    const { envVersion, version } = wx.getAccountInfoSync().miniProgram;
    if(envVersion === 'release') {
      try {
        team = !team? this.globalData.teams[0].stringify(): team;
      } catch(e) {
        team = null;
      }
      wx.cloud.callFunction({
        name: 'errLog',
        data: { msg, stack, team, version },
        success: (res) => {
          // do nothing
        },
        fail:(err)=>{
          // do nothing
        }
      });
    }
  },
  getOpenID(cb) {
    let openid = this.globalData.openid || wx.getStorageSync('oid');
    if(!openid) {
      wx.cloud.callFunction({
        name: 'getData',
        data: {type: 'openid'},
        success: (res) => {
          openid = res.result.openid;
          wx.setStorageSync('oid', openid);
          this.globalData.openid = openid;
          cb(openid);
        },
        fail: (err) => {
          cb(null);
        }
      });
    } else {
      this.globalData.openid = openid;
      cb(openid);
    }
  },
  // 分享当前队伍
  shareTeam() {
    return new Promise((resolve, reject) => {
      const team = this.globalData.teams[0];
      const base64 = team.toBase64();
      wx.cloud.callFunction({
        name: 'setData',
        data: {
          type: 'shareTeam',
          members: team.members.filter(m => m).map(m => m.name),
          base64: wx.cloud.CDN(base64),
        },
        success: (res)=>{
          const id = res.result.id;
          if(id) {
            resolve({
              title: '黑塔配装-分享队伍',
              path: '/pages/index?id=' + id,
            });
          } else {
            reject(res.result.err || '发生未知错误');
          }
        },
        fail: (err)=>{
          console.log(err);
          reject(err);
        }
      })
    })
  },
  globalData: {
    teams: [],
    allTeams: null,
    allCharacters: null,
    defaultCharacters: null,
    battleTeam: null,
    score: -1, // 积分,-1表示未初始化
    checkDate: null, // 上次签到日期
    equipSets: {}, // 全局全角色配装列表
    equipWords: {}, // 全局全角色最佳词条配比
    thanksList: null, // 感谢列表
    openid: null, // 用户openid
    
    vip: 0, // 用户是否VIP 0 否 1 普通VIP 2 高级VIP
    shareID: null, // 分享ID
    needUpdate: false, // 是否需要更新分享ID

    teamGroups: null, // 队伍分组
    newTeams: null, // 新队伍信息
    myTeams: null, // 我的队伍
    searchInfo: null, // 搜索条件
    searchResults: null, // 搜索结果
  }
})
// 修正错误数据
function fixData(json, fixData) {
  for(let key in fixData) {
    const newKey = fixData[key];
    if(json[key]){
      json[newKey]=json[key];
      delete json[key];
    }
  }
}