'use strict';

const EquipSet = require('../equip_set');
const { Buff, D } = require('../index');
const { BuffBonus } = require('../buff_simple');

class Fire4HJ extends EquipSet {
  static getDesc() {
    return {
      name: '识海迷坠的学者',
      short: '学者',
      set2: '暴击率提高8%',
      set4: '战技和终结技造成的伤害提高20%，施放终结技后，下一次施放战技时造成的伤害额外提高25%。',
      image: 'cri4_xz',
      buffs: [['战技增伤', '学者', 1]],
      evt:'ACT_E',
    }
  }
  getAttributes() {
    const attributes = {};
    if (this.count >= 2) {
      attributes.criRate = 8;
    }
    if (this.count >=4 ) {
      attributes.bonusNS = 20;
      attributes.bonusUS = 20;
    }
    return attributes;
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffBonus, [Buff.eventListener('C_ATK_E', 'self')], '', {
      bonusNS: 25, type: 'NS',
      name: '学者', source:'遗器', desc: '下一次攻击', maxValue: 1,
    }) ];
  }
  onEvent(evt, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'US') ||this.count<4 || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '学者'), c, 1, null);
  }
}

module.exports = Fire4HJ;