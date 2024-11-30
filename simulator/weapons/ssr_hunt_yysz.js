'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '于夜色中',
  short: '花与蝶',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criRate', 'bonusNA', 'bonusNS', 'criDmgUS'],
    [ 18, 6, 6, 12],
    [ 21, 7, 7, 14],
    [ 24, 8, 8, 16],
    [ 27, 9, 9, 18],
    [ 30, 10, 10, 20],
  ]),
};

class BuffHYD extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '花与蝶',
      source: '遗器',
      desc: '普攻和战技增伤，终结技暴伤增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const data = this.getData();
    return `普攻和战技伤害提高${data.bonusNA}%，终结技暴伤提高${data.criDmgUS}%。`;
  }
  getTransAttr() {
    const { bonusNA, bonusNS, criDmgUS } = this.data;
    return {
      bonusNA: { raw:'speed', min:100, step:10, rate:bonusNA, max:bonusNA*6 },
      bonusNS: { raw:'speed', min:100, step:10, rate:bonusNS, max:bonusNS*6 },
      criDmgUS: { raw:'speed', min:100, step:10, rate:criDmgUS, max:criDmgUS*6 },
    };
  }
  getData() {
    const { bonusNA, bonusNS, criDmgUS } = this.data;
    const speed = this.member.getAttr('speed');
    const count = Math.min(6, Math.max(0, Math.floor((speed - 100)/10)));
    return {
      bonusNA: bonusNA * count,
      bonusNS: bonusNS * count,
      criDmgUS: criDmgUS * count,
    }
  }
}

class SsrHuntYYSZ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击提高${this.data.criRate}%。装备者速度大于100时，每超过10点，普攻和战技伤害提高${this.data.bonusNS}%，同时终结技暴伤提高${this.data.criDmgUS}。最多计算至160点。`
  }
  getExtendAttributes(){
    return { criRate: this.data.criRate }
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffHYD, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntYYSZ,
}