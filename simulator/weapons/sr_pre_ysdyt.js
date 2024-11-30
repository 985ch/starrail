'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '余生的第一天',
  short: '此刻定格',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['16_370'],
  def: D.levelData['21_463'],
  data: D.makeTable([['defRate', 'defendAll'],[16,8], [18,9], [20,10], [22,11], [24,12]]),
};

// 全抗性提升
class BuffDefendAll extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '加抗',
      source: '光锥',
      desc:'全抗性提高',
      show: true,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '加抗'],
    };
  }
  getDesc() {
    return `全抗性提高${Math.floor(this.data.defendAll)}%`;
  }
  getAttributes() {
    return { defendAll: this.data.defendAll };
  }
  checkSameBuff( buff ){
    return this.constructor === buff.constructor;
  }
}

class SrPreYSDYT extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `防御力提高${this.data.defRate}%。进入战斗后，使我方全属性抗性提高${this.data.defendAll}%，同类技能无法重复生效。` }
  getExtendAttributes() {
    return { defRate: this.data.defRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDefendAll, [], '' , this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreYSDYT,
}