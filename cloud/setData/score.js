const types = {
  '15秒广告': 30,
  '30秒广告': 60,
  '上传数据': -20,
  '下载数据': -10,
  '上传队伍': -1,
  '查询队伍': -1,
  '下载队伍': -1,
}

async function updateScore(cloud, openid, type, restore = false) {
  if(!types[type]) return { err: '未知操作' };
  const table = cloud.database({throwOnNotFound: false}).collection('users');
  const obj = await table.doc(openid).get();
  if(!obj.data){
    obj.data = {
      _id: openid,
      _openid: openid,
      fail: 0,
      ts: Date.now(),
      score: 5,
      vip: 0,
    }
    await table.add({ data: obj.data })
  };
  let change = types[type];
  if(change<0 && obj.data.score+change<0) {
    return { err: '积分不足' };
  }
  const score =  obj.data.score + change * (restore ? -1: 1);
  await table.doc(openid).update({ data: { score } })
  return { score, change };
}

module.exports = updateScore;