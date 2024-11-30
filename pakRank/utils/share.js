// 获取分组一览
function getGroups() {
  return new Promise((resolve, reject) => {
    const groups = getApp().globalData.teamGroups;
    if(!groups) {
      const table = wx.cloud.database().collection('setting');
      table.doc('groups').get().then(res => {
        const list = res.data.list;
        getApp().globalData.teamGroups = list;
        resolve(list);
      }).catch(err=>{
        reject('获取分组列表失败');
      })
    } else {
      resolve(groups);
    }
  });
}
// 获取新队伍列表
function getNewTeams(group, force) {
  return new Promise((resolve, reject) => {
    // 先取缓存队伍
    const allTeams = getApp().globalData.newTeams;
    const newTeams = allTeams? allTeams[group] || null: null;
    const now = new Date();
    if(newTeams && !force) {
      if(now - newTeams.t <= 1000 * 60 * 60 * 20) {
        resolve(newTeams.data);
        return;        
      }
    }
    // 取在线队伍数据
    wx.cloud.callFunction({
      name: 'getData',
      data: { type:'newTeams', group },
      success: (res) => {
        const d = res.result;
        if(res.errMsg === 'cloud.callFunction:ok') {
          if(!allTeams) getApp().globalData.newTeams = {};
          getApp().globalData.newTeams[group] = { data: d, t: now };
          resolve(d);
          return;
        }
        reject('获取队伍列表失败');
      },
      fail:(err)=>{
        reject('获取队伍列表失败');
      }
    });
  });
}
// 获取我上传的队伍
function getMyTeams() {
  return new Promise((resolve, reject) => {
    // 先取缓存队伍
    const newTeams = getApp().globalData.myTeams;
    if(newTeams) {
      resolve(newTeams);
      return;
    }
    // 取在线队伍数据
    wx.cloud.callFunction({
      name: 'getData',
      data: { type:'myTeams' },
      success: (res) => {
        const d = res.result;
        if(res.errMsg === 'cloud.callFunction:ok') {
          getApp().globalData.myTeams = d;
          resolve(d);
          return;
        }
        reject('获取队伍列表失败');
      },
      fail:(err)=>{
        reject('获取队伍列表失败');
      }
    });
  });
}

// 上传当前队伍
function uploadTeam(group, team) {
  return new Promise((resolve, reject) => {
    const base64 = team.toBase64();
    wx.cloud.callFunction({
      name: 'setData',
      data: {
        type: 'uploadTeam',
        group,
        info: team.getMembersInfo(),
        base64: wx.cloud.CDN(base64),
      },
      success: (res)=>{
        const data = res.result.data;
        getApp().globalData.myTeams.push(data);
        if(data) {
          resolve(data);
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
}

// 删除指定队伍
function deleteTeam(id) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'setData',
      data: {
        type: 'deleteTeam',
        id,
      },
      success: (res)=>{
        const data = res.result.success;
        if(data) {
          const g = getApp().globalData;
          const myTeams = g.myTeams;
          g.myTeams = myTeams.filter(t=>t._id !== id);
          resolve(data);
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
}
// 下载指定队伍
function downloadTeam(id) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        type: 'getTeam',
        id,
      },
      success: (res)=>{
        const data = res.result.base64;
        getApp().globalData.score -= 1;
        if(data) {
          resolve(data);
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
}
// 查询队伍
function findTeams(group, members, page) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        type: 'findTeams',
        group,
        members,
        page,
      },
      success: (res)=>{
        const data = res.result;
        if(data.data) {
          resolve(data);
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
}
// 查询队伍
function findTeam(id) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        type: 'findTeam',
        id,
      },
      success: (res)=>{
        const data = res.result;
        if(data.data) {
          resolve(data);
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
}
module.exports = {
  getGroups,
  getNewTeams,
  getMyTeams,
  uploadTeam,
  deleteTeam,
  downloadTeam,
  findTeams,
  findTeam,
}