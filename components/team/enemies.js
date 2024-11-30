const { enemyTeams, enemiesJson } = require('../../simulator/enemy_templates')
const { saveData, loadData } = require('../../utils/util');
const Enemy = require('../../simulator/enemy')
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    myList: null,
    defList: enemyTeams,
  },
  methods: {
    onSave() {
      const self = this;
      wx.showModal({
        title: '保存当前木桩配置',
        content: '新木桩组合',
        editable: true,
        success: (res) => {
          if (res.confirm) {
            if(self.data.myList.find(itm=>itm.text==res.content)) {
              wx.showModal({
                title: '提示',
                content: '该配置已经存在，是否覆盖？',
                success: (r) => {
                  if(r.confirm) {
                    self.saveEnemies(res.content);
                  }
                },
              });
            } else {
              self.saveEnemies(res.content);
            }
          }
        },
      });
    },
    onDelete(e) {
      const index = e.currentTarget.dataset.index;
      const myList = this.data.myList;
      const self = this;
      wx.showModal({
        title: '删除木桩配置',
        content: '确认删除配置['+myList[index].text+']吗？',
        success: (res) => {
          if (res.confirm) {
            myList.splice(index, 1);
            self.setData({ myList });
            saveData('enemiesTeam', myList);
          }
        },
      });
    },
    onLoadData(e) {
      const item = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '加载木桩配置',
        content: '确认加载配置['+item.text+']吗？',
        success: (res) => {
          if (res.confirm) {
            self.importData(item.data);
          }
        },
      });
    },
    onLoadTeam(e) {
      const item = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '加载木桩配置',
        content: '确认加载配置['+item.text+']吗？',
        success: (res) => {
          if (res.confirm) {
            self.importData(item.data.map(e => enemiesJson[e]).join(';'), item.data);
          }
        },
      });
    },
    onExport() {
      this.exportData(true);
    },
    onImport() {
      const self = this;
      wx.showModal({
        title: '导入木桩配置',
        content: '确认从剪贴板导入木桩配置吗？',
        success: (res) => {
          if (res.confirm) {
            wx.getClipboardData({
              success: (res) => {
                self.importData(res.data);
              },
            });
          }
        },
      });
    },
    saveEnemies(name) {
      const myList = this.data.myList;
      const idx = myList.findIndex(itm=>itm.text==name);
      const enemies = this.exportData(false);
      if(idx>=0) {
        myList[idx] = { text: name, data: enemies };
      } else {
        myList.push({text:name, data: enemies });
      }
      this.setData({ myList });
      saveData('enemiesTeam', myList);
      wx.showToast({
        title: '保存成功',
        icon: 'success',
      });
    },
    exportData(toClipboard) {
      const team = getApp().team(0);
      const text = team.enemies.map(e => e? e.stringify() : '无').join(';');
      if(toClipboard) {
        wx.setClipboardData({
          data: text,
          success: () => {
            wx.showToast({
              title: '已复制',
            });
          },
        });
      }
      return text;
    },
    importData(text, names) {
      // 解析数据
      if(typeof text!=='string') {
        wx.showToast({ title: '未复制数据' });
      }
      const enemies = text.split(';');
      if(enemies.length!==5) {
        wx.showToast({ title: '数据错误' });
        return;
      }
      const jsonList = [];
      for(let i=0; i<5; i++) {
        const eTxt = enemies[i];
        if(eTxt === '无') {
          jsonList.push(null);
        } else {
          const json = Enemy.parse(eTxt);
          if(!json) {
            wx.showToast({ title: '数据错误' });
            return;
          }
          if(names) json.template = names[i];
          jsonList.push(json);
        }
      }
      // 应用数据
      const team = getApp().team(0);
      for(let i=0; i<5; i++) {
        team.setEnemy(i, jsonList[i]);
      }
      team.updateData();
      this.triggerEvent('load', { list: jsonList });
      wx.showToast({ title: '导入成功' });
    },
    updateData() {
      const myList = loadData('enemiesTeam') || [];
      this.setData({ myList });
    }
  },
  observers: {
    show(val) {
      if(val)this.updateData();
    }
  },
})