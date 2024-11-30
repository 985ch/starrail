// 停转的萨尔索图
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffDamage extends Buff {
  static info() {
    return {
      name: '停转',
      short: '增伤',
      source: '遗器',
      desc: '暴击率不小于50%则追加攻击和终结技增伤15%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      bonusAA: { raw:'criRate', min: 50, add: 15 },
      bonusUS: { raw:'criRate', min: 50, add: 15 },
    };
  }
}

class Cri2SEST extends EquipSet {
  static getDesc() {
    return {
      name: '停转的萨尔索图',
      short: '停转',
      set2: '暴击率增加8%，若暴击率不小于50%则追加攻击和终结技增伤15%',
      image: 'cri2_sest',
      needAttrs: [{raw:'criRate', tar:['bonusUS','bonusAA'], range:[35, 50]}],
    }
  }
  getAttributes() {
    return (this.count >= 2)?{ criRate: 8 }: {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffDamage) ];
  }
}

module.exports = Cri2SEST;