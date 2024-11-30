// 戍卫风雪的铁卫
'use strict';

const { C, EquipSet } = require('../index');

class Block4TW extends EquipSet {
  static getDesc() {
    return {
      name: '戍卫风雪的铁卫',
      short: '铁卫',
      set2: '受到的伤害降低8%',
      set4: '若生命值低于50%则回合开始时恢复8%生命和5点能量',
      image: 'block4_tw',
      evt:'TURN_S'
    }
  }
  getAttributes() {
    return (this.count >= 2)?{damageRate:0.92}:{};
  }
  getReportData() {
    if(this.count < 4) return [];
    const c = this.character;
    return [
      { type:'heal', name:'铁卫[回血]', labels:['每回合'], heal0: C.calHealData(c.getAttr('hp')*0.08, c, c) },
      { type:'energy', name:'铁卫[回能]', labels:['每回合'], en0: C.calEnergy(5, c) },
    ];
  }
  onEvent(evt, unit, data){
    const c = this.character;
    const hpMax = c.getAttr('hp');
    if(this.count<4 || unit!==c || c.state.hp >= hpMax * 0.5) return;
    c.triggerHeal([c], hpMax*0.08);
    c.addEn(5);
  }
}

module.exports = Block4TW;