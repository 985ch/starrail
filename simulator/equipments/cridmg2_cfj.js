// 星体差分机
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffCriRate extends Buff {
  static info() {
    return {
      name: '差分机',
      short: '暴击',
      source: '遗器',
      desc: '暴伤大于等于120%则进入战斗后首次攻击暴击率提高60%',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', 'removable', '暴击'],
    };
  }
  getTransAttr() {
    return {
      criRate: { raw:'criDamage', min: 120, add: 60 },
    };
  }
}

class Cridmg2CFJ extends EquipSet {
  static getDesc() {
    return {
      name: '星体差分机',
      short: '差分机',
      set2: '暴伤提升16%，若暴伤大于等于120%则进入战斗后首次攻击暴击率提高60%',
      image: 'cridmg2_cfj',
      needAttrs: [{raw:'criDamage', tar:['criRate'], range:[90,120]}],
      evt: 'BTL_S',
    }
  }
  getAttributes() {
    return (this.count >= 2)? { criDamage: 16 }: {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffCriRate, [Buff.eventListener('C_ATK_E', 'self')]) ];
  }
  onEvent(evt, unit, data){
    const c = this.character;
    if(this.count<2 || c.attr.data.criDamage < 119.9999 || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '差分机'), c, 1, null);
  }
}

module.exports = Cridmg2CFJ;