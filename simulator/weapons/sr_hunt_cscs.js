'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '春水初生',
  short: '驱散余寒',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['speedRate', 'bonusAll'],[8, 12], [9, 15], [10, 18], [11, 21], [12, 24]]),
};

class BuffDmgSpd extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '驱散余寒',
      source: '光锥',
      desc: '加速并增伤',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '加速', '增伤', 'removable', 'bonusAll' ],
    }
  }
  getDesc() {
    const { speedRate, bonusAll } = this.data;
    return `速度提高${speedRate.toFixed(1)}%，伤害提高${bonusAll.toFixed(1)}%`;
  }
  getAttributes() {
    return this.data;
  }
}

class SrHuntCSCS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `进战后速度提高${this.data.speedRate}%，伤害提高${this.data.bonusAll}%。受到伤害后效果消失，下个回合结束时该效果恢复。`}
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffDmgSpd, [
      {e:'B_HIT_E', t:'self', f:(buff, unit, data)=>{
        if(data.damage > (data.blocked || 0)) {
          buff.state.count = 0;
        }
      }}
    ], '', this.data) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if((e==='BTL_S' || e==='TURN_E') && unit===c){
      c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntCSCS,
}