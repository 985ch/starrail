'use strict';

const EquipSet = require('../equip_set');
const {D, Buff} = require('../index');

class BuffBonusUS extends Buff {
  static info() {
    return {
      name: '勇烈',
      short: '增伤',
      source: '遗器',
      desc: '终结技造成的伤害提高36%',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff','增伤','bonusUS'],
    };
  }
  getAttributes() {
    return { bonusUS:36 };
  }
}

class Atk4YL extends EquipSet {
  static getDesc() {
    return {
      name: '风举云飞的勇烈',
      short: '勇烈',
      set2: '攻击力提高12%',
      set4: '暴击率提高6%。施放追加攻击时终结技伤害提高36%，持续1回合。',
      image: 'atk4_yl',
      buffs: [['终结技增伤', '勇烈', 1]],
      evt: 'C_ATK_S',
    }
  }
  getAttributes() {
    return {atkRate:this.count>=2? 12: 0, criRate:this.count>=4? 6: 0};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffBonusUS, [Buff.simpleListener()]) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(this.count<4 || unit!==c) return;
    if(e === 'C_ATK_S' && D.checkType(data.type,'AA')) {
      c.addBuff(Buff.getKey(c.name,'遗器', '勇烈'), c, 1, {count: 1});
    }
  }
}

module.exports = Atk4YL;