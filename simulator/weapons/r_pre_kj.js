'use strict';

const { C, D, BaseWeapon } = require('../index');

const baseData = {
  name: '开疆',
  short: '公司',
  rarity: 'R',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['12_264'],
  def: D.levelData['12_264'],
  data: D.makeTable([['heal'],[12],[14],[16],[18],[20]]),
};

class RPreKJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破弱点时回复${this.data.heal}%生命值`}
  getReportData() {
    const char = this.character;
    const base = char.getAttr('hp');
    return [{
      type:'heal', name: '公司[回血]', labels:['治疗量'], tip: '击破弱点时',
      heal0: C.calHealData(base * this.data.heal * 0.01, char, char)
    }];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e!== 'C_BREAK' || unit!==c) return;
    c.triggerHeal([c], c.getAttr('hp') * this.data.heal * 0.01);
  }
}

module.exports = {
  data: baseData,
  weapon: RPreKJ,
}