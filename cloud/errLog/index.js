'use strict';
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const table = cloud.database().collection('errlog');
  await table.add({
    data:{
      msg: event.msg,
      stack: event.stack,
      team: event.team,
      version: event.version,
      appId: cloud.getWXContext().APPID,
      timestamp: cloud.database().serverDate(),
    }
  });
  return { msg: 'ok' }
}
