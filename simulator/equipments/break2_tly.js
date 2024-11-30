// 盗贼公国塔利亚
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffBreak extends Buff {
  static info() {
    return {
      name: '塔利亚',
      short: '击破',
      source: '遗器',
      desc: '速度大于等于145时击破特攻提高20%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      breakRate: { raw:'speed', min: 145, rate:0, add: 20 }
    };
  }
}

class Break2TLY extends EquipSet {
  static getDesc() {
    return {
      name: '盗贼公国塔利亚',
      short: '塔利亚',
      set2: '击破特攻提高16%，若速度大于等于145则击破特攻额外提高20%',
      image: 'break2_tly',
      needAttrs: [{raw:'speed', tar:['breakRate'], range:[120, 145]}],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? {breakRate:16} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffBreak) ];
  }
}

module.exports = Break2TLY;