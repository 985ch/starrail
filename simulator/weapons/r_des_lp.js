'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');

const baseData = {
  name: '乐圮',
  short: '诛讨',
  rarity: 'R',
  job: '毁灭',
  hp: D.levelData['38_846'],
  atk: D.levelData['16_370'],
  def: D.levelData['9_198'],
  data: D.makeTable([['bonusAll'],[20], [25], [30], [35], [40]]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '对生命值50%以上的敌人造成的伤害增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `对生命值50%以上的敌人造成的伤害增加${this.data.bonusAll}%`;
  }
  getAttributesT(target) {
    if(target.checkHp(50, true)) {
      return { bonusAll: this.data.bonusAll }
    }
    return {};
  }
}

class RDesLP extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `对生命值50%以上的敌人造成的伤害增加${this.data.bonusAll}%` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: RDesLP,
};
