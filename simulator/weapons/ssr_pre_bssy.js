'use strict';

const { D, Buff, BaseWeapon } = require('../index');
const { BuffDamage, BuffHeal } = require('../buff_simple')

const baseData = {
  name: '她已闭上双眼',
  short: '视界',
  rarity: 'SSR',
  job: '存护',
  hp: D.levelData['57_1270'],
  atk: D.levelData['19_423'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['hpRate', 'enRate', 'bonusAll', 'heal'],
    [24, 12, 9.0, 80],
    [28, 14, 10.5, 85],
    [32, 16, 12.0, 90],
    [36, 18, 13.5, 95],
    [40, 20, 15.0, 100],
  ]),
};

class SsrPreBSSY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `生命上限提高${this.data.hpRate}%，能量恢复效率提高${this.data.enRate}%。当装备者生命降低时，使我方全体伤害提高${this.data.bonusAll}%，持续2回合。每个波次开始时，为我方全体回复等同于各自已损失生命值${this.data.heal}%的生命值。`
  }
  getExtendAttributes() {
    return {
      hpRate: this.data.hpRate,
      enRate: this.data.enRate,
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], 'bonus', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source:'光锥', desc: '',
        target: 'member', maxValue: 1,
      }),
      Buff.getListJson(this.character, BuffHeal, [], 'heal', {
        healR: this.data.heal, heal:0,  baseAttr: 'hp',
        name: baseData.short, source:'光锥',
        title: '视界[最大回血]', tip: '每个波次开始时',
        hide: true,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(unit !== c)return;
    if(e === 'WAVE_S') {
      c.team.getAliveUnits('members').forEach(m => c.triggerHeal([m], (m.getAttr('hp') - m.state.hp) * this.data.heal * 0.01));
    } else if(e==='HP_CHANGE' && data.change < 0) {
      c.team.getAliveUnits('members').forEach(m => {
        c.addBuff(Buff.getKey(c.name,'光锥', baseData.short, 'bonus'), m, 1, {count:2});
      });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrPreBSSY,
}