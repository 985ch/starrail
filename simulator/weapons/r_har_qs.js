'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');

const baseData = {
  name: '齐颂',
  short: '协力',
  rarity: 'R',
  job: '同谐',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['atkRate'], [8], [9], [10], [11], [12]]),
};

class BuffAtkRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '加攻',
      source: '光锥',
      desc: '全队攻击力提高',
      show: true,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '加攻'],
    };
  }
  getDesc() {
    return `全队攻击力提高${this.data.atkRate}%`
  }
  getAttributes() {
    return { atkRate: this.data.atkRate }
  }
  checkSameBuff( buff ){
    return this.constructor === buff.constructor;
  }
}

class RHarQS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `全队攻击力提高${this.data.atkRate}%，同类技能无法重复生效` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAtkRate, [], '',this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: RHarQS,
};
