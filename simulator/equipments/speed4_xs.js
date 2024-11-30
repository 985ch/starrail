// 骇域漫游的信使
'use strict';

const EquipSet = require('../equip_set');
const { Buff, D } = require('../index');

class BuffSpeed extends Buff {
  static info() {
    return {
      name: '信使',
      short: '加速',
      source: '遗器',
      desc: '对我方目标施放终结技后全体加速12%',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', 'removable', '加速'],
    };
  }
  getAttributes() {
    return { speedRate: 12 }
  }
  checkSameBuff( buff ){
    return this.constructor===buff.constructor && this.target===buff.target;
  }
}

class Speed4XS extends EquipSet {
  static getDesc() {
    return {
      name: '骇域漫游的信使',
      short: '信使',
      set2: '速度提高6%',
      set4: '对我方目标施放终结技后，我方全体速度提高12%，持续1回合，无法叠加',
      image: 'speed4_xs',
      buffs: [['速度提高', '信使', 1]],
      evt: 'ACT_E',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { speedRate: 6} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffSpeed, [Buff.simpleListener()]) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'US') ||this.count<4 || unit!==c) return;
    if(data.target!=='members' && data.target.faction!=='members')return;
    const members = c.team.getAliveUnits('members')
    members.forEach(m => {
      c.addBuff(Buff.getKey(c.name,'遗器', '信使'), m, 1);
    })
  }
}

module.exports = Speed4XS;