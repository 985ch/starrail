'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffCriRate } = require('../buff_simple')

const baseData = {
  name: '在蓝天下',
  short: '暖阳麦浪',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate','criRate'],[16,12],[20,15],[24,18],[28,21],[32,24]]),
};

class SrDesZLTX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击力提高${this.data.atkRate}%。消灭敌方目标后，暴击率提高${this.data.criRate}%，持续3回合。` }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [Buff.simpleListener()], '', {
        criRate: this.data.criRate,
        name: baseData.short, source: '光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c || e!=='C_KILL' || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count:3 });
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesZLTX,
}