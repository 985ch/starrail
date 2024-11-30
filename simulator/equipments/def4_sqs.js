// 净庭教宗的圣骑士
'use strict';

const EquipSet = require('../equip_set');

class Def4SQS extends EquipSet {
  static getDesc() {
    return {
      name: '净庭教宗的圣骑士',
      short: '圣骑士',
      set2: '防御提升15%',
      set4: '护盾量提升20%',
      image: 'def4_sqs',
    }
  }
  getAttributes() {
    const attributes = {};
    if (this.count >= 2) {
      attributes.defRate = 15;
    }
    if(this.count >= 4) {
      attributes.shieldRate = 20;
    }
    return attributes;
  }
}

module.exports = Def4SQS;