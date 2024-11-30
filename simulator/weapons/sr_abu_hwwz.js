'use strict';

const { C, D, BaseWeapon } = require('../index');

const baseData = {
  name: '何物为真',
  short: '假设',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['48_1058'],
  atk: D.levelData['19_423'],
  def: D.levelData['15_330'],
  data: D.makeTable([['breakRate', 'healRate'],[24, 2.0], [30, 2.5], [36, 3.0], [42, 3.5], [48, 4.0]]),
};

class SrAbuNYBMC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。施放普攻后，装备者回复${this.data.healRate}%生命上限+800点生命值。`; }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getReportData() {
    const c = this.character;
    return [{
      type:'heal', name: '假设[回血]', labels:['治疗量'], tip: '施放普攻后',
      heal0: C.calHealData(c.getAttr('hp') * this.data.healRate * 0.01 + 800, c, c)
    }];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e === 'ACT_E' && unit===c && D.checkType(data.type,['NA'])) {
      c.triggerHeal( [c], c.getAttr('hp') * this.data.healRate * 0.01 + 800);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuNYBMC,
}