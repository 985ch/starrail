// 无主荒星茨冈尼亚
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');
const { BuffCriDamage } = require('../buff_simple');

class BuffCGNY extends Buff {
  static info() {
    return {
      name: '茨冈尼亚',
      short: '荒星(被动)',
      source: '遗器',
      desc: '监控敌方消灭',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'B_KILL', t:'enemies', f:(buff, unit, data)=>{
      m.addBuff(Buff.getKey(m.name, '遗器', '荒星'), m, 1);
    }})
  }
}

class Cri2CGNY extends EquipSet {
  static getDesc() {
    return {
      name: '无主荒星茨冈尼亚',
      short: '荒星',
      set2: '暴击提高4%。敌方被消灭时暴伤提高4%，可叠10层。',
      image: 'cri2_cgny',
      buffs: [['爆伤提高', '荒星', 10]],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { criRate: 4 } : {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffCriDamage, [], '', {
      criDamage: 4, maxValue: 10,
      name: '荒星', source: '遗器',
    }), Buff.getListJson(this.character, BuffCGNY) ];
  }
}

module.exports = Cri2CGNY;