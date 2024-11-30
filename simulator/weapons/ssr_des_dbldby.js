'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '到不了的彼岸',
  short: '不得',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['57_1270'],
  atk: D.levelData['26_582'],
  def: D.levelData['15_330'],
  data: D.makeTable([
    [ 'criRate', 'hpRate', 'bonusAll' ],
    [ 18, 18, 24],
    [ 21, 21, 28],
    [ 24, 24, 32],
    [ 27, 27, 36],
    [ 30, 30, 40],
  ]),
};

class SsrDesDBLDBY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击提高${this.data.criRate}%，生命提高${this.data.hpRate}%。受到攻击或消耗自己生命值后伤害提高${this.data.bonusAll}%，装备者施放攻击后解除该效果。`;
  }
  getExtendAttributes() {
    return {
      criRate: this.data.criRate,
      hpRate: this.data.hpRate,
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.eventListener('C_DMG_E', 'self')], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source: '光锥', desc: '受击或消耗生命后',
        maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c=this.character;
    if(unit!==c) return;
    if(evt==='B_DMG_E' || (evt==='HP_CHANGE' && data.change<0 && data.member===c )) {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesDBLDBY,
}