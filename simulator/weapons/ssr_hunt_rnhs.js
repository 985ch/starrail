'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffCriRate } = require('../buff_simple');

const baseData = {
  name: '如泥酣眠',
  short: '美梦',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([['criDamage', 'criRate'], [30, 36], [35, 42], [40, 48], [45, 54], [50, 60]]),
};

class SsrHuntRNHS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴伤提高${this.data.criDamage}%。当装备者的普攻和战技未暴击时，暴击提高${this.data.criRate}%，持续1回合。该效果每3回合可以触发1次。`
  }
  getExtendAttributes(){
    return { criDamage: this.data.criDamage }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [Buff.simpleListener()], '', {
        criRate: this.data.criRate,
        name: baseData.short, source: '光锥',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_HIT_E' && unit===c && !data.isCri && D.checkType(data.type,['NA','NS']) && this.updateCD(3)){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntRNHS,
}