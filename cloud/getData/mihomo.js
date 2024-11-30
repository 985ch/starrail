const axios = require('axios')
// 从mihomo的接口获取展柜数据
async function getMihomoData(cloud, openid, uid) {
  //return { err: '版本更新维护中' }
  const table = cloud.database({throwOnNotFound: false}).collection('mihomo_ts');
  const now = Date.now();
  const obj = await table.doc(openid).get();
  if(obj.data) {
    if(now - obj.data.ts < 1000 * 60 * 5) {
      return { err: '调用过于频繁' }
    }
    await table.doc(openid).update({
      data: {
        ts: now,
      }
    });
  } else {
    await table.add({
      data: {
        _id: openid,
        ts: now,
        uid,
      }
    })
  }
  try {
    const result = await axios.get(`https://api.mihomo.me/sr_info/${uid}`)
    return result.data
  } catch (err) {
    console.log(err)
    return { err: '获取数据失败'}
  }
}

module.exports = getMihomoData;