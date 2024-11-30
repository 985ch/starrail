// 繁星竞技场
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffDamage extends Buff {
  static info() {
    return {
      name: '竞技场',
      short: '增伤',
      source: '遗器',
      desc: '暴击率不小于70%则普攻和战技增伤20%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      bonusNA: { raw:'criRate', min: 70, rate:0, add: 20 },
      bonusNS: { raw:'criRate', min: 70, rate:0, add: 20 },
    };
  }
}

class Cri2JJC extends EquipSet {
  static getDesc() {
    return {
      name: '繁星竞技场',
      short: '竞技场',
      set2: '暴击率增加8%，若暴击率大于等于70%则普攻和战技伤害增加20%',
      image: 'cri2_jjc',
      needAttrs: [{raw:'criRate', tar:['bonusNA','bonusNS'], range:[55, 70]}],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { criRate: 8 } : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffDamage) ];
  }
}

module.exports = Cri2JJC;