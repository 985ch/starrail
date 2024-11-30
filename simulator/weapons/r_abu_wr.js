'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffHealRate } = require('../buff_simple');

const baseData = {
  name: '物穰',
  short: '繁盛',
  rarity: 'R',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['12_264'],
  def: D.levelData['12_264'],
  data: D.makeTable([['healRate'],[12],[15],[18],[21],[24]]),
};

class RAbuWR extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放战技或终结技时治疗量提高${this.data.healRate}` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHealRate, [Buff.eventListener('ACT_E', 'self')], '', {
        healRate: this.data.healRate,
        name: baseData.short, source:'光锥', desc:'施放战技或终结技时',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,['NS','US'])){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: RAbuWR,
};
