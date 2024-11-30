'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const C = require('../compute');
const { BuffShield } = require('../buff_simple')

const baseData = {
  name: '记忆的质料',
  short: '珍存',
  rarity: 'SSR',
  job: '存护',
  hp: D.levelData['48_1058'],
  atk: D.levelData['19_423'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['dodge', 'shield', 'damageRate'],
    [8, 16, 12],
    [10, 20, 15],
    [12, 24, 18],
    [14, 28, 21],
    [16, 32, 24],
  ]),
};

class BuffBlock extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '减伤',
      source: '光锥',
      desc:'受到伤害降低',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '减伤'],
    };
  }
  getDesc() {
    return `受到伤害降低${this.data.damageRate}%`;
  }
  getAttributes() {
    return this.member.findBuff({tag: 'shield'}) ? { damageRate: 1 - this.data.damageRate * 0.01 } : {};
  }
}

class SsrPreJYDZL extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `效果抵抗提高${this.data.dodge}%。装备者受到攻击后，若未持有护盾，则获得一个等同于装备者${this.data.shield}%生命上限的护盾，持续2回合，该效果每3回合可以触发一次。若装备者持有护盾，则使自身受到的伤害降低${this.data.damageRate}%。`
  }
  getExtendAttributes() {
    return { dodge: this.data.dodge };
  }
  getReportData() {
    const c = this.character;
    return [{
      type:'shield', name: baseData.short + '[盾]',  tip: '受击时未持有护盾可触发',
      shield: C.calShieldData(c.getAttr('hp') * this.data.shield * 0.01, c, c),
    }];
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffShield, [Buff.simpleListener()], 'shield', {
        shieldR: this.data.shield, shield: 0, baseAttr: 'hp',
        name: baseData.short + '[盾]', source:'光锥', maxValue: 1,
      }),
      Buff.getListJson(this.character, BuffBlock, [Buff.markListener('B_HIT_S', 'self')], 'block', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e === 'B_HIT_E' && unit===c && !c.findBuff({tag: 'shield' }) && this.updateCD(3)) {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + '[盾]', 'shield'), c, 1, { count:2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrPreJYDZL,
}