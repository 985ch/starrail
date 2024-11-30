// 街头出身的拳王
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');
const { BuffAtkRate } = require('../buff_simple');

class Physical4QW extends EquipSet {
  static getDesc() {
    return {
      name: '街头出身的拳王',
      short: '拳王',
      set2: '物伤提高10%',
      set4: '施放攻击或受到攻击后，本场战斗攻击力提升5%，可叠5层',
      image: 'physical4_qw',
      buffs: [['攻击提高', '拳王', 5]],
      evt: ['C_DMG_E', 'B_DMG_E'],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusPhysical: 10} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffAtkRate, [], '', {
      atkRate: 5, maxValue: 5,
      name: '拳王', source: '遗器',
    }) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(this.count<4 || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '拳王'), c, 1);
  }
}

module.exports = Physical4QW;