// 野穗伴行的快枪手
'use strict';

const EquipSet = require('../equip_set');

class Atk4KQS extends EquipSet {
  static getDesc() {
    return {
      name: '野穗伴行的快枪手',
      short: '快枪手',
      set2: '攻击力增加12%',
      set4: '速度增加6%，普攻伤害增加10%',
      image: 'atk4_kqs',
    }
  }
  getAttributes() {
    const attributes = {};
    if (this.count >= 4) {
      attributes.speedRate = 6;
      attributes.bonusNA = 10;
    }
    if (this.count >= 2) {
      attributes.atkRate = 12;
    }
    return attributes;
  }
}

module.exports = Atk4KQS;