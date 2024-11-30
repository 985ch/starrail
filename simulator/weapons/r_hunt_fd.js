'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff')
const D = require('../data');
const { BuffCriRate } = require('../buff_simple');

const baseData = {
  name: '锋镝',
  short: '危机',
  rarity: 'R',
  job: '巡猎',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['criRate'],[12], [15], [18], [21], [24]]),
};

class RHuntFD extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `进战后暴击率提高${this.data.criRate}%，持续3回合` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate,[Buff.simpleListener()],'', {
        criRate: this.data.criRate,
        name: baseData.short, source:'光锥',
        desc: '战斗开始时', maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit) {
    const c = this.character;
    if(evt!== 'BTL_S' || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 3 });
  }
}

module.exports = {
  data: baseData,
  weapon: RHuntFD,
}