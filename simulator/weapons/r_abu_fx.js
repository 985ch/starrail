'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const C = require('../compute');

const baseData = {
  name: '蕃息',
  short: '丰饶民',
  rarity: 'R',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['14_317'],
  def: D.levelData['9_198'],
  data: D.makeTable([['actionRate'],[12],[14],[16],[18],[20]]),
};

class RAbuFX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放普攻后行动提前${this.data.actionRate}%` }
  getReportData() {
    const wait = C.calActionTime(this.character.getAttr('speed'), this.data.actionRate)
    return [{ type:'action', name:'普攻后', wait}];
  }
  onEvent(e, unit, data) {
    if(e!== 'ACT_E' || !D.checkType(data.type,'NA') || unit!==this.character) return;
    this.character.changeWaitTime(-this.data.actionRate);
  }
}

module.exports = {
  data: baseData,
  weapon: RAbuFX,
};
