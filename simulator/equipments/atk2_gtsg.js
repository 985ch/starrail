//出云显世与高天神国
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffCriRate extends Buff {
  static info() {
    return {
      name: '出云',
      short: '出云',
      source: '遗器',
      desc: '无',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributes() {
    const m = this.member;
    const idx = m.team.members.findIndex(c => c && c!==m && c.base.job===m.base.job);
    return idx>=0? {criRate: 12}: {};
  }
}

class Atk2GTSG extends EquipSet {
  static getDesc() {
    return {
      name: '出云显世与高天神国',
      short: '出云',
      set2: '攻击提高12%，若有同命途队友则暴击提高12%。',
      image: 'atk2_gtsg',
    }
  }
  getAttributes() {
    return (this.count >= 2 ) ? { atkRate: 12} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffCriRate) ];
  }
}

module.exports = Atk2GTSG;