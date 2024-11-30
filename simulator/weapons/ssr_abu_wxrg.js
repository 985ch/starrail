'use strict';

const BaseWeapon = require('../weapon');
const { C, D, Buff} = require('../index');

const baseData = {
  name: '唯有香如故',
  short: '安心',
  rarity: 'SSR',
  job: '丰饶',
  hp: D.levelData['48_1058'],
  atk: D.levelData['24_529'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['breakRate','weakAll','weakPlus'],
    [60,10,8],
    [70,12,10],
    [80,14,12],
    [90,16,14],
    [100,18,16],
  ]),
};

class DebuffWeak extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '易伤',
      source: '光锥',
      desc: '易伤提高',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '易伤'],
    };
  }
  getDesc() {
    return `易伤提高${D.toPercent(this.getData())}`
  }
  getAttributes() {
    return { weakAll: this.getData() };
  }
  getData() {
    const bonus = this.member.getAttr('breakRate')>=149.9999? this.data.weakPlus: 0;
    return this.data.weakAll + bonus;
  }
}

class SsrAbuWXRG extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `击破特攻提高${this.data.breakRate}%。用终结技攻击敌方目标后，使其陷入【忘忧】状态，持续2回合，【忘忧】状态下的目标易伤提高${this.data.weakAll}%，若装备者击破特攻大于等于150%，易伤额外提高${this.data.weakPlus}%。`;
  }
  getExtendAttributes() {
    return {breakRate: this.data.breakRate};
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, DebuffWeak, [Buff.simpleListener()], '', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit===c && e==='C_ATK_E' && D.checkType(data.type, 'US')) {
      data.targets.forEach(target => {
        if(target.checkAlive()) c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), target, 1, { count: 2});
      })      
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrAbuWXRG,
}