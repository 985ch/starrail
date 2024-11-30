const { charactersData, createCharacter, getDefaultJson } = require('../../simulator/characters/index');
Component({
  properties: {
    index: {
      type: Number,
      value: 0
    },
    tid: {
      type: Number,
      value: 0
    },
    show: {
      type: Boolean,
      value: false,
    },
    removable: {
      type: Boolean,
      value: false
    },
  },
  data: {
    charBaseDataR: [{ text:'无', data:[{ name:'移除角色', rarity:'INVALID'}]}].concat(charactersData),
    charBaseData: charactersData, // 角色基础数据
  },
  methods: {
    // 响应创建角色事件
    onSelectCharacter(e) {
      const name = e.detail.name;
      if(name === '移除角色') {
        this.removeCharacter();
        return;
      }
      const newJson = getApp().loadCharacter(name, getApp().getDefaultCharacter(name)) || getDefaultJson(name) || {
        name, level: 80, upgraded: false, soul: 0,
        skills:  { na:5, ns:8, ps:8, us:8, ex:[1, 1, 1], attr:[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        weapon: null,
        equip: [],
      }
      this.changeCharacter(newJson);
    },
    // 处理角色变更
    changeCharacter(json) {
      const { tid, index } = this.data;
      const list = tid===0? [tid]: [tid, 0];
      list.forEach(idx =>{
        const team = getApp().team(idx);
        const character = json ? createCharacter(team, this.data.index, json.name, json): null;
        team.setMember(this.data.index, character);
      })
      this.triggerEvent('select', { index });
    },
    // 移除角色
    removeCharacter() {
      const self = this;
      const team = getApp().team(this.data.tid);
      const count = team.members.reduce((sum, member)=>sum+(member?1:0), 0);
      if(count <=1 ) {
        wx.showToast({title:'请保留至少一个角色', icon:'none'});
        return;
      }
      wx.showModal({
        title: '提示',
        content: '确定移除当前角色吗？',
        success (res) {
          if (res.confirm) {
            self.changeCharacter(null);
          }
        }
      });
    },
  }
})