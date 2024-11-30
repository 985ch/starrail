'use strict';

const BaseWeapon = require('../weapon');
const {D, Buff} = require('../index');
const { BuffHealRate } = require('../buff_simple');

const baseData = {
  name: '嘿，我在这儿',
  short: '不怕不怕啦',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['hpRate','healRate'],[8, 16],[9, 19],[10, 22],[11, 25],[12, 28]]),
};

class SrAbuWZZE extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `生命上限提高${this.data.hpRate}%。施放战技时治疗量提高${this.data.healRate}%，持续2回合。`; }
  getExtendAttributes() {
    return { hpRate: this.data.hpRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHealRate, [Buff.simpleListener()], '', {
        healRate: this.data.healRate, name: baseData.short, source:'光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,'NS')){
      c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1, {count:2});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuWZZE,
}