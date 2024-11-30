'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffAtkRate, BuffSpeedRate } = require('../buff_simple')

const baseData = {
  name: '不息的演算',
  short: '无界之思',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['48_1058'],
  atk: D.levelData['24_529'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['atkRate','atkPlus','speedRate'],
    [8, 4, 8],
    [9, 5, 10],
    [10, 6, 12],
    [11, 7, 14],
    [12, 8, 16],
  ]),
};

class SsrEruBXDYS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%。攻击后每命中一个目标攻击额外提高${this.data.atkPlus}%，可叠5层，持续至下次攻击结束。若命中目标数大于等于3，速度提高${this.data.speedRate}%，持续1回合。` }
  getExtendAttributes() {
    const { atkRate } = this.data;
    return { atkRate };
  }
  getBuffList(){
    const c = this.character;
    return [
      Buff.getListJson(c, BuffAtkRate, [Buff.eventListener('C_ATK_E', 'self')], '', {
        atkRate: this.data.atkPlus, name: '演算[攻]', source:'光锥', maxValue: 5,
      }),Buff.getListJson(c, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: this.data.speedRate, name: '演算[速]', source:'光锥', maxValue: 1,
      })];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt === 'C_ATK_E') {
      const count = data.targets.length;
      if(count<1) return;
      c.addBuff(Buff.getKey(c.name,'光锥', '演算[攻]'), c, count, {count: 1});
      if(count>=3) c.addBuff(Buff.getKey(c.name,'光锥', '演算[速]'), c, 1, {count: 1});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruBXDYS,
}