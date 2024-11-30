'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '银河铁道之夜',
  short: '流星群',
  rarity: 'SSR',
  job: '智识',
  hp: D.levelData['52_1164'],
  atk: D.levelData['26_582'],
  def: D.levelData['18_396'],
  data: D.makeTable([['atkRate', 'bonusAll'],[9, 30],[10.5, 35],[12, 40],[13.5, 45],[15, 50]]),
};

class BuffAtkRate extends Buff {
  static info() {
    return {
      name: baseData.short + '[加攻]',
      short: '加攻',
      source: '光锥',
      desc: '根据场上敌人的数量提升攻击力',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '加攻'],
    };
  }
  getDesc() {
    return `攻击力提高${this.getData()}%`
  }
  getAttributes() {
    return { atkRate: this.getData() }
  }
  getData() {
    return this.data.atkRate * Math.min(5, this.member.team.getAliveUnits('enemies').length);
  }
}

class SsrEruYHTD extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `场上每有一个敌人攻击力提高${this.data.atkRate}%，最多叠加5层。任意敌方目标被击破弱点时，伤害提高${this.data.bonusAll}%，持续1回合。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short + '[增伤]', source:'光锥',
        maxValue: 1,
      }),
      Buff.getListJson(this.character, BuffAtkRate, [Buff.markListener(['B_KILL','REBORN'], 'enemies')], '', this.data ),
    ];
  }
  addListens() {
    const enemies = this.character.team.enemies;
    enemies.forEach(enemy => enemy && enemy.listenEvent('B_BREAK', this));
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt==='B_BREAK') {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + '[增伤]'), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrEruYHTD,
}