'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');

const baseData = {
  name: '猎物的视线',
  short: '自信',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['hit','bonusDOT'], [20, 24], [25, 30], [30, 36], [35, 42], [40, 48]]),
};

class SrNihXSRW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `效果命中提高${this.data.hit}%,同时造成的持续伤害提高${this.data.bonusDOT}%。` }
  getExtendAttributes() {
    return this.data;
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihXSRW,
}