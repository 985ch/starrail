'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '梦应归于何处',
  short: '蜕变',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['52_1164'],
  atk: D.levelData['21_476'],
  def: D.levelData['24_529'],
  data: D.makeTable([['breakRate', 'weakBRK'],[60, 24],[70, 28],[80, 32],[90, 36],[100, 40]]),
};

class BuffKB extends Buff {
  static info() {
    return {
      name: '溃败',
      short: '溃败',
      source: '光锥',
      desc: '受到指定目标的击破伤害提高，速度降低',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '减速'],
    };
  }
  getDesc() {
    return `对${this.member.name}有${this.data.weakBRK}%击破易伤，速度降低20%`
  }
  getAttributes() {
    return { speedRate: -20 }
  }
  getAttributesB(target) {
    return target===this.member? {weakBRK: this.data.weakBRK}: null;
  }
  checkSameBuff( buff ){
    return this.constructor===buff.constructor && this.target===buff.target;
  }
}

class SsrDesMGHC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `击破特攻提高${this.data.breakRate}%。造成击破伤害时使目标陷入【溃败】状态，持续2回合。【溃败】状态下目标对装备者有${this.data.weakBRK}%的击破易伤，且速度降低20%，同类效果无法叠加。`
  }
  getExtendAttributes(){
    return { breakRate: this.data.breakRate }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffKB, [Buff.simpleListener()], '', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_HIT_E' && unit===c && D.checkType(data.type,['BRK'])){
      c.addBuff(Buff.getKey(c.name,'光锥', '溃败'), c, 1, { count:2 });
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesMGHC,
}