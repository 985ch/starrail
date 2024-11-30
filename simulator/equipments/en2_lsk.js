'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffAtkRate extends Buff {
  static info() {
    return {
      name: '露莎卡',
      short: '露莎卡',
      source: '遗器',
      desc: '无',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    };
  }
  getAttributes(target) {
    const tar = this.member.team.members.find(unit=>unit);
    return (target===tar && tar !== this.member)? {atkRate: 15}: null;
  }
}

class En2LSK extends EquipSet {
  static getDesc() {
    return {
      name: '沉陆海域露莎卡',
      short: '露莎卡',
      set2: '充能效率提高5%。若装备者不是编队中的第一位角色，使编队中的第一位角色攻击力提高15%。',
      image: 'en2_lsk',
    }
  }
  getAttributes() {
    return (this.count >= 2 ) ? { enRate: 5} : {};
  }
  getBuffList() {
    return (this.count<2)?[]:[Buff.getListJson(this.character, BuffAtkRate)];
  }
}

module.exports = En2LSK;