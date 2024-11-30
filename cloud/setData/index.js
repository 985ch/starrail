// 云函数入口文件
const cloud = require('wx-server-sdk')
const updateScore = require('./score');
const { uploadData, downloadData } = require('./userdata');
const checkVip = require('./vip');
const { uploadTeam, shareTeam, deleteTeam, deleteTeams, likeTeam, unlikeTeam } = require('./team');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch(event.type) {
    case 'adsBonus': // 查看广告获取积分奖励
      return await updateScore(cloud, OPENID, event.adType);
    case 'uploadData': // 同步数据到云数据库
      return await uploadData(cloud, OPENID, event.base64);
    case 'downloadData': // 从云端下载数据到本地
      return await downloadData(cloud, OPENID);
    case 'vip': // 校验VIP
      return await checkVip(cloud, OPENID, event.name, event.code);
    case 'shareTeam': // 分享队伍
      return await shareTeam(cloud, OPENID, event.members, event.base64);
    case 'uploadTeam': // 上传队伍
      return await uploadTeam(cloud, OPENID, event.group, event.info, event.base64);
    case 'deleteTeams': // 删除某个分组的队伍
      return await deleteTeams(cloud, event.group);
    case 'deleteTeam': // 删除某个队伍
      return await deleteTeam(cloud, OPENID, event.id);
    case 'likeTeam': // 点赞队伍
      return await likeTeam(cloud, OPENID, event.group, event.id);
    case 'unlikeTeam': // 取消点赞队伍
      return await unlikeTeam(cloud, OPENID, event.group, event.id);
    default:
      return { err: '未知数据类型'}
  }
}