// 太空封印站
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffAtk extends Buff {
  static info() {
    return {
      name: '封印站',
      short: '封印站',
      source: '遗器',
      desc: '速度大于120则攻击额外提高12%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      atkRate: { raw:'speed', min: 120, rate:0, add: 12 }
    };
  }
}

class Atk2FYZ extends EquipSet {
  static getDesc() {
    return {
      name: '太空封印站',
      short: '封印站',
      set2: '攻击提高12%，若速度大于120，攻击额外提高12%',
      image: 'atk2_fyz',
      needAttrs: [{raw:'speed', tar:['atk'], range:[95, 120]}]
    }
  }
  getAttributes() {
    return (this.count >= 2 ) ? { atkRate: 12} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffAtk) ];
  }
}

module.exports = Atk2FYZ;