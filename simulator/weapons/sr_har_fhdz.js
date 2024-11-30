'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '芳华待灼',
  short: '莫失莫忘',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['atkRate', 'criDamage'], [16, 16], [20, 20], [24, 24], [28, 28], [32, 32]]),
};

class BuffCriDamage extends Buff {
  static info() {
    return {
      name: '莫失莫忘',
      short: '暴伤',
      source: '光锥',
      desc: '同命途角色暴伤提高',
      show: true,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '暴伤' ],
    }
  }
  getDesc(target, self) {
    const { criDamage } = this.getData(self);
    if(!criDamage) return '队伍中没有同命途角色，无效果';
    return `暴伤提高${D.toPercent(this.data.criDamage)}`;
  }
  getAttributes(target) {
    return this.getData(target);
  }
  isActivated(target) {
    const { criDamage } = this.getData(target);
    return criDamage > 0;
  }
  getData(target) {
    const activated = target.team.members.findIndex(m => m && m!==target && m.base.job === target.base.job ) >= 0;
    return { criDamage: activated? this.data.criDamage: 0 };
  }
  checkSameBuff( buff ){
    return this.constructor===buff.constructor && this.target===buff.target;
  }
}

class SrHuntFHDZ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击力提升${this.data.atkRate}%。进入战斗时，若有两名以上我方角色拥有任意相同命途，这些角色的暴伤提高${this.data.criDamage}%。同类技能无法重复生效。`}
  getExtendAttributes() {
    return { atkRate: this.data.atkRate }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriDamage, [], '', this.data),
    ];
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntFHDZ,
}