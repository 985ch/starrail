'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffCriDamage } = require('../buff_simple');

const baseData = {
  name: '最后的赢家',
  short: '下注',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate', 'criDamage'], [12, 8], [14, 9], [16, 10], [18, 11], [20, 12]]),
};

class SrHuntZHDYJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%。装备者造成暴击后获得1层[好运]，最多4层，每层使暴伤提高${this.data.criDamage}%，持续到回合结束。`}
  getExtendAttributes() {
    return { atkRate: this.data.atkRate}
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDamage, [Buff.eventListener('TURN_E','self')], '', { criDamage: this.data.criDamage, name: '好运', source: '光锥', maxValue: 4 }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if( unit === c && e === 'C_HIT_E' && data.isCri) {
      c.addBuff(Buff.getKey(c.name,'光锥', '好运'), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntZHDYJ,
}