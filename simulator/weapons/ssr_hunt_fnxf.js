'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '烦恼着，幸福着',
  short: '一个一个来',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criRate', 'bonusAA', 'criDamage'],
    [18,30,12],
    [21,35,14],
    [24,40,16],
    [27,45,18],
    [30,50,20],
  ]),
};

class DebuffWX extends Buff {
  static info() {
    return {
      name: '温驯',
      short: '温驯',
      source: '光锥',
      desc: '受到攻击时，攻击者的暴伤提高',
      show: true,
      maxValue: 2,
      target: 'enemy',
      tags: ['debuff', '温驯'],
    };
  }
  getDesc() {
    return `受到攻击时，攻击者的暴伤提高${this.data.criDamage *this.value}%。`;
  }
}

class BuffCriDamage extends Buff {
  static info() {
    return {
      name: baseData.short + '[暴伤]',
      short: '暴伤',
      source: '光锥',
      desc: '对温驯状态的敌人暴伤增加',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    };
  }
  getAttributesT(target) {
    const buff = target.findBuff({tag:'温驯'});
    return buff? { criDamage: this.data.criDamage * buff.value } : {};
  }
  checkSameBuff( buff ){
    return this.constructor === buff.constructor;
  }
}

class SsrHuntFNXF extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击率提高${this.data.criRate}%，追加攻击伤害提高${this.data.bonusAA}%。追加攻击使目标陷入【温驯】状态，可叠2层。我方击中【温驯】状态下的敌方目标时，每层使暴伤提高${this.data.criDamage}。`
  }
  getExtendAttributes(){
    return { criRate: this.data.criRate, bonusAA: this.data.bonusAA }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDamage, [], '', this.data),
      Buff.getListJson(this.character, DebuffWX, [], '', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_DMG_E' && unit===c && D.checkType(data.type,'AA')){
      data.targets.forEach(t => c.addBuff(Buff.getKey(c.name,'光锥', '温驯'), t, 1));
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntFNXF,
}