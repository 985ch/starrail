'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');
const C = require('../compute');

const baseData = {
  name: '别让世界静下来',
  short: '声音的力量',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['en','bonusUS'],[20,32],[23,40],[26,48],[29,56],[32,64]]),
};

class SrEruSJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `进入战斗时回复${this.data.en}点能量，并使终结技伤害提高${this.data.bonusUS}%。` }
  getExtendAttributes() {
    return { bonusUS: this.data.bonusUS };
  }
  getReportData() {
    const en = C.calEnergy(this.data.en, this.character);
    return [{
      type:'energy', name:'声音的力量[回能]', labels:['回能'],
      tip: '进入战斗时',
      en0: en,
    }];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'BTL_S' || unit!==c) return;
    c.addEn(this.data.en);
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruSJ,
}