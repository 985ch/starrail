'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { DebuffDot } = require('../debuff_simple');

const baseData = {
  name: '宇宙市场趋势',
  short: '洗牌',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['48_1058'],
  atk: D.levelData['16_370'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['defRate', 'baseHit', 'rate'],
    [ 16,  100,   40 ],
    [ 20,  105,   50 ],
    [ 24,  110,   60 ],
    [ 28,  115,   70 ],
    [ 32,  120,   80 ],
  ]),
};

class SrPreSCQS extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `防御提高${this.data.defRate}%。受到攻击后，有${this.data.baseHit}%的基础概率使敌方陷入灼烧状态，每回合造成等同于装备者${this.data.rate}%防御力的火属性伤害，持续2回合。` }
  getDotData() {
    return {
      rate: this.data.rate,
      count: 1,
      turn: 2,
      baseHit: this.data.baseHit,
      baseAttr: 'def',
      type: 'Fire',
      isDot: true,
      name: baseData.short + '[灼烧]', source:'光锥',
      title: baseData.short + '[灼烧]',
    }
  }
  getExtendAttributes() {
    return {
      defRate: this.data.defRate,
    };
  }
  getBuffList(){
    return [ Buff.getListJson(this.character, DebuffDot, [Buff.dotListener()], '', this.getDotData()) ];
  }
  getReportData(target){
    return this.getAdditionDamageReport(target, this.getDotData());
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e === 'B_ATK_E' && unit === c && data.member.faction === 'enemies') {
      c.addBuffRandom(Buff.getKey(c.name,'光锥',  baseData.short + '[灼烧]'), data.member, 1, {}, this.data.baseHit * 0.01, 1, false, true);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreSCQS,
}