'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '晚安与睡颜',
  short: '劳碌者',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonusAll'],[12],[15],[18],[21],[24]]),
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
      tags: [],
    };
  }
  getAttributesT(target) {
    const count = target.countBuffs({ tag:'debuff' }, 3);
    return { bonusAll: this.data.bonusAll * count }
  }
}

class SrNihWAYSY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `敌人每有一个负面状态，装备者对其造成的伤害提高${this.data.bonusAll}%,最多叠加3次。` }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffDamage, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihWAYSY,
}