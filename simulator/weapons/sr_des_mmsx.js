'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '秘密誓心',
  short: '竭力而为',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['12_264'],
  data: D.makeTable([['bonusAll','bonusPlus'],[20,20],[25,25],[30,30],[35,35],[40,40]]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '对生命值百分比高于自身当前生命值百分比的敌人造成的伤害增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `对生命值百分比高于自身当前生命值百分比的敌人造成的伤害增加${this.data.bonusPlus}%`;
  }
  getAttributesT(t) {
    const m = this.member;
    if(t.state.hp / t.getAttr('hp') > m.state.hp / m.getAttr('hp')) {
      return { bonusAll: this.data.bonusPlus }
    }
    return {};
  }
}

class SrDesMMSX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `伤害提高${this.data.bonusAll}%，对生命值百分比高于自身当前生命值百分比的敌方目标造成的伤害提高${this.data.bonusPlus}%。` }
  getExtendAttributes() {
    return { bonusAll: this.data.bonusAll };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesMMSX,
}