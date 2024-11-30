// 云无留迹的过客
'use strict';

const EquipSet = require('../equip_set');

class Heal4GK extends EquipSet {
  static getDesc() {
    return {
      name: '云无留迹的过客',
      short: '过客',
      set2: '治疗量提高10%',
      set4: '战斗开始时恢复1个战技点',
      image: 'heal4_gk',
      evt: 'BTL_S',
    }
  }
  getAttributes() {
    return (this.count >= 2)? { healRate: 10 }: {};
  }
  onEvent(evt, unit, data){
    if(this.count<4|| unit!==this.character) return;
    this.character.changeSp(1);
  }
}

module.exports = Heal4GK;