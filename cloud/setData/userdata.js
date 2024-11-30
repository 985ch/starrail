const updateScore = require('./score');
const axios = require('axios');
async function uploadData(cloud, openid, tempUrl) {
  const res = await updateScore(cloud, openid, '上传数据');
  if(res.err) return res;
  
  let base64 = '';
  try {
    const result = await axios.get(tempUrl);
    base64 = result.data;
  } catch(e) {
    updateScore(cloud, openid, '上传数据', true);
    return {err: '上传失败'}
  }
  
  const table = cloud.database({throwOnNotFound: false}).collection('userdata');
  const obj = await table.doc(openid).get();
  if(!obj.data) {
    await table.add({
      data: {
        _id: openid,
        data: base64,
        date: (new Date()).toDateString(),
      }
    });
  } else {
    table.doc(openid).update({
      data: {
        data: base64,
        date: (new Date()).toDateString(),
      }
    })
  }
  return res;
}
async function downloadData(cloud, openid) {
  const res = await updateScore(cloud, openid, '下载数据');
  if(res.err) return res;

  const table = cloud.database({throwOnNotFound: false}).collection('userdata');
  const obj = await table.doc(openid).get();
  if(!obj.data) {
    updateScore(cloud, openid, '下载数据', true);
    return { err: '数据尚未上传'}
  }

  return { base64: obj.data.data, score: res.score, change: res.change };
}

module.exports = { uploadData, downloadData };