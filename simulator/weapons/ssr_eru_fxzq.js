'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffBonus } = require('../buff_simple')

const baseData = {
  name: '拂晓之前',
  short: '长夜',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criDamage','bonusNS','bonusUS','bonusAA'],
    [ 36, 18, 18, 48],
    [ 42, 21, 21, 56],
    [ 48, 24, 24, 64],
    [ 54, 27, 27, 72],
    [ 60, 30, 30, 80],
  ]),
};

class SsrEruFXZQ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `暴伤提高${this.data.criDamage}%。战技和终结技伤害提高${this.data.bonusNS}%。施放战技或终结技后获得【梦生】效果。触发追加攻击时消耗该效果，并使追加攻击伤害提高${this.data.bonusAA}%。` }
  getExtendAttributes() {
    const { criDamage, bonusNS, bonusUS } = this.data;
    return { criDamage, bonusNS, bonusUS };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffBonus, [Buff.damageListener('C_DMG_E', ['AA'], 'self')], '', {
      bonusAA: this.data.bonusAA,
      name: baseData.short, source:'光锥',
      type: 'AA', maxValue: 1,
    })];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(unit !== c) return;
    if(evt === 'C_DMG_S' && D.checkType(data.type,'AA') && c.state.weapon.activated) {
      c.state.weapon.activated = false;
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    } else if(evt === 'ACT_E' && D.checkType(data.type,['US','NS'])) {
      c.state.weapon.activated = true;
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruFXZQ,
}