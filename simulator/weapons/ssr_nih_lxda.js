'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '行于流逝的岸',
  short: '司渡',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['28_635'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['criDamage', 'bonusAll', 'bonusUS'],
    [ 36, 24, 24],
    [ 42, 28, 28],
    [ 48, 32, 32],
    [ 54, 36, 36],
    [ 60, 40, 40],
  ]),
};

class DebuffPY extends Buff {
  static info() {
    return {
      name: '泡影',
      short: '泡影',
      source: '光锥',
      desc: '受到施加者的伤害提高',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '泡影']
    };
  }
  getDesc() {
    const name = this.member.name;
    return `${name}对该目标的伤害提高${this.data.bonusAll}%，终结技伤害额外提高${this.data.bonusUS}%。`;
  }
}

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
      tags: ['buff'],
    };
  }
  getAttributesT(target) {
    return target.findBuff({ tag:'泡影' })?  { bonusAll: this.data.bonusAll, bonusUS: this.data.bonusUS } : {};
  }
}

class SsrNihLXDA extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴伤提高${this.data.criDamage}%。击中敌人时使目标陷入【泡影】状态，持续1回合。每次攻击对每个目标只触发1次，装备者对【泡影】状态的目标伤害提高${this.data.bonusAll}%，终结技伤害额外提高${this.data.bonusUS}%。`
  }
  getExtendAttributes() {
    return { criDamage: this.data.criDamage };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, DebuffPY, [Buff.simpleListener()], '', this.data),
      Buff.getListJson(this.character, BuffDamage, [], '', this.data)
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c) return;
    if(e === 'C_ATK_S') {
      c.state.weapon = { enemies:[] };
    } else if(e === 'C_HIT_S') {
      const enemies = c.state.weapon.enemies || [];
      if(enemies.indexOf(data.target.name) >= 0) return;
      enemies.push(data.target.name);
      c.addBuff(Buff.getKey(c.name,'光锥', '泡影'), data.target, 1, {count: 1});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrNihLXDA,
}