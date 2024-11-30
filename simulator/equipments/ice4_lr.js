// 密林卧雪的猎人
'use strict';

const EquipSet = require('../equip_set');
const { D, Buff } = require('../index');
const { BuffCriDamage } = require('../buff_simple');

class Ice4LR extends EquipSet {
  static getDesc() {
    return {
      name: '密林卧雪的猎人',
      short: '猎人',
      set2: '冰伤提高10%',
      set4: '施放终结技后暴伤提升25%，持续2回合',
      image: 'ice4_lr',
      buffs: [['暴伤提高', '猎人', 1]],
      evt:'ACT_E',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusIce: 10} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffCriDamage, [Buff.simpleListener()], '', {
      criDamage: 25,
      name: '猎人', source: '遗器', desc: '施放终结技后', maxValue: 1,
    }) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'US') || this.count<4 || c !== unit) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '猎人'), c, 1, { count: 2 });
  }
}

module.exports = Ice4LR;