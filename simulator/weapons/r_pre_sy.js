'use strict';

const { C, D, BaseWeapon } = require('../index');

const baseData = {
  name: '戍御',
  short: '兴复',
  rarity: 'R',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['12_264'],
  def: D.levelData['12_264'],
  data: D.makeTable([['heal'],[18],[21],[24],[27],[30]]),
};

class RPreSY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放终结技时时回复${this.data.heal}%生命值`}
  getReportData() {
    const char = this.character;
    const base = char.getAttr('hp');
    return [{
      type:'heal', name: '兴复[回血]', labels:['治疗量'], tip: '施放终结技时',
      heal0: C.calHealData(base * this.data.heal * 0.01, char, char)
    }];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e!== 'ACT_S' || !D.checkType(data.type,'US') || unit!==c) return;
    c.triggerHeal([c], c.getAttr('hp') * this.data.heal * 0.01);
  }
}

module.exports = {
  data: baseData,
  weapon: RPreSY,
}