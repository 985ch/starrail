'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '今日亦是和平的一日',
  short: '风雨将至',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['38_846'],
  atk: D.levelData['24_529'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonusAll'],[0.20],[0.25],[0.30],[0.35],[0.40]]),
};

class BuffBonusAll extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '根据能量上限提升伤害',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll'],
    };
  }
  getDesc() {
    return `伤害提升${this.getData()}%`;
  }
  getAttributes() {
    return { bonusAll: this.getData()};
  }
  getData() {
    return this.data.bonusAll * Math.min(160, this.member.base.enMax);
  }
}

class SrEruHPYR extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `根据装备者能量上限提升伤害，每点能量上限提升${this.data.bonusAll}%，最多计入160点。` }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffBonusAll, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruHPYR,
}