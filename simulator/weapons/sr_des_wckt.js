'use strict';

const { C, D, BaseWeapon } = require('../index');

const baseData = {
  name: '无处可逃',
  short: '绝境',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['43_952'],
  atk: D.levelData['24_529'],
  def: D.levelData['12_264'],
  data: D.makeTable([['atkRate','heal'],[24,12],[30,15],[36,18],[42,21],[48,24]]),
};

class SrDesWCKT extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%，消灭敌方目标时回复等同于自身${this.data.heal}%攻击力的生命值。` }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getReportData() {
    const char = this.character;
    const base = char.getAttr('hp');
    return [{
      type:'heal', name: '绝境[回血]', labels:['治疗量'], tip: '消灭敌方目标时',
      heal0: C.calHealData(base * this.data.heal * 0.01, char, char)
    }];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_KILL' && unit===c && data.target.faction==='enemies'){
      c.triggerHeal([c], c.getAttr('atk') * this.data.heal * 0.01);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesWCKT,
}