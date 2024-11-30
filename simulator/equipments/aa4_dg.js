'use strict';

const EquipSet = require('../equip_set');
const {D, Buff} = require('../index');

class BuffAtk extends Buff {
  static info() {
    return {
      name: '大公',
      short: '加攻',
      source: '遗器',
      desc: '每次追加攻击提升6%攻击力',
      show: true,
      maxValue: 8,
      target: 'self',
      tags: ['buff', '加攻'],
    };
  }
  getDesc() {
    return `攻击力提升${6*this.value}%。`
  }
  init() {
    this.listen({e:'C_DMG_S',t:'self', f:(buff, unit, data) => {
      if(D.checkType(data.type, 'AA')) this.state.count = 0;
    }})
  }
  getAttributes() {
    return { atkRate: 6 * this.value }
  }
}

class AA4DG extends EquipSet {
  static getDesc() {
    return {
      name: '毁烬焚骨的大公',
      short: '大公',
      set2: '追击伤害提高20%',
      set4: '根据追加攻击造成伤害的次数提升攻击力，每次提升6%，最多叠加8层。持续3回合或持续到装备者下次施放追加攻击。',
      image: 'aa4_dg',
      buffs: [['攻击提升', '大公', 8]],
      evt: 'C_HIT_S',
    }
  }
  getAttributes() {
    return (this.count >= 2)?{bonusAA:20}:{};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffAtk, [Buff.simpleListener()]) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(this.count<4 || unit!==c) return;
    if(e === 'C_HIT_S' && D.checkType(data.type,'AA')) {
      c.addBuff(Buff.getKey(c.name,'遗器', '大公'), c, 1, {count: 3});
    }
  }
}

module.exports = AA4DG;