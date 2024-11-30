'use strict';

const { D, BaseWeapon, Buff } = require('../index');

const subName = {NA:'普攻',NS:'战技',US:'终结技'}
const baseData = {
  name: '美梦小镇大冒险',
  short: '团结',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['bonus'], [12], [14], [16], [18], [20]]),
};

class BuffWeapon extends Buff {
  static info(data) {
    const key = data.key;
    return {
      name: '童心[' + subName[key] + ']',
      short: '增伤',
      source: '光锥',
      desc: '全队'+subName[key]+'伤害提高',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '增伤', 'bonus' + key ],
    };
  }
  getDesc() {
    return `全队${subName[this.data.key]}伤害提高${this.data.bonus}%`
  }
  getAttributes() {
    if(!this.member.checkAlive()) return {};
    return { ['bonus' + this.data.key]: this.data.bonus }
  }
  checkSameBuff( buff ){
    return this.constructor === buff.constructor;
  }
}

class SrHarMMXZ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `装备者施放普攻/战技/终结技后，为我方全体附加[童心],[童心]使对普攻/战技/终结技伤害提高${this.data.bonus}%。仅对最新使用的技能类型生效，且不可叠加。` }
  getBuffList(){
    const bonus = this.data.bonus;
    return [
      Buff.getListJson(this.character, BuffWeapon, [], '', { key: 'NA', bonus }),
      Buff.getListJson(this.character, BuffWeapon, [], '', { key: 'NS', bonus }),
      Buff.getListJson(this.character, BuffWeapon, [], '', { key: 'US', bonus }),
    ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(e!=='ACT_E' || c!== unit) return;
    const type = D.checkType(data.type, ['NA','NS','US']);
    if(type) c.addBuff(Buff.getKey(c.name, '光锥', '童心['+ subName[type] + ']'), c, 1);
  }
}

module.exports = {
  data: baseData,
  weapon: SrHarMMXZ,
};
