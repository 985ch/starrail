'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '智库',
  short: '博识',
  rarity: 'R',
  job: '智识',
  hp: D.levelData['33_740'],
  atk: D.levelData['16_370'],
  def: D.levelData['12_264'],
  data: D.makeTable([['bonusAll'],[28],[35],[42],[49],[56]]),
};

class REruZK extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放终结技时伤害提高${this.data.bonusAll}` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.eventListener('ACT_E', 'self')], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source:'光锥', desc:'施放终结技时',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,'US')){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, null, false);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: REruZK,
};
