'use strict';

const { C, D, Buff, BaseWeapon } = require('../index');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '无可取代的东西',
  short: '家人',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['52_1164'],
  atk: D.levelData['26_582'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['atkRate', 'heal', 'bonusAll'],
    [24,8,24],
    [28,9,28],
    [32,10,32],
    [36,11,36],
    [40,12,40],
  ]),
};

class SsrDesWKQD extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `攻击提高${this.data.atkRate}%。消灭敌方目标或受到攻击后回复等同于装备者攻击力${this.data.heal}%的生命，同时伤害提高${this.data.bonusAll}%，持续到自身下个回合结束，该效果无法叠加且每回合只能触发一次。`;
  }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getReportData() {
    const char = this.character;
    const base = char.getAttr('atk');
    return [{
      type:'heal', name: '家人[回血]', labels:['治疗量'],
      heal0: C.calHealData(base * this.data.heal * 0.01, char, char)
    }];
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source: '光锥',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(((e==='C_KILL' && data.target.faction==='enemies') || e==='B_ATK_E') && unit===c && this.updateCD(1, true)){
      c.triggerHeal([c], c.getAttr('atk') * this.data.heal*0.01);
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesWKQD,
}