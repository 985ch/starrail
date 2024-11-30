'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '渊环',
  short: '追逼',
  rarity: 'R',
  job: '虚无',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['bonusAll'],[24], [30], [36], [42], [48]]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll'],
    };
  }
  getAttributesT(target) {
    const buff = target.findBuff({ tag:'减速' });
    return buff ? this.data : {};
  }
}

class RNihYH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `对减速状态下的目标伤害提高${this.data.bonusAll}%`}
  getBuffList(){
    return [Buff.getListJson(this.character, BuffDamage, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: RNihYH,
}