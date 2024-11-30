const LZString = require('./lz-string');

// 实现类似lodash的map方法
function map(obj, f) {
  const result = [];
  for(let key in obj) {
    result.push(f(obj[key], key));
  }
  return result;
}

// 获取对象的部分属性
function pick(obj, list) {
  return list.reduce( (o,k)=>{
    if(typeof obj[k] !== 'undefined' )o[k]=obj[k];
    return o;
  }, {});
}

// 计算角色或武器星数
function getRank(level, upgraded = true) {
  if (level >= 20) {
    let rank = Math.ceil((level - 20) / 10);
    if (upgraded && level % 10 === 0) {
      rank += 1;
    }
    return Math.min(rank, 6);
  }
  return 0;
}

// 根据属性的值和类型得出值的输出字符串
function getValueText(value, type) {
  if( type==='integer' ) {
    return Math.floor(value).toString();
  } else { // type==='percent'
    return (Math.floor(value * 10) * 0.1).toFixed(1) + (type==='percent'?'%':'');
  }
}

// 深度复制对象
function clone(obj) {
  if( !obj || ['number','string','boolean'].includes(typeof obj) ) return obj;
  if( Array.isArray(obj)) {
    const newArray = [];
    for(let i=0;i<obj.length;i++) {
      if(typeof obj[i] === 'object') {
        newArray.push(clone(obj[i]));
      } else {
        newArray.push(obj[i]);
      }
    }
    return newArray;
  }
  const newObj = {};
  for(let key in obj) {
    if(typeof obj[key] === 'object') {
      newObj[key] = clone(obj[key]);
    } else {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
// 节流函数
function throttle(fn, delay) {
  let now = Date.now();
  return function() {
    const context = this;
    const args = arguments;
    if (now + delay - Date.now() < 0) {
      fn.apply(context, args);
      now = Date.now();
    }
  }
}

// 导出数据
function exportData(data) {
  wx.setClipboardData({
    data,
    success: () => wx.showToast({ title: '已复制'}),
  });
}
// 导入数据
function importData(content, title, callback) {
  const fail = () => wx.showToast({title: '读取剪贴板失败', icon: 'error'});
  wx.showModal({
    title,
    content,
    success: (res) => {
      if (res.confirm) {
        wx.getClipboardData({
          success: res => {
            if(typeof res.data==='string') {
              callback(res.data);
            } else {
              fail();
            }
          },
          fail: () => {
            fail();
          }
        })
      }
    },
  });
}

// 读取数据
function loadData(key, needParse = true, sendError = true ) {
  const fs = wx.getFileSystemManager();
  const file = `${wx.env.USER_DATA_PATH}/sd${key}`;
  //console.log('check', file);
  try {
    fs.accessSync(file);
  } catch(e) {
    return loadData_old(key);
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    //console.log('read', file);
    if(raw.length === 0) return null;
    if(!needParse) return raw;
    return JSON.parse(raw);
  } catch(e) {
    wx.showToast({title: '读取失败', icon: 'error'});
    return null;
  }
}
// 读取数据(旧版，用于兼容以前的数据)
function loadData_old(key) {
  const raw = wx.getStorageSync(key);
  if(!raw) return null;
  if(typeof raw !== 'string') return raw;
  const text = LZString.decompress(raw);
  return JSON.parse(text);
}
// 保存数据
function saveData(key, data) {
  const fs = wx.getFileSystemManager();
  const file = `${wx.env.USER_DATA_PATH}/sd${key}`;
  //console.log('write', file);
  try {
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');
  } catch(e) {
    getApp().onError(e.message, '/utils/util(loadData)', '保存失败', key);
  }
}

// 加载JSON文件并读取JSON数据
function getJsonFile(callback) {
  wx.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['json'],
    success: function (res) {
      var filePath = res.tempFiles[0].path;
      wx.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'utf-8',
        success: function (res) {
          wx.showLoading({title:'导入中'});
          try {
            callback(JSON.parse(res.data));
          } catch(e) {
            wx.showToast({
              title: '文件读取失败',
              icon: 'error'
            })
          }
          wx.hideLoading();
        },
        fail: function (res) {
          wx.showToast({
            title: '读取失败',
            icon: 'error'
          })
          wx.hideLoading();
        }
      })
    }
 })
}
module.exports = {
  map,
  pick,
  clone,
  getRank,
  getValueText,
  throttle,
  exportData,
  importData,
  loadData,
  saveData,
  getJsonFile,
}
