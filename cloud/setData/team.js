const axios = require('axios');
// 分享队伍
async function shareTeam(cloud, openid, members, tempUrl) {
  const base64 = await getBase64(tempUrl);
  const table = cloud.database({throwOnNotFound: false}).collection('shared');
  const key = members2key(members);
  const { data } = await table.where({ _openid: openid, key}).get();
  const ts = Date.now();
  if(data.length===0) {
    const _id = await randomId(table);
    const dataid = await writeTeamData(cloud, null, base64);
    await table.add({ data: { _id, _openid: openid, key, dataid, ts } });
    return { id: _id };
  }
  await table.doc(data[0]._id).update({ data: { ts } });
  await writeTeamData(cloud, data[0].dataid, base64);
  return { id: data[0]._id };
}

// 上传队伍数据
async function uploadTeam(cloud, openid, group, info, tempUrl) {
  const base64 = await getBase64(tempUrl);
  const table = cloud.database({throwOnNotFound: false}).collection('teams');
  const members = info.map(m => m.name);
  const _id = await randomId(table);
  const dataid = await writeTeamData(cloud, null, base64);
  const data = {
    _id,
    _openid: openid,
    group,
    member1: members[0] || '',
    member2: members[1] || '',
    member3: members[2] || '',
    member4: members[3] || '',
    down: 0,
    like: 0,
    info,
    dataid,
    ts: Date.now()
  }
  table.add({ data });
  return { data };
}

// 点赞队伍
async function likeTeam(cloud, openid, group, teamid) {
  const table = cloud.database({throwOnNotFound: false}).collection('likes');
  const { data } = await table.where({ _openid: openid, group, teamid }).get();
  if(data.length!==0) return;
  table.add({ data: { _openid: openid, group, teamid } });
  await updateTeamLike(cloud, teamid, 1);
}

// 取消点赞
async function unlikeTeam(cloud, openid, group, teamid) {
  const table = cloud.database({throwOnNotFound: false}).collection('likes');
  await table.where({ _openid: openid, group, teamid }).remove();
  await updateTeamLike(cloud, teamid, -1);
}

// 更新队伍点赞数
async function updateTeamLike(cloud, teamid, change) {
  const table = cloud.database({throwOnNotFound: false}).collection('teams');
  const data = await table.doc(teamid).get();
  if(data.data) {
    table.doc(teamid).update({ data: { like: data.data.like+change } });
  }
}

// 删除点赞数据
async function _deleteLikes(cloud, where) {
  const table = cloud.database({throwOnNotFound: false}).collection('likes');
  await table.where(where).remove();
}

// 删除自己上传的队伍数据
async function deleteTeam(cloud, _openid, _id) {
  return _deleteTeams(cloud, { _openid, _id })
}

// 删除一组队伍数据
async function deleteTeams(cloud, group) {
  return _deleteTeams(cloud, { group });
}
// 删除队伍数据
async function _deleteTeams(cloud, where) {
  const table = cloud.database({throwOnNotFound: false}).collection('teams');
  do {
    const { data } = await table.where(where).get();
    if(data.length===0) {
      break;
    }
    for(let i=0;i<data.length; i++) {
      await deleteTeamData(cloud, data[i].dataid);
      await table.doc(data[i]._id).remove();
      _deleteLikes(cloud, { teamid: data[i]._id});
    }
  }while(true);
  return { success: true }
}

// 根据临时url获取base64数据
async function getBase64(url) {
  const result = await axios.get(url);
  return result.data;
}

// 写入队伍数据
async function writeTeamData(cloud, id, base64) {
  const table = cloud.database({throwOnNotFound: false}).collection('teamdata');
  if(id) {
    await table.doc(id).update({ data: { base64 } });
  } else {
    const obj = await table.add({ data: { base64 } });
    return obj._id;
  }
  return id;
}

// 删除队伍数据
async function deleteTeamData(cloud, id) {
  const table = cloud.database({throwOnNotFound: false}).collection('teamdata');
  await table.doc(id).remove();
}

// 生成一个6位的非重复ID
async function randomId(table) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  do {
    let id = '';
    for(let i=0; i<6; i++) {
      id += chars[Math.floor(Math.random()*chars.length)];
    }
    let obj = await table.doc(id).get();
    if(!obj.data) {
      return id;
    }
  } while(true);
}

// 根据成员数组生成key
function members2key(members) {
  return members.sort().join(',');
}

module.exports = {
  uploadTeam,
  shareTeam,
  deleteTeams,
  deleteTeam,
  likeTeam,
  unlikeTeam,
}