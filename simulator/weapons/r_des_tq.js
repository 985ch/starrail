'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');

const baseData = {
  name: '天倾',
  short: '破灭',
  rarity: 'R',
  job: '毁灭',
  hp: D.levelData['38_846'],
  atk: D.levelData['16_370'],
  def: D.levelData['9_198'],
  data: D.makeTable([['bonusNA', 'bonusNS'], [20, 20], [25, 25], [30, 30], [35, 35], [40, 40]]),
};

class RDesTQ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `普攻和战技伤害增加${this.data.bonusNA}%` }
  getExtendAttributes() {
    return this.data;
  }
}

module.exports = {
  data: baseData,
  weapon: RDesTQ,
};
