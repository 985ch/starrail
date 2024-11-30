'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffHit } = require('../buff_simple');

const baseData = {
  name: '幽邃',
  short: '沉沦',
  rarity: 'R',
  job: '虚无',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['hit'],[20],[25],[30],[35],[40]]),
};

class RNihYS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `进战后效果命中提高${this.data.hit}%，持续3回合`}
  getBuffList(){
    return [Buff.getListJson(this.character, BuffHit, [Buff.simpleListener()], '', {
      hit: this.data.hit,
      name: baseData.short, source: '光锥', desc: '战斗开始时',
    })];
  }
  onEvent(evt, unit) {
    const c = this.character;
    if(evt!== 'BTL_S' || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 3 });
  }
}

module.exports = {
  data: baseData,
  weapon: RNihYS,
}