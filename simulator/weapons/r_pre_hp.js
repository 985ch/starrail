'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '琥珀',
  short: '静滞',
  rarity: 'R',
  job: '存护',
  hp: D.levelData['38_846'],
  atk: D.levelData['12_264'],
  def: D.levelData['15_330'],
  data: D.makeTable([['defRate','defPlus'],[16,16],[20,20],[24,24],[28,28],[32,32]]),
};

class BuffDefRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '加防',
      source: '光锥',
      desc: '生命值低于50%时防御提升',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '加防'],
    };
  }
  getDesc() {
    return `生命值低于50%时防御提升${this.data.defPlus}%`;
  }
  getAttributes() {
    if(this.member.checkHp(50)) {
      return { defRate: this.data.defPlus }
    }
    return null;
  }
}

class RPreHP extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `防御提高${this.data.defRate}%，生命值低于50%时防御额外提高${this.data.defPlus}%`}
  getExtendAttributes() {
    return {
      defRate: this.data.defRate,
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDefRate,[Buff.markListener('HP_CHANGE', 'self')], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: RPreHP,
}