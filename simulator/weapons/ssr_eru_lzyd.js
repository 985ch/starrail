'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '片刻，留在眼底',
  short: '巡礼',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criDamage','bonusUS'],
    [ 36, 0.36],
    [ 42, 0.42],
    [ 48, 0.48],
    [ 54, 0.54],
    [ 60, 0.60],
  ]),
};

class BuffBonusUS extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '根据能量上限提升终结技伤害',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤', 'bonusUS'],
    };
  }
  getDesc() {
    return `终结技伤害提升${this.getData()}%`;
  }
  getAttributes() {
    return { bonusUS: this.getData()};
  }
  getData() {
    return this.data.bonusUS * Math.min(180, this.member.base.enMax);
  }
}

class SsrEruLZYD extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `暴伤提高${this.data.criDamage}%。根据能量上限提升终结技伤害，每点能量提升${this.data.bonusUS}%，最多记入180点。` }
  getExtendAttributes() {
    return { criDamage: this.data.criDamage };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffBonusUS,[],'', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruLZYD,
}