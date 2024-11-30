// 流星追迹的怪盗
'use strict';

const EquipSet = require('../equip_set');

class Break4GD extends EquipSet {
  static getDesc() {
    return {
      name: '流星追迹的怪盗',
      short: '怪盗',
      set2: '击破特攻提高16%',
      set4: '击破特攻提高16%，击破弱点后回能3点',
      image: 'break4_gd',
      evt: 'C_BREAK',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? {breakRate:((this.count>=4)? 32 : 16)} : {};
  }
  getReportData() {
    if(this.count >= 4){
      return [{ type:'energy', name:'怪盗[回能]',  labels:['击破回能'], en0:3 }];
    }
    return [];
  }
  onEvent(evt, unit, data){
    if(this.count<4 || unit!==this.character) return;
    this.character.addEn(3);
  }
}

module.exports = Break4GD;