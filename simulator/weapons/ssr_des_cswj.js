'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '此身为剑',
  short: '执此宵玉',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['52_1164'],
  atk: D.levelData['26_582'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['criDamage', 'bonusAll', 'defThrough'],
    [20, 14, 12],
    [23, 16.5, 14],
    [26, 19, 16],
    [29, 21.5, 18],
    [32, 24, 20]
  ]),
};

class BuffDmgAndThrough extends Buff {
  static info() {
    return {
      name: '月蚀',
      short: '月蚀',
      source: '光锥',
      desc: '下一次攻击伤害提高，叠满时额外获得防御穿透',
      show: true,
      maxValue: 3,
      target: 'self',
      tags: ['buff', 'removable', '增伤', '破防'],
    };
  }
  getDesc() {
    const throghText = this.value>=3? `无视目标${this.data.defThrough}%防御力` : '';
    return `下一次攻击伤害提高${this.data.bonusAll * this.value}%。${throghText}`;
  }
  getAttributes() {
    const attr = { bonusAll: this.data.bonusAll * this.value };
    if(this.value>=3) {
      attr.defThrough = this.data.defThrough;
    }
    return attr;
  }
}

class SsrDesCSWJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴伤提高${this.data.criDamage}%。队友受到攻击或消耗生命值后，装备者获得1层【月蚀】，最多3层。每层【月蚀】使下一次攻击的伤害提高${this.data.bonusAll}%，叠满后额外使该次攻击无视${this.data.defThrough}%防御。`;
  }
  getExtendAttributes() {
    return {
      criDamage: this.data.criDamage,
    };
  }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffDmgAndThrough, [Buff.eventListener('C_ATK_E','self')], '', this.data )];
  }
  addListens() {
    const members = this.character.team.members;
    members.forEach(member => {
      if(member && member !== this.character) {
        member.listenEvent(['B_ATK_E', 'HP_CHANGE'], this)
      }
    });
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit.faction !== 'members' || unit === c) return;
    if(evt==='B_ATK_E' || (evt==='HP_CHANGE' && data.change < 0)) {
      c.addBuff(Buff.getKey(c.name,'光锥', '月蚀'), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesCSWJ,
}