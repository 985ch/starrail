'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffBonus } = require('../buff_simple');

const baseData = {
  name: '与行星相会',
  short: '启程',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['48_1058'],
  atk: D.levelData['19_423'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonus'],[12],[15],[18],[21],[24]]),
};

class SRHarXXXH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `我方目标造成和装备者同属性的伤害时，伤害增加${this.data.bonus}%。` }
  getBuffList(){
    const type = this.character.base.type;
    return [ Buff.getListJson(this.character, BuffBonus, [], type, {
      type,
      ['bonus' + type]: this.data.bonus,
      name: baseData.short,  source: '光锥',  desc: '造成和装备者同属性的伤害增加，',
      target: 'members',
    }) ];
  }
}

module.exports = {
  data: baseData,
  weapon: SRHarXXXH,
};
