'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '以世界之名',
  short: '传承者',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['bonusAll', 'hit', 'atkRate'],
    [ 24, 18, 24],
    [ 28, 21, 28],
    [ 32, 24, 32],
    [ 36, 27, 36],
    [ 40, 30, 40],
  ]),
};

class BuffDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    return target.findBuff({ tag:'debuff' })?  { bonusAll: this.data.bonusAll } : {};
  }
}

class BuffHitAtk extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '传承者',
      source: '光锥',
      desc: '攻击和效果命中提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '加攻', '命中'],
    };
  }
  getDesc() {
    const { hit, atkRate } = this.data;
    return `使用战技时攻击力提高${atkRate.toFixed(1)}%，效果命中提高${hit.toFixed(1)}%`;
  }
  getAttributes() {
    return {
      hit: this.data.hit,
      atkRate: this.data.atkRate,
    }
  }
}

class SsrNihSJZM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `对陷入负面效果的敌方目标造成的伤害提高${this.data.bonusAll}%。施放战技时，此次攻击的命中效果提高${this.data.hit}%，攻击力提高${this.data.atkRate}%。`
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [], 'bonusAll', this.data),
      Buff.getListJson(this.character, BuffHitAtk, [Buff.eventListener('ACT_E', 'self')], 'ns', this.data)
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e === 'ACT_S' && unit===c && D.checkType(data.type,'NS')) {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short, 'ns'), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrNihSJZM,
}