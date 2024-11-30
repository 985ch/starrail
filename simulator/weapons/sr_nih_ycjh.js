'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '延长记号',
  short: '休止符',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['breakRate', 'bonusAll'],[16, 16], [20, 20], [24, 24], [28, 28], [32, 32]]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '伤害提高',
      show: false,
      static: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll'],
    };
  }
  getAttributesT(target) {
    const debuff = target.findBuff({ tag:['触电', '风化'] });
    if(!debuff) return {};
    return { bonusAll: this.data.bonusAll }
  }
}

class SrNihYCJH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。对处于触电或风化状态的敌人伤害提高${this.data.bonusAll}%。` }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffDamage, [], 'bonusAll', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihYCJH,
}