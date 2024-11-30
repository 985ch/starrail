// 晨昏交界的翔鹰
'use strict';

const EquipSet = require('../equip_set');
const { C, D } = require('../index');

class Wind4XY extends EquipSet {
  static getDesc() {
    return {
      name: '晨昏交界的翔鹰',
      short: '翔鹰',
      set2: '风伤提高10%',
      set4: '施放终结技后，行动提前25%',
      image: 'wind4_xy',
      evt: 'ACT_E',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusWind: 10} : {};
  }
  getReportData() {
    if(this.count >= 4){
      const speed = this.character.getAttr('speed');
      return [{ type:'action', name:'终结技后', wait: C.calActionTime(speed, 25) }];
    }
    return [];
  }
  onEvent(e, unit, data){
    if(!D.checkType(data.type,'US') || this.count<4 || this.character !== unit) return;
    this.character.changeWaitTime(-25, true);
  }
}

module.exports = Wind4XY;