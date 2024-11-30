// 云函数入口文件
const cloud = require('wx-server-sdk')
const getMihomoData = require('./mihomo')
const getActivityData = require('./activity');
const { getShared, getNewTeams, getMyTeams, findTeams, getTeam, downloadTeam } = require('./team');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch(event.type) {
    case 'mihomo':
      return await getMihomoData(cloud, OPENID, event.uid);
    case 'activity':
      return await getActivityData(cloud, OPENID, event.checkIn);
    case 'openid':
      return { openid: OPENID };
    case 'shared':
      return await getShared(cloud, 'shared', event.id);
    case 'team':
      return await getShared(cloud, 'teams', event.id);
    case 'newTeams':
      return await getNewTeams(cloud, event.group);
    case 'myTeams':
      return await getMyTeams(cloud, OPENID);
    case 'findTeams':
      return await findTeams(cloud, event.group, event.members, event.page);
    case 'findTeam':
      return await getTeam(cloud, event.id);
    case 'getTeam':
      return await downloadTeam(cloud, OPENID, event.id);
    default:
      return { err: '未知数据类型'}
  }
}

