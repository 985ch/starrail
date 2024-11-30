'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffBonus } = require('../buff_simple');

const baseData = {
  name: '孤独的疗愈',
  short: '混沌灵药',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['24_529'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['breakRate', 'bonusDOT', 'en'],
    [ 20, 24, 4.0 ],
    [ 25, 30, 4.5 ],
    [ 30, 36, 5.0 ],
    [ 35, 42, 5.5 ],
    [ 40, 48, 6.0 ],
  ]),
};

class SrNihGDDLY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `击破特攻提高${this.data.breakRate}%。施放终结技时持续伤害提高${this.data.bonusDOT}%，持续2回合。陷入装备者施加的持续伤害效果的敌方目标被消灭时，装备者恢复${this.data.en}点能量。`
  }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getReportData() {
    const char = this.character;
    const en = this.data.en * char.attr.data.enRate * 0.01;
    return[{
      type:'energy', name: '混沌灵药[回能]', labels:[ '额外回能'], tip: '持续伤害消灭敌人时',
      en0: en,
    }];
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffBonus, [Buff.simpleListener()], '', {
        bonusDOT: this.data.bonusDOT,
        type: 'DOT',
        name: baseData.short, source:'光锥', maxValue: 1,
      }),
    ];
  }
  addListens() {
    const enemies = this.character.team.enemies;
    enemies.forEach(enemy => enemy && enemy.listenEvent('B_KILL', this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e === 'ACT_S' && unit===c && D.checkType(data.type,'US')) {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 2 });
    } else if( e === 'B_KILL' && unit.faction === 'enemies') {
      if(unit.findBuff({ tag:'dot', member: c.name})){
        c.addEn(this.data.en);
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihGDDLY,
}