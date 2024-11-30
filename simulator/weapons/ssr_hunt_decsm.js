'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '驶向第二次生命',
  short: '苦航',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['breakRate', 'arpBRK', 'speedRate'],
    [ 60, 20, 12],
    [ 70, 23, 14],
    [ 80, 26, 16],
    [ 90, 29, 18],
    [100, 32, 20],
  ]),
};

class BuffSpeed extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '加速',
      source: '遗器',
      desc: '速度提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const data = this.getData();
    return `速度提高${data.speedRate}%。`;
  }
  isActivated() {
    return this.member.getAttr('breakRate')>=149.9999;
  }
  getTransAttr() {
    const { speedRate } = this.data;
    return {
      speedRate: { raw:'breakRate', min:150, add:speedRate },
    };
  }
}

class SsrHuntDECSM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    const d = this.data;
    return `击破特攻提高${d.breakRate}%，造成的击破伤害无视敌人${d.arpBRK}%防御力。装备者击破特攻大于等于150%时，速度提高${d.speedRate}%`;
  }
  getExtendAttributes(){
    return {
      breakRate: this.data.breakRate,
      arpBRK: this.data.arpBRK,
    }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffSpeed, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntDECSM,
}