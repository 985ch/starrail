// 宝命长存的莳者
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');
const { BuffCriRate } = require('../buff_simple');

class Hp4SZ extends EquipSet {
  static getDesc() {
    return {
      name: '宝命长存的莳者',
      short: '莳者',
      set2: '生命上限提高12%',
      set4: '受击或被我方消耗生命后，暴击率提高8%，持续2回合，可叠2层',
      image: 'hp4_sz',
      buffs: [['暴击提高', '莳者', 2]],
      evt:['B_ATK_E','HP_CHANGE'],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { hpRate: 12} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffCriRate, [Buff.simpleListener()], '', {
      criRate: 8, maxValue: 2,
      name: '莳者', source: '遗器', desc: '受击或被我方消耗生命后，',
    }) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(unit!=c || this.count<4) return;
    if(e === 'B_ATK_E' || (e=== 'HP_CHANGE' && data.member.faction==='members' && data.change<0 && data.source==='cost')) {
      c.addBuff(Buff.getKey(c.name,'遗器', '莳者'), c, 1, {count: 2});
    }
  }
}

module.exports = Hp4SZ;