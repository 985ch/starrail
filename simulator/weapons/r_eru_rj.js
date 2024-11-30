'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '睿见',
  short: '天才',
  rarity: 'R',
  job: '智识',
  hp: D.levelData['33_740'],
  atk: D.levelData['16_370'],
  def: D.levelData['12_264'],
  data: D.makeTable([['atkRate'],[24],[30],[36],[42],[48]]),
};

class REruRJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放终结技时攻击力提高${this.data.atkRate}，持续2回合` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: this.data.atkRate,
        name: baseData.short, source:'光锥', desc:'施放终结技时',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,'US')){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: REruRJ,
};
