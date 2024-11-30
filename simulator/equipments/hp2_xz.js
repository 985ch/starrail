// 不老者的仙舟
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffAtk extends Buff {
  static info() {
    return {
      name: '仙舟',
      short: '加攻',
      source: '遗器',
      desc: '速度大于等于120时全体加攻8%',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '加攻'],
    };
  }
  getAttributes(target) {
    return (target!==this.member && this.isActivated())? { atkRate: 8 }: {};;
  }
  getTransAttr(target) {
    if(target!==this.member) return null;
    return {
      atkRate: { raw:'speed', min: 120, rate:0, add: 8 }
    };
  }
  isActivated() {
    return this.member.getAttr('speed') > 119.9999;
  }
}

class Hp2XZ extends EquipSet {
  static getDesc() {
    return {
      name: '不老者的仙舟',
      short: '仙舟',
      set2: '生命上限提高12%，若速度大于等于120时全体加攻8%',
      image: 'hp2_xz',
      needAttrs: [{raw:'speed', tar:['atk'], range:[95, 120]}],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { hpRate: 12} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffAtk) ];
  }
}

module.exports = Hp2XZ;