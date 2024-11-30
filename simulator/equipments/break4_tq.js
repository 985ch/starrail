// 荡除蠹灾的铁骑
'use strict';
const Buff = require('../buff');
const EquipSet = require('../equip_set');

class BuffDefThrough extends Buff {
  static info() {
    return {
      name: '铁骑',
      short: '穿透',
      source: '遗器',
      desc: '根据装备者的击破特攻获得防御穿透效果',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const { breakRate } = this.member.buffedAttr.data;
    return `对敌方目标获得${breakRate>250?25:(breakRate>150? 10: 0)}%的防御穿透效果`
  }
  getTransAttr() {
    return {
      defThrough: { raw:'breakRate', min: 150, rate:15, step:100, add:10, max:25}
    };
  }
}

class Break4TJ extends EquipSet {
  static getDesc() {
    return {
      name: '荡除蠹灾的铁骑',
      short: '铁骑',
      set2: '击破特攻提高16%',
      set4: '击破特攻大于等于150%时无视敌方10%防御。击破特攻大于等于250%额外无视其15%防御。',
      image: 'break4_tq',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? {breakRate: 16} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffDefThrough) ];
  }
}

module.exports = Break4TJ;