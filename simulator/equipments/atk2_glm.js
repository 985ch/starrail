'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffDamage extends Buff {
  static info() {
    return {
      name: '格拉默',
      short: '格拉默',
      source: '遗器',
      desc: '无',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      bonusAll: { raw:'speed', min: 135, step:25, rate:6, add: 12, max: 18 }
    };
  }
}

class Atk2GLM extends EquipSet {
  static getDesc() {
    return {
      name: '苍穹战线格拉默',
      short: '格拉默',
      set2: '攻击提高12%，当速度大于等于135/160时，伤害提高12%/18%',
      image: 'atk2_glm',
      needAttrs: [{raw:'speed', tar:['bonusAll'], range:[110,160]}],
    }
  }
  getAttributes() {
    return (this.count >= 2 ) ? { atkRate: 12} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffDamage) ];
  }
}

module.exports = Atk2GLM;