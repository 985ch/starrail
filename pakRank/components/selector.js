const { charactersData } = require('../../simulator/characters/index');
Component({
  properties: {
    index: {
      type: Number,
      value: 0
    },
    char: {
      type: String,
      value: ''
    }
  },
  data: {
    charBaseData: [{ text:'不限制', data:[{ name:'任意角色', rarity:'INVALID'}]}].concat(charactersData), // 角色基础数据
  },
  methods: {
    // 响应创建角色事件
    onSelectCharacter(e) {
      const name = e.detail.name;
      this.triggerEvent('select', {
        index: this.data.index,
        character: name==='任意角色'? null: name,
      });
    },
  }
})