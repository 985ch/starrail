'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '纯粹思维的洗礼',
  short: '思想训练',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['26_582'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['criDamage', 'criDamageP', 'bonusAll', 'arpAA'],
    [ 20, 8, 36, 24],
    [ 23, 9, 42, 28],
    [ 26, 10, 48, 32],
    [ 29, 11, 54, 36],
    [ 32, 12, 60, 40],
  ]),
};

class BuffCriDmg extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '暴伤',
      source: '光锥',
      desc: '根据敌人的负面效果提供暴伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc(t, e) {
    if(!e) return super.getDesc();
    const data = this.getData(e);
    return `暴伤提高${data.criDamage}%。`;
  }
  getAttributesT(e) {
    return this.getData(e);
  }
  getData(enemy) {
    const count = enemy.countBuffs({ tag:'debuff' }, 3);
    const d = this.data;
    return { criDamage: count * d.criDamageP } 
  }
}

class BuffLB extends Buff {
  static info() {
    return {
      name: '论辩',
      short: '论辩',
      source: '光锥',
      desc: '增伤，追击破防',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', '防御穿透'],
    };
  }
  getDesc() {
    const d = this.data;
    return `伤害提高${d.bonusAll}%，追击无视目标${d.arpAA}%防御力。`;
  }
  getAttributes() {
    const d = this.data;
    return { bonusAll: d.bonusAll, arpAA: d.arpAA }
  }
}

class SsrHuntCCSW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    const d = this.data;
    return `暴伤提高${d.criDamage}%。敌方目标每有一个负面效果暴伤额外提高${d.criDamageP}%，最多叠加3层。施放终结技攻击敌方目标时，获得[论辩]效果，伤害提高${d.bonusAll}%，追击无视目标${d.arpAA}%防御力，该效果持续2回合。`;
  }
  getExtendAttributes(){
    return { criDamage: this.data.criDamage }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDmg, [], '', this.data),
      Buff.getListJson(this.character, BuffLB, [Buff.simpleListener()], '', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e === 'C_ATK_S' && unit===c && D.checkType(data.type, 'US')) {
      c.addBuff(Buff.getKey(c.name,'光锥', '论辩'), c, 1, { count: 2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntCCSW,
}