// 激奏雷电的乐队
'use strict';

const EquipSet = require('../equip_set');
const {D, Buff} = require('../index');
const { BuffAtkRate } = require('../buff_simple');

class Thunder4YD extends EquipSet {
  static getDesc() {
    return {
      name: '激奏雷电的乐队',
      short: '乐队',
      set2: '雷伤提高10%',
      set4: '施放战技时，攻击力提高20%，持续1回合',
      image: 'thunder4_yd',
      buffs: [['攻击提高', '乐队', 1]],
      evt: 'ACT_E',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusThunder: 10} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffAtkRate, [Buff.simpleListener()],'', {
      atkRate: 20, maxValue: 1,
      name: '乐队', source: '遗器', desc: '施放战技时，',
    }) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'NS') ||this.count<4 || unit!==c ) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '乐队'), c, 1);
  }
}

module.exports = Thunder4YD;