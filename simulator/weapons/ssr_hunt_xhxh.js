'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '星海巡航',
  short: '猎逐',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['24_529'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criRate', 'criPlus', 'atkRate'],
    [8, 8, 20],
    [10, 10, 25],
    [12, 12, 30],
    [14, 14, 35],
    [16, 16, 40],
  ]),
};

class BuffCriRate extends Buff {
  static info() {
    return {
      name: baseData.short + '[暴击]',
      short: '暴击',
      source: '光锥',
      desc: '对生命值50%及以下的敌人暴击增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    if(target.checkHp(50)) {
      return { criRate: this.data.criPlus }
    }
    return {};
  }
}

class SsrHuntXHXH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击提高${this.data.criRate}%，对生命值小于等于50%的敌人暴击额外提高${this.data.criPlus}。当装备者消灭敌方目标后，攻击力提高${this.data.atkRate}%，持续2回合。`
  }
  getExtendAttributes(){
    return { criRate: this.data.criRate }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [], 'criRate', this.data),
      Buff.getListJson(this.character, BuffAtkRate, [Buff.simpleListener()], 'atkRate', {
        atkRate: this.data.atkRate,
        name: baseData.short + '[加攻]', source: '光锥',
        maxValue: 1,
      })
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_KILL' || unit!==c || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + '[加攻]', 'atkRate'), c, 1, { count: 2 });
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntXHXH,
}