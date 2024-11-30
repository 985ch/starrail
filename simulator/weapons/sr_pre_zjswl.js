'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const A = require('../action');

const baseData = {
  name: '这就是我啦！',
  short: '新篇章',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['38_846'],
  atk: D.levelData['16_370'],
  def: D.levelData['24_529'],
  data: D.makeTable([['defRate', 'rate'],[16, 60], [20, 75], [24, 90], [28, 105], [32, 120]]),
};

class SrPreZJSWL extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `防御力提高${this.data.defRate}%。施放终结技时造成的伤害提高，提高值等同于装备者防御力的${this.data.rate}%，该效果对每个敌方目标仅生效一次。` }
  getReportData(target){
    return this.getAdditionDamageReport(target, {
      rate: this.data.rate,
      baseAttr: 'def',
      name: baseData.short, source:'光锥',
      title: baseData.short + '[附加]',
    })
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit !== c || e!== 'C_DMG_E' || !D.checkType(data.type,'US')) return;
    A.newAddDmg(c, c, data.targets, c.getAttr('def')* this.data.rate*0.01);
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreZJSWL,
}