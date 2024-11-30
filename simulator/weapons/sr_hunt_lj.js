'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '论剑',
  short: '各自的答案',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonusAll'],[8],[10],[12],[14],[16]]),
};

class SrHuntCSCS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `反复击中同一敌方目标时，每次造成的伤害提升${this.data.bonusAll}%，最多叠加5次。切换目标后失去该效果。`}
  getBuffList(){
    const c = this.character;
    return [
      Buff.getListJson(c, BuffDamage, [], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source: '光锥', desc:'连续攻击同一目标',
        maxValue:5,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_HIT_S' && unit===c){
      const ws = c.state.weapon;
      const key = Buff.getKey(c.name, '光锥', baseData.short)
      if(ws.target !== data.target.name ) {
        const buff = c.findBuff({ key })
        if(buff)c.removeBuff(buff);
        ws.target = data.target.name;
      }
      c.addBuff(key, c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntCSCS,
}