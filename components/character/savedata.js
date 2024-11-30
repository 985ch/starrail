const { getDefaultJson } = require('../../simulator/characters/index');
Component({
  properties: {
    name: {
      type: String,
      value: ''
    },
  },
  data: {
    dataList: [],
    defaultChar: null,
    teamList: [],
  },
  methods: {
    onSaveCharacter() {
      const { name } = this.data;
      if(name === '') return;

      const member = getApp().team(0).getMember(name);
      const self = this;
      if(this.data.dataList.length >= 20) {
        wx.showModal({
          title: '提示',
          content: '每个角色最多只能保存20个配置',
          showCancel: false,
        });
        return;
      }
      wx.showModal({
        title: '保存角色配置',
        content: `${member.weapon? member.weapon.base.name + member.weapon.star : '无'}${member.equip.getSetText().join('')}`,
        editable: true,
        success: (res) => {
          if (res.confirm) {
            if(self.data.dataList.indexOf(res.content) >=0 ) {
              wx.showModal({
                title: '提示',
                content: '该配置已经存在，是否覆盖？',
                success: (r) => {
                  if(r.confirm) {
                    self.saveCharacter(res.content);
                  }
                },
              });
            } else {
              self.saveCharacter(res.content);
            }
          }
        },
      });
    },
    onRename(e) {
      const oldText = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '重命名角色配置',
        content: oldText,
        editable: true,
        success: (res) => {
          if (res.confirm) {
            if(self.data.dataList.indexOf(res.content) >=0 ) {
              wx.showModal({
                title: '提示',
                content: '同名配置已经存在',
                showCancel: false,
              });
              return;
            }
            const name = self.data.name;
            getApp().renameCharacterData(name, oldText, res.content);
            self.updateData(name);
          }
        },
      });
    },
    onSetDefault(e) {
      const defaultText = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '修改默认配置',
        content: '确定要把[' + defaultText + ']设置为默认配置吗？',
        success: (res) => {
          if (res.confirm) {
            const name = self.data.name;
            getApp().setDefaultCharacter(name, defaultText);
            self.updateData(name);
          }
        }
      });
    },
    onDelete(e) {
      const text = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '删除角色配置',
        content: '确定要删除配置[' + text + ']吗？',
        success: (res) => {
          if (res.confirm) {
            const name = self.data.name;
            const defaultChar = getApp().getDefaultCharacter(name);
            getApp().deleteCharacter(name, text);
            if(defaultChar===text) {
              const list = getApp().getCharacterList(name);
              if(list.length > 0) {
                getApp().setDefaultCharacter(name, list[0]);
              }
            }
            self.updateData(name);
          }
        },
      });
    },
    onLoad(e) {
      const text = e.currentTarget.dataset.item;
      const self = this;
      wx.showModal({
        title: '加载角色配置',
        content: '确定要加载配置[' + text + ']吗，当前角色配置将会被覆盖。',
        success: (res) => {
          if (res.confirm) {
            self.loadCharacter(text);
          }
        },
      });
    },
    onLoadTrial() {
      const self = this;
      wx.showModal({
        title: '加载初始配置',
        content: '确定要该角色的初始配置吗，当前角色配置将会被覆盖。',
        success: (res) => {
          if (res.confirm) {
            self.loadDefaultCharacter();
          }
        },
      });
    },
    saveCharacter(text) {
      const { name } = this.data;
      const member = getApp().team(0).getMember(name);
      getApp().saveCharacter(name, text, member.toJSON());
      this.updateData(name);
    },
    loadCharacter(text) {
      const { name } = this.data;
      const character = getApp().loadCharacter(name, text);
      if(character)this.triggerEvent('load', { character });
    },
    loadDefaultCharacter() {
      const { name } = this.data;
      const character = getDefaultJson(name);
      if(character)this.triggerEvent('load', { character });
    },
    updateData(name) {
      const list = getApp().getCharacterList(name);
      const defaultChar = getApp().getDefaultCharacter(name);
      const teamList = getApp().getTeamList();
      return this.setData({
        dataList: list,
        defaultChar,
        teamList,
      });
    }
  },
  observers: {
    name(val) {
      this.updateData(val);
    }
  }
})
