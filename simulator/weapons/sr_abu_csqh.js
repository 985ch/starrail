'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '此时恰好',
  short: '视线',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['dodge', 'healTrans', 'healMax'],
    [16, 33, 15],
    [20, 36, 18],
    [24, 39, 21],
    [28, 42, 24],
    [32, 45, 27],
  ]),
};

class BuffHealRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '治疗',
      source: '遗器',
      desc: '根据效果抵抗提升治疗量',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    const { healTrans, healMax } = this.data;
    return {
      atkRate: { raw:'dodge', rate:healTrans * 0.01, max: healMax }
    };
  }
}

class SrAbuCSQH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `效果抵抗提高${this.data.dodge}%。治疗量提高，提高数值相当于效果抵抗的${this.data.healTrans}%，最多使治疗量提高${this.data.healMax}%。`; }
  getExtendAttributes() {
    return { dodge: this.data.dodge };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHealRate, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuCSQH,
}