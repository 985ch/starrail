'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '「我」的诞生',
  short: '画像少女',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['bonusAA','bonusPlus'],[24,24],[30,30],[36,36],[42,42],[48,48]]),
};

class BuffBonusAA extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '暴击',
      source: '光锥',
      desc: '对生命值50%及以下的敌人，追加攻击的伤害增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `对生命值50%及以下的敌人，追加攻击的伤害增加${this.data.bonusPlus}%`;
  }
  getAttributesT(target) {
    if(target.checkHp(50)) {
      return { bonusAA: this.data.bonusPlus }
    }
    return {};
  }
}
class SrEruWDDS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `追加攻击伤害提高${this.data.bonusAA}%。若敌方目标生命值小于等于50%则额外提高${this.data.bonusPlus}%。` }
  getExtendAttributes() {
    return { bonusAA: this.data.bonusAA };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffBonusAA, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruWDDS,
}