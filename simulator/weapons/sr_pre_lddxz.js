'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');

const baseData = {
  name: '朗道的选择',
  short: '时光如梭',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['dmgRate'],[16],[18],[20],[22],[24]]),
};

class SrPreLDDXZ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `装备者受到的概率提高，同时受到的伤害降低${this.data.dmgRate}%。` }
  getExtendAttributes() {
    return {
      damageRate: 1 - this.data.dmgRate * 0.01,
      hateRate: 200,
    };
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreLDDXZ,
}