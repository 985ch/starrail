'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const A = require('../action');

const baseData = {
  name: '匿影',
  short: '机关',
  rarity: 'R',
  job: '虚无',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['rate'],[60], [75], [90], [105], [120]]),
};

class RNihNY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放战技后下一次普攻附带${this.data.rate}%攻击力的附加伤害` }
  getReportData(target) {
    return this.getAdditionDamageReport(target, {
        rate: this.data.rate,
        baseAttr: 'atk',
        isDot: false,
        title: '机关[追伤]',
        tip: '释放战技后的下一次普攻'
      });
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt === 'ACT_E' && D.checkType(data.type,'NS')) {
      c.state.weapon.activated = true;
    } else if(evt === 'C_DMG_E' && D.checkType(data.type,'NA') && c.state.weapon.activated) {
      c.state.weapon.activated = false;
      A.newAddDmg(c,c,data.targets,c.getAttr('atk')* this.data.rate*0.01);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: RNihNY,
}