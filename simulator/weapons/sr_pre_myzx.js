'use strict';

const { D, Buff, BaseWeapon } = require('../index');

const baseData = {
  name: '织造命运之线',
  short: '洞见',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['16_370'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['dodge', 'bonusAll', 'bonusMax'],
    [ 12,  0.8,   32 ],
    [ 14,  0.9,   36 ],
    [ 16,  1.0,   40 ],
    [ 18,  1.1,   44 ],
    [ 20,  1.2,   48 ],
  ]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '根据防御力获得增伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `伤害提高${this.getData().toFixed(1)}%`;
  }
  getTransAttr() {
    return {
      bonusAll: { raw:'def', rate:this.data.bonusAll, step:100, max: this.data.bonusMax }
    };
  }
  getData() {
    const def = this.member.getAttr('def');
    return Math.min(Math.floor(def/100)*this.data.bonusAll, this.data.bonusMax);
  }
}

class SrPreMYZX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `效果抵抗提高${this.data.dodge}%。每100防御力使装备者伤害提高${this.data.bonusAll}%，最大提高${this.data.bonusMax}%。` }
  getExtendAttributes() {
    return { dodge: this.data.dodge };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffDamage, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreMYZX,
}