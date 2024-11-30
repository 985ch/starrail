'use strict';

const { D, Buff, EquipSet } = require('../index');

class BuffBreak extends Buff {
  static info() {
    return {
      name: '钟表匠',
      short: '击破',
      source: '遗器',
      desc: '击破特攻提高24%',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', '击破特攻'],
    };
  }
  getAttributes() {
    return {breakRate: 24};
  }
  checkSameBuff( buff ){
    return this.constructor===buff.constructor && this.target===buff.target;
  }
}

class Break4ZBJ extends EquipSet {
  static getDesc() {
    return {
      name: '机心戏梦的钟表匠',
      short: '钟表匠',
      set2: '击破特攻提高16%',
      set4: '装备者对我方目标施放终结技时，我方全体击破特攻提高24%，持续2回合，无法叠加',
      image: 'break4_zbj',
      buffs: [['击破提升', '钟表匠', 1]],
      evt: 'ACT_S',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? {breakRate:16} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffBreak, [Buff.simpleListener(true,'self')]) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'US') ||this.count<4 || unit!==c) return;
    if(data.target!=='members' && data.target.faction!=='members')return;
    c.team.getAliveUnits('members').forEach(m => {
      c.addBuff(Buff.getKey(c.name,'遗器', '钟表匠'), m, 1, {count: 2});
    })
  }
}

module.exports = Break4ZBJ;