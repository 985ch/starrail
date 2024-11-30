'use strict';
const { saveData, loadData } = require('./util');
// 通用数据存取组件
class SaveData {
  constructor(key, hasSubKey) {
    this.key = key;
    this.hasSubKey = hasSubKey;
    this.data = null;
  }
  // 获取存档列表
  getList(subKey) {
    if(this.hasSubKey) {
      if(!this.data) return this.loadList(subKey);
      return this.data[subKey] || {};
    }
    return this.data || this.loadList();
  }
  loadList(subKey) {
    const data = loadData(this.key) || {};
    this.data = data;
    return this.hasSubKey? data[subKey] || {} : data;
  }
  // 重置存档数据
  reload() {
    this.data = null;
  }
  // 弹窗
  success(title) {
    wx.showToast({
      title,
      icon: 'success',
    });
  };
  fail(title) {
    wx.showToast({
      title,
      icon: 'error',
    });
  };
  // 读取存档
  load(name, subKey) {
    const list = this.getList(subKey);
    const data = list[name] || null;
    return data? data : null;
  }
  loadWD(name, content, title, subKey, loadFunc) {
    const self = this;
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          const data = self.load(name, subKey);
          if(data && loadFunc(data)) {
            self.success('加载成功')
          } else {
            self.fail('加载失败')
          }
        }
      },
    });
  }
  // 写入存档
  save(name, data, subKey, showTip, saveFunc) {
    const list = this.getList(subKey);
    list[name] = data;
    if(this.hasSubKey) this.data[subKey] = list;
    saveData(this.key, this.data);
    if(showTip)this.success('保存成功');
    if(saveFunc)saveFunc(name);
  }
  saveWD(data, content, title, subKey, checkRewrite, showTip, saveFunc) {
    const self = this;
    wx.showModal({
      title,
      content,
      editable: true,
      success: (res) => {
        if (res.confirm) {
          const name = res.content;
          if(checkRewrite && this.load(name, subKey)) {
            wx.showModal({
              title: '提示',
              content: '已存在同名内容，是否覆盖？',
              success: (r) => {
                if(r.confirm) {
                  self.save(name, data, subKey, showTip, saveFunc);
                }
              },
            });
          } else {
            self.save(name, data, subKey, showTip, saveFunc);
          }
        }
      }
    });
  }
  // 删除存档
  delete(name, subKey, showTip, deleteFunc) {
    const list = this.getList(subKey);
    if(!list[name])return;
    delete list[name];
    saveData(this.key, this.data);
    if(showTip)this.success('删除成功');
    if(deleteFunc)deleteFunc();
  }
  deleteWD(name, content, title, subKey, showTip, deleteFunc) {
    const self = this;
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          self.delete(name, subKey, showTip, deleteFunc);
        }
      },
    });
  }
  // 重命名存档
  rename(name, newName, subKey, showTip, renameFunc) {
    const list = this.getList(subKey);
    if(name===newName || !list[name])return;
    list[newName] = list[name];
    delete list[name];
    saveData(this.key, this.data);
    if(showTip)this.success('重命名成功');
    if(renameFunc)renameFunc();
  }
  renameWD(name, content, title, subKey, enableRewrite, showTip, renameFunc) {
    const self = this;
    wx.showModal({
      title,
      content,
      editable: true,
      success: (res) => {
        const newName = res.content;
        if (res.confirm) {
          if(this.load(name, subKey)) {
            if(enableRewrite) {
              wx.showModal({
                title: '提示',
                content: '已存在同名内容，是否覆盖？',
                success: (r) => {
                  if(r.confirm) {
                    self.rename(name, newName, subKey, showTip, renameFunc);
                  }
                },
              });
            } else {
              self.fail('存在同名内容')
            }
          } else {
            self.rename(name, newName, subKey, showTip, renameFunc);
          }
        }
      },
    });
  }
}

module.exports = function(key, hasSubKey) {
  const k = 'sd__' + key;
  const g = getApp().globalData;
  if(g[k]) return g[k];
  return g[k] = new SaveData(key, hasSubKey);
}