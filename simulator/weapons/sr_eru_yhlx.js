'use strict';

const { C, D, Buff, BaseWeapon } = require('../index');
const { BuffCriDamage } = require('../buff_simple');

const baseData = {
  name: '银河沦陷日',
  short: '攻略',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate','criDamage'],[16,20],[18,25],[20,30],[22,35],[24,40]]),
};

class SrEruYHLX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击力提高${this.data.atkRate}%。施放攻击后，若有2个或以上被击中的目标具有对应属性的弱点，则暴伤提高${this.data.criDamage}%，持续2回合。` }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDamage, [], '', {
        criDamage: this.data.criDamage, name: baseData.short, source: '光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_DMG_E' && unit===c && data.targets.length >= 2){
      if(data.targets.filter(t => t.findBuff({tag:'weak' + c.base.type}) !== null ).length < 2) return;
      c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1, {count:2});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruYHLX,
}