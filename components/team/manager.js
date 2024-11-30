const { read } = require('../../simulator/mihomo');
const { createCharacter } = require('../../simulator/characters/index');
const equipStore = require('../../simulator/equip_store');
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    teamList: [],
    uid: '',
  },
  lifetimes: {
    attached() {
      const uid = wx.getStorageSync('uid') || '';
      this.setData({uid});
      this.updateData();
    }
  },
  methods: {
    onInputUid(e) {
      this.setData({ uid: e.detail.value });
    },
    onImportMihomo() {
      const self = this;
      const ts = wx.getStorageSync('ts');
      const now = Date.now();
      if(ts && now - ts < 1000 * 60 * 5) {
        wx.showToast({
          title: '5分钟内仅能导入一次展柜数据',
          icon: 'none',
        });
        return;
      }
      wx.showModal({
        title: '从展柜导入',
        content: '确认从展柜导入数据吗？当前队伍数据将被覆盖。',
        success: (res) => {
          if (!res.confirm) return;
          wx.setStorageSync('ts', now);
          wx.setStorageSync('uid', self.data.uid);
          wx.showLoading({title: '正在导入'});
          wx.cloud.callFunction({
            name: 'getData',
            data: {
              type: 'mihomo',
              uid: self.data.uid,
            },
            success: (res) => {
              wx.hideLoading();
              if(res.errMsg === 'cloud.callFunction:ok') {
                if(res.result.err) {
                  wx.showToast({
                    title: res.result.err,
                    icon: 'error',
                  });
                } else {
                  self.importData(res.result);
                }
              }
            },
            fail:(err)=>{
              wx.hideLoading();
              wx.showToast({
                title: '调用失败',
                icon: 'error',
              });
            }
          });
        },
      });
    },
    onExportData() {
      const team = getApp().team(0);
      const text = team.stringify();
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({ title: '队伍已复制' });
        },
      });
    },
    onImportData() {
      const self = this;
      wx.showModal({
        title: '确认导入',
        content: '确认导入剪贴板数据吗？当前队伍数据将被覆盖。',
        success: (res) => {
          if (res.confirm) {
            wx.getClipboardData({
              success: (res) => {
                if(typeof res.data !== 'string') {
                  wx.showToast({title: '剪贴板数据读取失败', icon: 'none'});
                  return;
                }
                self.importData(res.data, false);
              }
            });
          }
        },
      });
    },
    importData(data) {
      const self = this;
      const team = getApp().team(0);
      const fromMihomo = typeof data !=='string';
      if(!fromMihomo && data[0]==='{') {
        try {
          data = JSON.parse(data);
        } catch(e) {
          console.log(e);
          wx.showToast({title: '数据解析失败', icon: 'error'});
          return;
        }
      }
      const isJson = typeof data==='object';
      const memberRaws = isJson ? read(data): team.parse(data);
      if(typeof memberRaws ==='string') {
        if(fromMihomo) {
          getApp().onError(memberRaws, '/components/team/manager(importData)', '内容解析失败', data);
        } else {
          wx.showToast({title: memberRaws, icon: 'none'});
        }
        return;
      }
      const equips = []; // 待入库的遗器列表
      let idx = 0; // 队伍索引
      const names = [];
      memberRaws.forEach(raw => {
        if(!raw) return;
        if(idx < 4) {
          team.setMember(idx, createCharacter(team, idx, raw.name, raw));
          idx++;
        }
        getApp().saveCharacter(raw.name, isJson? '展柜导入配置': '剪贴板导入配置', raw);
        equips.push(...raw.equip);
        names.push(raw.name);
      });
      if(fromMihomo) equipStore.addEquips(equips);

      wx.showToast({ title: '导入成功' });
      if(names.length>0) {
        wx.showModal({
          title: '导入成功',
          content: `本次导入了以下角色：${names.join('，')}`,
          showCancel: false,
          success:() => {
            self.triggerEvent('update', { tab: '数据对比'});
          }
        });
      }
    },
    onSaveTeam() {
      const team = getApp().team(0);
      const names = team.getMemberNameList();
      if(names.length === 0) return;
      const self = this;
      wx.showModal({
        title: '保存队伍',
        content: names.join('_'),
        editable: true,
        success: (res) => {
          if (res.confirm) {
            if(self.data.teamList.indexOf(res.content) >=0 ) {
              wx.showModal({
                title: '提示',
                content: '该配置已经存在，是否覆盖？',
                success: (r) => {
                  if(r.confirm) {
                    self.saveTeam(res.content);
                  }
                },
              });
            } else {
              self.saveTeam(res.content);
            }
          }
        },
      });
    },
    onSaveTo(e) {
      const text = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '覆盖队伍',
        content: '确定用当前队伍的数据覆盖[' + text + ']吗？',
        success: (res) => {
          if (res.confirm) {
            self.saveTeam(text);
          }
        },
      });
    },
    onRename(e) {
      const oldText = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '重命名队伍',
        content: oldText,
        editable: true,
        success: (res) => {
          if (res.confirm) {
            if(self.data.teamList.indexOf(res.content) >=0 ) {
              wx.showModal({
                title: '提示',
                content: '同名队伍已经存在',
                showCancel: false,
              });
              return;
            }
            getApp().renameTeam(oldText, res.content);
            self.updateData();
          }
        },
      });
    },
    onDelete(e) {
      const text = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '删除队伍',
        content: '确定要删除队伍[' + text + ']吗？',
        success: (res) => {
          if (res.confirm) {
            getApp().deleteTeam(text);
            self.updateData();
          }
        },
      });
    },
    onLoad(e) {
      const text = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '加载队伍',
        content: '确定要加载队伍[' + text + ']吗，当前队伍数据将会被覆盖。',
        success: (res) => {
          if (res.confirm) {
            getApp().team(0).fromJSON(getApp().loadTeam(text))
            self.triggerEvent('update',  { tab: '数据对比'});
          }
        },
      });
    },
    saveTeam(text) {
      getApp().saveTeam(text, getApp().team(0).toJSON(false, false));
      getApp().autoSave();
      this.updateData();
    },
    onSwitchMode() {
      this.setData({ importMode:!this.data.importMode });
    },
    updateData() {
      //console.log(getApp().getTeamList());
      return this.setData({ teamList: getApp().getTeamList() });
    }
  },
})
