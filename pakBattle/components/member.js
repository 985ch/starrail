const { getImage } = require('../../utils/imgset.js');
Component({
  properties: {
    index:{
      type: Number,
      value: -1,
      observer: function(val) {
        this.updateData(val);
      }
    },
    selected: {
      type: Boolean,
      value: false,
    },
    actionUnit: {
      type: String,
      value: '',
      observer: function(val) {
        this.updateBG(val);
      }
    },
    r:{
      type: Number,
      value: 0,
      observer: function(val) {
        this.updateData(this.data.index);
      }
    },
    logs: {
      type: Array,
      value: [],
    },
  },
  data: {
    show: false,
    rarity: 'SR',
    image: '/images/base/unknown.png',
    hp: 100,
    hpMax: 100,
    shield: 0,
    en: 0,
    enMax: 120,
    hpColor: 'green',
    enColor: 'black',
    spText: '-',
    disableUS: false,
    isAction: false,
  },
  methods: {
    onSelected() {
      const team = getApp().team(0);
      const member = team.members[this.data.index];
      if(!member.checkAlive()) return;
      this.triggerEvent('sel', {index: this.data.index});
    },
    onUS() {
      if(this.data.disableUS) return;
      const team = getApp().team(0);
      if(!team.state.inBattle) return;
      this.triggerEvent('us', {index: this.data.index});
    },
    updateBG(value) {
      const team = getApp().team(0);
      const member = team.members[this.data.index];
      if(!member) return;
      this.setData({isAction: member.name === value});
    },
    updateData(index) {
      const team = getApp().team(0);
      const member = team.members[index];
      if(!member) {
        this.setData({ show: false});
        return;
      }
      const percent = member.state.hp / member.getAttr('hp');
      const hpColor = percent > 0.8 ? 'green' : (percent > 0.5 ? 'orange': 'red');
      const enFull = !member.checkDisableUS();
      this.setData({
        show: true,
        rarity: member.base.rarity,
        image: getImage('char/'+ member.base.image, (file)=>{this.setData({image: file})}),
        hp: member.state.hp,
        hpMax: member.getAttr('hp'),
        shield: member.getMaxShield(),
        en: member.state.en,
        enMax: member.base.enMax,
        hpColor,
        enColor: enFull ? 'green' : 'black',
        disableUS: member.checkDisableUS(),
        spText: member.getStateExText(),
        isAction: member.name === this.data.actionUnit,
      })
    }
  }
})