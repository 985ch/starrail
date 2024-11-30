'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '忍法帖•缭乱破魔',
  short: '除邪',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['43_952'],
  atk: D.levelData['26_582'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['breakRate','en','actionRate'],
    [60, 30, 50],
    [70, 32.5, 55],
    [80, 35, 60],
    [90, 37.5, 65],
    [100, 40, 70],
  ]),
};

class BuffBonusUS extends Buff {
  static info() {
    return {
      name: '雷遁',
      short: '增伤',
      source: '光锥',
      desc: '施放2次普攻后行动提前',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `施放${this.state.count}次普攻后行动提前${this.data.actionRate}%`;
  }
  init() {
    const m = this.member;
    this.listen({e:'ACT_E', t:'members', f:(buff, unit, data)=>{
      if(unit!==m || !D.checkType(data.type, 'NA')) return;
      this.state.count--;
      if(this.state.count <= 0) m.changeWaitTime(-this.data.actionRate);
    }});
  }
}

class SsrEruLLPM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。进入战斗恢复${this.data.en}能量。施放终结技后获得【雷遁】，施放2次普攻后，行动提前${this.data.actionRate}%，并移除【雷遁】。再次施放终结技会重置【雷遁】。` }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffBonusUS,[],'', this.data)];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt === 'BTL_S') {
      c.addEn(this.data.en, true);
    } else if(evt === 'ACT_E' && D.checkType(data.type,'US')) {
      c.addBuff(Buff.getKey(c.name,'光锥', '雷遁'), c, 1, {count: 2});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruLLPM,
}