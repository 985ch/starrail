'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffDamage extends Buff {
  static info() {
    return {
      name: '匹诺康尼',
      short: '匹诺康尼',
      source: '遗器',
      desc: '无',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    };
  }
  getAttributes(target) {
    return target!==this.member && target.base.type===this.member.base.type? { bonusAll: 10} : {};
  }
}

class En2PNKN extends EquipSet {
  static getDesc() {
    return {
      name: '梦想之地匹诺康尼',
      short: '匹诺康尼',
      set2: '充能效率提高5%。队伍中与装备者属性相同的角色伤害提高10%。',
      image: 'en2_pnkn',
    }
  }
  getAttributes() {
    return (this.count >= 2 ) ? { enRate: 5} : {};
  }
  getBuffList() {
    return (this.count<2)?[]:[Buff.getListJson(this.character, BuffDamage)];
  }
}

module.exports = En2PNKN;