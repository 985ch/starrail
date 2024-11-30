'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '调和',
  short: '家族',
  rarity: 'R',
  job: '同谐',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['speedRate'],[12],[14],[16],[18],[20]]),
};

class RHarTH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `进战后我方全体速度提高${this.data.speedRate}%，持续1回合` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffSpeedRate,[Buff.simpleListener()], '', {
        speedRate: this.data.speedRate,
        name: baseData.short, source: '光锥', desc:'进入战斗时',
        target: 'member', maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit) {
    const c = this.character;
    if(evt!== 'BTL_S' || unit!==c) return;
    c.team.getAliveUnits('members').forEach(member => {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), member, 1);
    })
  }
}

module.exports = {
  data: baseData,
  weapon: RHarTH,
};