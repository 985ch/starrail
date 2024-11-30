'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '偏偏希望无价',
  short: '承诺',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['43_952'],
  atk: D.levelData['26_582'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['criRate','bonusAA', 'arpUS', 'arpAA'],
    [ 16, 12, 20, 20],
    [ 19, 14, 24, 24],
    [ 22, 16, 28, 28],
    [ 25, 18, 32, 32],
    [ 28, 20, 36, 36],
  ]),
};

class BuffArp extends Buff {
  static info() {
    return {
      name: '防御穿透',
      short: '破防',
      source: '光锥',
      desc: '终结技和追击获得防御穿透效果',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '破防','arpUS','arpAA'],
    };
  }
  getDesc() {
    return `终结技及追击获得${this.data.arpUS}%的防御穿透效果。`
  }
  getAttributes() {
    return { arpUS: this.data.arpUS, arpAA: this.data.arpAA }
  }
}
class BuffAA extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '增伤',
      source: '光锥',
      desc: '追击伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: ['增伤','bonusAA'],
    };
  }
  getDesc() {
    const data = this.getData();
    return `追击伤害提高${data.bonusAA}%`;
  }
  getTransAttr() {
    const { bonusAA } = this.data;
    return {
      bonusAA: { raw:'criDamage', min:120, step:20, rate: bonusAA, max:bonusAA*4 },
    };
  }
  getData() {
    const { bonusAA } = this.data;
    const criDamage = this.member.buffedAttr.data.criDamage;
    const count = Math.min(4, Math.max(0, Math.floor((criDamage - 120)/20)));
    return {
      bonusAA: bonusAA * count,
    }
  }
}

class SsrEruXWWJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `暴击提高${this.data.criRate}%。爆伤大于120%时，每超过20%则追击伤害提高${this.data.bonusAA}%，可叠加4层。战斗开始和装备者施放普通攻击后，终结技及追击获得${this.data.arpUS}%防御穿透，持续2回合。` }
  getExtendAttributes() {
    return { criRate: this.data.criRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAA, [], '', this.data),
      Buff.getListJson(this.character, BuffArp, [Buff.simpleListener()], '', this.data),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt==='BTL_S' || (evt === 'C_ATK_E' && D.checkType(data.type,'NA'))) {
      c.addBuff(Buff.getKey(c.name,'光锥', '防御穿透'), c, 1, { count:2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruXWWJ,
}