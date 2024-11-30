'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const A = require('../action');

const baseData = {
  name: '后会有期',
  short: '交手如交谈',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['38_846'],
  atk: D.levelData['24_529'],
  def: D.levelData['15_330'],
  data: D.makeTable([['rate'],[48],[60],[72],[84],[96]]),
};

class SrNihHHYQ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放普攻或战技后，对随机1个受到攻击的敌方目标造成等同于自身${this.data.rate}%攻击力的附加伤害` }
  getReportData(target) {
    return this.getAdditionDamageReport(target, {
        rate: this.data.rate,
        baseAttr: 'atk',
        isDot: false,
        title: '后会有期[追伤]',
        tip: '对随机受击目标'
      });
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit !== c || e!== 'C_DMG_E' || !D.checkType(data.type,['NA','NS'])) return;
    A.newAddDmg(c, c, [D.sample(data.targets)], c.getAttr('atk')* this.data.rate*0.01);
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihHHYQ,
}