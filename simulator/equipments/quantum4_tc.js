// 群星璀璨的天才
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffThrough extends Buff {
  static info() {
    return {
      name: '天才',
      short: '穿透',
      source: '遗器',
      desc: '无视目标10%防御，若目标弱量子则额外无视10%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    const weakQuantum = target.findBuff({tag:'weakQuantum'});
    return {
      defThrough: 10 + (weakQuantum ? 10 : 0),
    }
  }
}

class Quantum4TC extends EquipSet {
  static getDesc() {
    return {
      name: '繁星璀璨的天才',
      short: '天才',
      set2: '量子伤提升10%',
      set4: '无视敌人10%防御，若目标有量子弱点额外无视10%',
      image: 'quantum4_tc',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusQuantum: 10} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffThrough) ];
  }
}

module.exports = Quantum4TC;