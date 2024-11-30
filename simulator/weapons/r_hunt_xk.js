'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff')
const D = require('../data');
const { BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '相抗',
  short: '联盟',
  rarity: 'R',
  job: '巡猎',
  hp: D.levelData['33_740'],
  atk: D.levelData['16_370'],
  def: D.levelData['12_264'],
  data: D.makeTable([['speedRate'],[10],[12],[14],[16],[18]]),
};

class RHuntXK extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `消灭敌方目标后速度提高${this.data.speedRate}%，持续2回合` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffSpeedRate,[Buff.simpleListener()],'', {
        speedRate: this.data.speedRate,
        name: baseData.short, source:'光锥',
        desc: '消灭敌方目标后', maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_KILL' || unit!==c || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 2 });
  }
}

module.exports = {
  data: baseData,
  weapon: RHuntXK,
}