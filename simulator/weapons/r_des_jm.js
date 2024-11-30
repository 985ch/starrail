'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');

const baseData = {
  name: '俱殁',
  short: '军团',
  rarity: 'R',
  job: '毁灭',
  hp: D.levelData['38_846'],
  atk: D.levelData['16_370'],
  def: D.levelData['9_198'],
  data: D.makeTable([['criRate'], [12], [15], [18], [21], [24]]),
};

class BuffCriRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '暴击',
      source: '光锥',
      desc: '生命值低于80%时暴击提升',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '暴击'],
    };
  }
  getDesc() {
    return `生命值低于80%时暴击提升${this.data.criRate}%`;
  }
  getAttributes() {
    if(this.member.checkHp(80)) {
      return { criRate: this.data.criRate }
    }
    return null;
  }
}

class RDesJM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `生命值低于80%时暴击提升${this.data.criRate}%` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [Buff.markListener('HP_CHANGE', 'self')], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: RDesJM,
};
