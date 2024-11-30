// 泛银河商业公司
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffAtk extends Buff {
  static info() {
    return {
      name: '公司',
      short: '加攻',
      source: '遗器',
      desc: '提高相当于效果命中25%的攻击力，最多提高25%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const atkRate = Math.min(25, this.member.attr.data.hit * 0.25);
    return `攻击提高${Math.floor(atkRate)}%`
  }
  getTransAttr() {
    return {
      atkRate: { raw:'hit', rate:0.25, max: 25 }
    };
  }
}

class Hit2GS extends EquipSet {
  static getDesc() {
    return {
      name: '泛银河商业公司',
      short: '公司',
      set2: '效果命中提高10%，并提高相当于效果命中25%的攻击力，最多提高25%',
      image: 'hit2_gs',
      needAttrs: [{raw:'hit', tar:['atk'], range:[50, 100]}]
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { hit: 10} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffAtk) ];
  }
}

module.exports = Hit2GS;