// 生命的翁瓦克
'use strict';

const EquipSet = require('../equip_set');
const C = require('../compute');

class En2WWK extends EquipSet {
  static getDesc() {
    return {
      name: '生命的翁瓦克',
      short: '翁瓦克',
      set2: '回能提高5%，若速度大于等于120时首轮行动提前40%',
      image: 'en2_wwk',
      evt: 'BTL_S',
    }
  }
  getAttributes() {
    return (this.count >= 2)? { enRate: 5 }: {};
  }
  getReportData() {
    if(this.count >= 2){
      const speed = this.character.getAttr('speed');
      return [{ type:'action', name:'首次行动', tip:'因增益效果影响而不准', wait: C.calActionTime(speed, 40) }];
    }
    return [];
  }
  onEvent(evt, unit, data){
    if(this.count<2 || this.character.getAttr('speed') < 119.9999 || unit!==this.character) return;
    this.character.changeWaitTime(-40);
  }
}

module.exports = En2WWK;