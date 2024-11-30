async function checkVip(cloud, openid, name, code) {
  const db = cloud.database({throwOnNotFound: false});
  const userTbl = db.collection('users');
  const userInfo = await userTbl.doc(openid).get();
  const user = userInfo.data;
  if(!user) {
    await userTbl.add({
      data: {
        _id: openid,
        _openid: openid,
        fail: 0,
        ts: now.getTime(),
        score: 5,
        vip: 0,
      }
    })
  };
  if(user && user.fail>=10) return { err: '尝试次数过多'}

  const table = cloud.database().collection('vip');
  const obj = await table.doc(name);
  const data = obj.data;
  if(data) {
    if(data._openid !== '') return { err: '账号已完成认证'}
    const now = Date.now();
    const ts = (new Date(data.ts)).getTime();
    if(now - ts < 1000*60*60*24) {
      await table.doc(data._id).update({data:{ _openid: openid, code:'-', ts: new Date() }});
      await userTbl.doc(openid).update({ data: { vip: data.vip }});
      return { success: '验证成功' }
    }
  }
  const fail = user.fail+1;
  await userTbl.doc(openid).update({ fail: user.fail });
  return { err: '验证码无效('+fail+')' };
}

module.exports = checkVip;
