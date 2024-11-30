'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff')
const D = require('../data');
const { BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '离弦',
  short: '鸣角',
  rarity: 'R',
  job: '巡猎',
  hp: D.levelData['33_740'],
  atk: D.levelData['16_370'],
  def: D.levelData['12_264'],
  data: D.makeTable([['atkRate'],[24], [30], [36], [42], [48]]),
};

class RHuntLX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `消灭敌方目标后攻击力提高${this.data.atkRate}%，持续3回合` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAtkRate,[Buff.simpleListener()],'', {
        atkRate: this.data.atkRate,
        name: baseData.short, source:'光锥',
        desc: '消灭敌方目标后', maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_KILL' || unit!==c  || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 3 });
  }
}

module.exports = {
  data: baseData,
  weapon: RHuntLX,
}