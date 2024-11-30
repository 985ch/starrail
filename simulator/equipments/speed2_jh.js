// 劫火莲灯铸炼宫
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');
const { BuffBreakRate } = require('../buff_simple'); 

class Speed2JH extends EquipSet {
  static getDesc() {
    return {
      name: '劫火莲灯铸炼宫',
      short: '劫火',
      set2: '速度提高6%。当装备者击中弱火的目标时，击破特攻提高40%，持续1回合',
      image: 'speed2_jh',
      buffs: [['击破特攻', '劫火', 1]],
      evt: 'C_HIT_S',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { speedRate: 6} : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [
      Buff.getListJson(this.character, BuffBreakRate, [Buff.simpleListener()], '', {
        breakRate: 40, name: '劫火', source: '遗器',  maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(this.count<2 || unit!==c) return;
    if(e === 'C_HIT_S' && data.target.findBuff({tag:'weakFire'})) {
      c.addBuff(Buff.getKey(c.name,'遗器', '劫火'), c, 1, {count: 1});
    }
  }
}

module.exports = Speed2JH;