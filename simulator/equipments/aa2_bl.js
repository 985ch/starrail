// 奔狼的都蓝王朝
'use strict';

const EquipSet = require('../equip_set');
const {D, Buff} = require('../index');

class BuffBonus extends Buff {
  static info() {
    return {
      name: '功勋',
      short: '暴击',
      source: '遗器',
      desc: '我方角色施放追击后装备者获得追击增伤，可叠5层。叠满后暴伤提升。',
      show: true,
      maxValue: 5,
      target: 'self',
      tags: ['buff', 'removable', '增伤', 'bonusAll', '暴伤', 'criDamage'],
    };
  }
  getDesc() {
    return `追击伤害提升${this.value*5}%${this.value>=5?'，暴伤提升25%':''}。`
  }
  getAttributes() {
    return { bonusAA:this.value * 5, criDamage: this.value>=5? 25: 0 };
  }
}
class BuffListener extends Buff {
  static info() {
    return {
      name: '功勋[监听]',
      short: '监听',
      source: '遗器',
      desc: '监听遗器事件',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'C_ATK_E', t:'members', f:(buff, unit, data)=>{
      if(D.checkType(data.type,'AA')) m.addBuff(Buff.getKey(m.name,'遗器', '功勋'), m, 1, {count:1});
    }});
  }
}

class AA2BL extends EquipSet {
  static getDesc() {
    return {
      name: '奔狼的都蓝王朝',
      short: '奔狼',
      set2: '我方施放追加攻击时装备者获得【功勋】，【功勋】可叠5层，每层提供5%追击增伤，叠满5层可额外获得25%暴伤。',
      image: 'aa2_bl',
      buffs: [['追击增伤', '功勋', 5]],
    }
  }
  getBuffList() {
    if(this.count<2)return [];
    return [
      Buff.getListJson(this.character, BuffBonus),
      Buff.getListJson(this.character, BuffListener),
    ];
  }
}

module.exports = AA2BL;