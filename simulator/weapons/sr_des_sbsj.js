'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '汪！散步时间！',
  short: '快溜',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate','bonusAll'],[10,16],[12.5,20],[15,24],[17.5,28],[20,32]]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '对挂有灼烧或裂伤的目标增伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `对挂有灼烧或裂伤的目标伤害提高${this.data.bonusAll}%`
  }
  getAttributesT(target) {
    const buff = target.findBuff({tag: ['灼烧', '裂伤']});
    return buff? { bonusAll: this.data.bonusAll } : {}
  }
}

class SRDesSBSJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%，对挂有灼烧或裂伤的目标伤害提高${this.data.bonusAll}%。` }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffDamage, [], '', this.data) ];
  }
}

module.exports = {
  data: baseData,
  weapon: SRDesSBSJ,
};
