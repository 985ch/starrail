'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '点个关注吧！',
  short: '求赞！',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonusBase', 'bonusPlus'], [24, 24], [30, 30], [36, 36], [42, 42], [48, 48]]),
};

class BuffBonus extends Buff {
  static info() {
    return {
      name: '不赞不许走！',
      short: '求赞！',
      source: '光锥',
      desc: '满能量时增伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤', 'bonusNA', 'bonusNS' ],
    }
  }
  getDesc() {
    return `普攻和战技伤害提升${this.data.bonusPlus.toFixed(1)}%`;
  }
  getAttributes() {
    if(this.member.base.enMax > this.member.state.en) return {};
    const { bonusPlus } = this.data;
    return { bonusNA: bonusPlus, bonusNS: bonusPlus};
  }
}

class SrHuntDGGZB extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `普攻和战技伤害提升${this.data.bonusBase}%，满能量时普攻和战技伤害额外提升${this.data.bonusPlus}%。`}
  getExtendAttributes() {
    return {
      bonusNA: this.data.bonusBase,
      bonusNS: this.data.bonusBase,
    }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffBonus, [Buff.markListener('EN_CHANGE', 'self')], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntDGGZB,
}