'use strict';

const { C, D, BaseWeapon, Buff } = require('../index');
const { BuffDamage } = require('../buff_simple')

const baseData = {
  name: '在火的远处',
  short: '爆燃',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['12_264'],
  data: D.makeTable([['bonusAll'],[25],[31.25],[37.5],[43.75],[50]]),
};

class SrDesZHDYC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `装备者在受到攻击或主动消耗自身生命值，且单次消耗超过最大生命值的25%时，回复生命上限15%的生命值，且伤害提高${this.data.bonusAll}%，持续2回合。该效果每3回合只能触发1次。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll, name: baseData.short, source: '光锥', maxValue: 1,
      }),
    ];
  }
  getReportData() {
    const c = this.character;
    const base = c.getAttr('hp');
    return [{ type:'heal', name: '爆燃[回血]', labels:['治疗量'], tip: '触发光锥特效时', heal0: C.calHealData(base * 0.15, c, c) }];
  }
  castWeaponSkill(costedHp) {
    const c = this.character;
    const hpMax = c.getAttr('hp');
    if(c.state.hp <= 0 || !this.updateCD(3) || costedHp < hpMax * 0.25 ) return;
    c.triggerHeal([c], hpMax * 0.15);
    c.addBuff(Buff.getKey(c.name,'光锥',baseData.short), c, 1, { count:2 });
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(c!==unit) return;
    if(e==='B_DMG_S' || e==='B_DMG_E') {
      c.state.weapon.costedHp = 0;
    } else if(e==='HP_CHANGE' && data.change<-0.005) {
      if(data.source === 'damage') {
        c.state.weapon.costedHp = (c.state.weapon.costedHp || 0) - data.change;
        this.castWeaponSkill(c.state.weapon.costedHp);
      } else if(data.source === 'cost' && data.member===c) {
        this.castWeaponSkill(-data.change);
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesZHDYC,
}