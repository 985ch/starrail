// 筑城者的贝洛伯格
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffDef extends Buff {
  static info() {
    return {
      name: '筑城者',
      short: '加防',
      source: '遗器',
      desc: '命中大于等于50%则防御提高15%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getTransAttr() {
    return {
      defRate: { raw:'hit', min: 50, add: 15 },
    };
  }
}

class Def2BLBG extends EquipSet {
  static getDesc() {
    return {
      name: '筑城者的贝洛伯格',
      short: '筑城者',
      set2: '防御提升15%，若命中大于等于50%则防御额外提高15%',
      image: 'def2_blbg',
      needAttrs: [{raw:'hit', tar:['def'], range:[35, 50]}],
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { defRate: 15 }: {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffDef) ];
  }
}

module.exports = Def2BLBG;