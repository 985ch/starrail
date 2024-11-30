'use strict';

const { C, D, BaseWeapon, Buff } = require('../index');
const { BuffCriDamage } = require('../buff_simple')

const baseData = {
  name: '忍事录•音律狩猎',
  short: '开演',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['12_264'],
  data: D.makeTable([['hpRate','criDamage'],[12,18],[15,22.5],[18,27],[21,31.5],[24,36]]),
};

class SrDesYLSL extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `生命上限提高${this.data.hpRate}%，损失或回复自身生命后，暴伤提高${this.data.criDamage}%，持续2回合，每回合只可触发1次。` }
  getExtendAttributes() {
    return { hpRate: this.data.hpRate };
  }
  getBuffList(){
    const c = this.character;
    return [
      Buff.getListJson(c, BuffCriDamage, [Buff.simpleListener()],'',{
        criDamage: this.data.criDamage, name:'暴伤', source:'光锥', maxValue: 1,
      })
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='HP_CHANGE' && unit===c && this.updateCD(1)){
      c.addBuff(Buff.getKey(c.name,'光锥', '暴伤'), c, 1, {count:2});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesYLSL,
}