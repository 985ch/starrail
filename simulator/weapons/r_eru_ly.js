'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const C = require('../compute');

const baseData = {
  name: '灵钥',
  short: '顿悟',
  rarity: 'R',
  job: '智识',
  hp: D.levelData['33_740'],
  atk: D.levelData['16_370'],
  def: D.levelData['12_264'],
  data: D.makeTable([['en'],[8],[9],[10],[11],[12]]),
};

class REruLY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放战技后额外回复${this.data.en}点能量，每回合一次` }
  getReportData() {
    const en = C.calEnergy(this.data.en, this.character);
    return [{ type:'energy', name:'顿悟[回能]', tip:'施放战技后', labels:['额外回能'], en0: en}];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_E' && D.checkType(data.type,'NS') && unit===c && this.updateCD(1)){
      c.addEn(this.data.en);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: REruLY,
};
