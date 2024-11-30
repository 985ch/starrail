'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '两个人的演唱会',
  short: '鼓舞',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['43_952'],
  atk: D.levelData['16_370'],
  def: D.levelData['21_463'],
  data: D.makeTable([['defRate', 'bonusAll'],[16,5], [20,5], [24,6], [28,7], [32,8]]),
};

// 伤害提升
class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc:'全抗性提高',
      show: true,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '增伤'],
    };
  }
  getDesc() {
    const data = this.getData();
    return `伤害提高${data.bonusAll}%`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const team = this.member.team;
    let count = 0;
    team.members.forEach(unit => {
      if(unit && unit.findBuff({tag:'shield'})) count++;
    });
    return { bonusAll: count * this.data.bonusAll };
  }
}

class SrPreYCH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `防御力提高${this.data.defRate}%。场上每有一名持有护盾的角色，伤害提高${this.data.bonusAll}%。` }
  getExtendAttributes() {
    return { defRate: this.data.defRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [], '' , this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreYCH,
}