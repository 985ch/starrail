'use strict';

const { Buff, D, BaseWeapon } = require('../index');
const { BuffHeal } = require('../buff_simple');

const baseData = {
  name: '暖夜不会漫长',
  short: '小小灯火',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['48_1058'],
  atk: D.levelData['16_370'],
  def: D.levelData['18_396'],
  data: D.makeTable([['hpRate', 'heal'],[16, 2.0], [20, 2.5], [24, 3.0], [28, 3.5], [32, 4.0]]),
};

class SrAbuNYBMC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `生命上限提高${this.data.hpRate}%。施放普攻或战技后，我方全体回复等同于各自生命上限${this.data.heal}%的生命值。`; }
  getExtendAttributes() {
    return { hpRate: this.data.hpRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHeal, [], '', {
        healR: this.data.heal, heal: 0,  baseAttr: 'hp',
        name: baseData.short, source:'光锥',
        title: '小小灯火[回血]', label: '回复值', tip: this.character.name + '施放普攻或战技后',
        static: true, hide: true,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e === 'ACT_E' && unit===c && D.checkType(data.type,['NA','NS'])) {
      c.triggerHeal(c.team.getAliveUnits('members'), c.getAttr('hp') * this.data.heal * 0.01);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuNYBMC,
}