const fs = wx.getFileSystemManager();
const cloudUrl = 'cloud://starrail-1gdwst2671a0f8d2.7374-starrail-1gdwst2671a0f8d2-1325092414/img/'; // TODO：换成你自己的云开发图片目录
const downloading = {};
// 获取图片地址
function getImage(url, callback) {
  const file = `${wx.env.USER_DATA_PATH}/img${url.replace(/[/]/g, '_')}`;
  try {
    fs.accessSync(file);
    downloading[url] = false;
    return file;
  } catch(e) {
    downloadImage(url, file, callback);
    return '/images/base/unknown.png';
  }
}
// 下载图片
function downloadImage(url, file, callback) {
  if (downloading[url]) {
    setTimeout(()=>downloadImage(url, file, callback), 100);
    return;
  };
  downloading[url] = true;
  wx.cloud.downloadFile({
    fileID: cloudUrl + url,
    success: function (res) {
      downloading[url] = false;
      if (res.statusCode === 200) {
        fs.saveFile({
          filePath: file,
          tempFilePath: res.tempFilePath,
          success: () => callback && callback(file),
        });
        ;
      }
    },
    fail: function (res) {
      downloading[url] = false;
    }
  });
}

module.exports = {
  getImage,
}