// 获取积分
async function getActivityData(cloud, openid) {
  const table = cloud.database({throwOnNotFound: false}).collection('users');
  const obj = await table.doc(openid).get();
  const now = new Date();
  if(obj.data) {
    const info = updateScore(now, obj.data);
    if(info.score !== obj.data.score) {
      await table.doc(openid).update({
        data: {
          ts: now.getTime(),
          score: info.score,
        }
      });
    }
    return info;
  } else {
    await table.add({
      data: {
        _id: openid,
        _openid: openid,
        fail: 0,
        ts: now.getTime(),
        score: 5,
        vip: 0,
      }
    })
    return { score: 5, add: 5, vip: 0 };
  }
}
// 更新分数
function updateScore(now, obj) {
  const diff = diffDays(now.getTime(), obj.ts, now.getTimezoneOffset() * 60 * 1000);
  const add = (diff>0 ? 5: 0)
  const score = obj.score + add;
  return { score, add, vip: obj.vip };
}

// 比较两个日期相差的天数，需要用本地时区
function diffDays(ts1, ts2, offset) {
  const day1 = Math.floor((ts1 - offset)/(24*3600*1000));
  const day2 = Math.floor((ts2 - offset)/(24*3600*1000));
  return day1-day2;
}


module.exports = getActivityData