'use strict';

const { D, Buff,BaseWeapon } = require('../index');
const { BuffDamage } = require('../buff_simple')

const baseData = {
  name: '镜中故我',
  short: '彻骨梅香',
  rarity: 'SSR',
  job: '同谐',
  hp: D.levelData['48_1058'],
  atk: D.levelData['24_529'],
  def: D.levelData['24_529'],
  data: D.makeTable([['breakRate','bonusAll','en'],[60,24,10],[70,28,13],[80,32,15],[90,36,18],[100,40,20]]),
};

class SsrHarJZGW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `击破特攻提高${this.data.breakRate}%。装备者施放终结技后，我方全体伤害提高${this.data.bonusAll}%，持续3回合，若击破特攻大于150%，则同时回复1个战技点。波次开始时我方全体恢复${this.data.en}点能量。`
  }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source:'光锥',
        target: 'member', maxValue: 1,
      }),
    ];
  }
  addListens() {
    const members = this.character.team.members;
    members.forEach(member => member && member.listenEvent('WAVE_S', this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_E') {
      if(unit===c && D.checkType(data.type, 'US')) {
        const members = c.team.getAliveUnits('members')
        members.forEach(m => c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), m, 1, {count: 3}));
        if(c.attr.data.breakRate >= 150) c.changeSp(1);
      }
    }else if(e ==='WAVE_S') {
      const key = `光锥_${this.base.name}_回能_${data.wave}`;
      if(!unit.state[key]) {
        unit.addEn(this.data.en, true);
        unit.state[key] = 1;
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHarJZGW,
}