// 熔岩锻铸的火匠
'use strict';

const EquipSet = require('../equip_set');
const { Buff, D } = require('../index');
const { BuffBonus } = require('../buff_simple');

class Fire4HJ extends EquipSet {
  static getDesc() {
    return {
      name: '熔岩锻铸的火匠',
      short: '火匠',
      set2: '火伤提高10%',
      set4: '战技伤害提高12%，施放终结技后下一次攻击火伤提升12%',
      image: 'fire4_hj',
      buffs: [['火伤提高', '火匠', 1]],
      evt:'ACT_E',
    }
  }
  getAttributes() {
    const attributes = {};
    if (this.count >= 2) {
      attributes.bonusFire = 10;
    }
    if (this.count >=4 ) {
      attributes.bonusNS = 12;
    }
    return attributes;
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffBonus, [Buff.eventListener('C_ATK_E', 'self')], '', {
      bonusFire: 12, type: 'Fire',
      name: '火匠', source:'遗器', desc: '下一次攻击', maxValue: 1,
    }) ];
  }
  onEvent(evt, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,'US') ||this.count<4 || unit!==c) return;
    c.addBuff(Buff.getKey(c.name,'遗器', '火匠'), c, 1, null);
  }
}

module.exports = Fire4HJ;