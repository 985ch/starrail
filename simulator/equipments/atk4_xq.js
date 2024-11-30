'use strict';

const EquipSet = require('../equip_set');
const {Buff} = require('../index');

class BuffThrough extends Buff {
  static info() {
    return {
      name: '系囚',
      short: '穿透',
      source: '遗器',
      desc: '敌方目标每承受1个持续伤害效果，装备者就无视其6%防御，最多计算3次。',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    const dots = target.filterBuffs({tag:'dot'});
    return { defThrough: 6 * Math.min(3, dots.length) }
  }
}

class Atk4XQ extends EquipSet {
  static getDesc() {
    return {
      name: '幽锁深牢的系囚',
      short: '系囚',
      set2: '攻击力提高12%',
      set4: '敌方目标每承受1个持续伤害效果，装备者就无视其6%防御，最多计算3次。',
      image: 'atk4_xq',
    }
  }
  getAttributes() {
    return (this.count >= 2)?{atkRate:12}:{};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffThrough) ];
  }
}

module.exports = Atk4XQ;