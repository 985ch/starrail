'use strict';

const { C, D, BaseWeapon, Buff } = require('../index');
const { BuffCriRate } = require('../buff_simple')

const baseData = {
  name: '铭记于心的约定',
  short: '传承',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['breakRate','criRate'],[28,15],[35,18.75],[42,22.5],[49,26.25],[56,30]]),
};

class SrDesNJYX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。施放终结技时暴击提高${this.data.criRate}%，持续2回合。` }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [Buff.simpleListener()], '', {
        criRate: this.data.criRate, name: baseData.short, source: '光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type, 'US')){
      c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1, { count: 2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesNJYX,
}