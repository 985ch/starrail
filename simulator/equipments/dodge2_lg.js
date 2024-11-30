// 折断的龙骨
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffCriDamage extends Buff {
  static info() {
    return {
      name: '龙骨',
      short: '暴伤',
      source: '遗器',
      desc: '抵抗大于等于30%则全队暴伤加10%',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    };
  }
  getAttributes(target) {
    return (target!==this.member && this.isActivated())? { criDamage: 10 }: {};
  }
  getTransAttr(target) {
    if(target!==this.member) return null;
    return {
      criDamage: { raw:'dodge', min: 30, rate:0, add: 10 }
    };
  }
  isActivated() {
    return this.member.getAttr('dodge')>29.99;
  }
}

class Dodge2LG extends EquipSet {
  static getDesc() {
    return {
      name: '折断的龙骨',
      short: '龙骨',
      set2: '抵抗提升10%，若抵抗大于等于30%则全队暴伤加10%',
      image: 'dodge2_lg',
      needAttrs: [{raw:'dodge', tar:['criDamage'], range:[15, 30]}],
    }
  }
  getAttributes() {
    return (this.count >= 2)? { dodge: 10 }: {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffCriDamage) ];
  }
}

module.exports = Dodge2LG;