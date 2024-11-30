'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffCriDamage } = require('../buff_simple')

const baseData = {
  name: '天才们的休憩',
  short: '各得其所',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['atkRate','criDamage'],[16,24],[20,30],[24,36],[28,42],[32,48]]),
};

class SrEruTC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%。消灭敌方目标后暴伤提高${this.data.criDamage}%，持续3回合。` }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDamage, [Buff.simpleListener()], '', {
        criDamage: this.data.criDamage,
        name: baseData.short, source: '光锥', desc: '消灭敌方目标后',
        maxValue: 1,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_KILL' || unit!==c || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count:3 });
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruTC,
}