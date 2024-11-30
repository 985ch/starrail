'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffBonus } = require('../buff_simple');

const baseData = {
  name: '落日时起舞',
  short: '沉酣',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    [ 'criDamage', 'bonusAA' ],
    [ 36, 36],
    [ 42, 42],
    [ 48, 48],
    [ 54, 54],
    [ 60, 60],
  ]),
};

class SsrDesLRSQW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `受击率大幅提高，暴伤提高${this.data.criDamage}%。施放终结技后获得1层【火舞】，持续2回合，可叠加2层。每层【火舞】使追击伤害提高${this.data.bonusAA}%。`;
  }
  getExtendAttributes() {
    return {
      hateRate: 500,
      criDamage: this.data.criDamage,
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffBonus, [Buff.simpleListener()], '', {
        type:'AA', bonusAA: this.data.bonusAA, name: '火舞', source: '光锥',  maxValue: 2, //hide: true,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c=this.character;
    if(unit!==c) return;
    if(evt==='ACT_E' && D.checkType(data.type, ['US'])) {
      c.addBuff(Buff.getKey(c.name,'光锥', '火舞'), c, 1, { count: 2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesLRSQW,
}