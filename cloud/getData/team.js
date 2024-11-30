// 根据ID获取分享或上传的队伍数据
async function getShared(cloud, type, id) {
  const table = cloud.database({throwOnNotFound: false}).collection(type);
  const { data } = await table.doc(id).get();
  if(!data) return { err: '队伍数据已失效'}
  const base64 = await getTeamData(cloud, data.dataid);
  if(!base64) return { err: '队伍数据已失效'}
  return { base64 };
}

// 获取最热门的队伍
async function getNewTeams(cloud, group) {
  const table = cloud.database().collection('teams');
  const { data } = await table.where({ group }).orderBy('down', 'desc').orderBy('ts', 'desc').limit(20).get();
  return data;
}

// 获取自己分享的队伍
async function getMyTeams(cloud, openid) {
  const table = cloud.database().collection('teams');
  const { data } = await table.where({ _openid: openid }).orderBy('down','desc').orderBy('ts','desc').limit(20).get();
  return data;
}

// 根据条件查找指定队伍
async function findTeams(cloud, group, members, page) {
  const db = cloud.database();
  const table = db.collection('teams');
  const cmd = db.command;
  const collection = table.where(getWhereOptions(cmd, group, members));
  const count = await collection.count();
  const { data } = await collection.orderBy('down','desc').orderBy('ts','desc').skip(page*20).limit(20).get();
  return { data, count: count.total };
}

// 根据ID查找指定队伍
async function getTeam(cloud, id) {
  const table = cloud.database({throwOnNotFound: false}).collection('teams');
  const obj = await table.doc(id).get();
  if(!obj.data) return { data:[], count: 0};
  return { data: [obj.data], count: 1 }
}

// 下载队伍
async function downloadTeam(cloud, openid, id) {
  const table = cloud.database({throwOnNotFound: false}).collection('teams');
  const obj = await table.doc(id).get();
  if(!obj.data) return { err: '未找到指定队伍'};

  const dataid = obj.data.dataid;
  //下载者不是上传者则需要扣积分，同时增加下载次数
  const canDownload = await costScore(cloud, openid, 1);
  if(!canDownload) return { err: '积分不足'};

  if(obj.data._openid !== openid) {
    await table.doc(id).update({
      data: { down: obj.data.down + 1 }
    });
  }
  // 下载次数增加
  return { base64: await getTeamData(cloud, dataid) }
}

// 扣除积分
async function costScore(cloud, openid, cost) {
  const table = cloud.database({throwOnNotFound: false}).collection('users');
  const obj = await table.doc(openid).get();
  if(!obj || !obj.data || obj.data.score < cost) {
    return false;
  }
  await table.doc(openid).update({
    data: { score: obj.data.score - cost }
  });
  return true;
}

// 获取查询条件
function getWhereOptions(cmd, group, members) {
  const list = [{ group }];
  for(let i=0; i<members.length; i++) {
    const cur = members[i];
    list.push(cmd.or([{ member1: cur}, { member2: cur}, { member3: cur}, { member4: cur} ]));
  }
  return cmd.and(list);
}

// 获取队伍数据
async function getTeamData(cloud, id) {
  const table = cloud.database({throwOnNotFound: false}).collection('teamdata');
  const { data } = await table.doc(id).get();
  if(!data) return null;
  return data.base64;
}

module.exports = {
  getShared,
  getMyTeams,
  getNewTeams,
  findTeams,
  getTeam,
  downloadTeam,
}