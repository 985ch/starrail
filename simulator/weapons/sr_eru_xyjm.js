'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const { BuffSpeedRate } = require('../buff_simple');
const D = require('../data');

const baseData = {
  name: '谐乐静默之后',
  short: '沉寂',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['breakRate','speedRate'],[28,8],[35,10],[42,12],[49,14],[56,16]]),
};

class SrEruXYJM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。装备者施放终结技后速度提高${this.data.speedRate}%，持续2回合。` }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffSpeedRate, [], '', {
        speedRate: this.data.speedRate, name: baseData.short, source:'光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt === 'ACT_E' && D.checkType(data.type,'US')) {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, {count: 2});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruXYJM,
}