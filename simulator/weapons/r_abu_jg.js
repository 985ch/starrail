'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const Buff = require('../buff');
const { BuffEn } = require('../buff_simple');

const baseData = {
  name: '嘉果',
  short: '甘美',
  rarity: 'R',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['14_317'],
  def: D.levelData['9_198'],
  data: D.makeTable([['en'],[6.0],[7.5],[9.0],[10.5],[12.0]]),
};

class RAbuJG extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `战斗开始时为我方全体回复${this.data.en}点能量` }
  getBuffList(){
    const en = this.data.en;
    return [
      Buff.getListJson(this.character, BuffEn, [
        { e:'BTL_S', f:(buff, unit)=> unit.addEn(en) }
      ], '', {
        en,
        name: baseData.short, source:'光锥',
        title: '甘美[回能]', label: '进战回能', tip:'进入战斗时',
        target: 'members', maxValue: 0, hide: true,
      }),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: RAbuJG,
};
