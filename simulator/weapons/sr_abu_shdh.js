'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffHealRate} = require('../buff_simple');

const baseData = {
  name: '一场术后对话',
  short: '互相治愈',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['48_1058'],
  atk: D.levelData['19_423'],
  def: D.levelData['15_330'],
  data: D.makeTable([['enRate', 'healRate'],[8,12],[10,15],[12,18],[14,21],[16,24]]),
};

class SrAbuSHDH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `能量恢复效率提高${this.data.enRate}%，施放终结技时治疗量提高${this.data.healRate}%。`; }
  getExtendAttributes() {
    return { enRate: this.data.enRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHealRate, [Buff.eventListener('ACT_E', 'self')], '', {
        healRate: this.data.healRate,
        name: baseData.short, source:'光锥', desc:'施放终结技时',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,'US')){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuSHDH,
}