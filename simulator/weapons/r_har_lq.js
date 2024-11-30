'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const C = require('../compute');

const baseData = {
  name: '轮契',
  short: '速决',
  rarity: 'R',
  job: '同谐',
  hp: D.levelData['38_846'],
  atk: D.levelData['14_317'],
  def: D.levelData['12_264'],
  data: D.makeTable([['en'],[4],[5],[6],[7],[8]]),
};

class RHarLQ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放或受到攻击后回复${this.data.en}点能量，每回合一次` }
  getReportData() {
    const en = C.calEnergy(this.data.en, this.character);
    return [{ type:'energy', name:'速决[回能]', tip:'每回合一次', labels:['攻击', '受击'], en0: en, en1: en}];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if((e==='C_ATK_E' || e==='B_ATK_E') && unit===c && this.updateCD(1, true)){
      c.addEn(this.data.en);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: RHarLQ,
};
