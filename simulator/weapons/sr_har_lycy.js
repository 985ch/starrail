'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '镂月裁云之意',
  short: '秘密',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate', 'criDamage', 'enRate'], [10, 12, 6.0], [12, 15, 7.5], [15, 18, 9.0], [17.5, 21, 10.5], [20, 24, 12.0] ]),
};

class BuffWeapon extends Buff {
  static info(data) {
    return {
      name: baseData.short + data.name,
      short: data.short,
      source: '光锥',
      desc: data.desc,
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '镂月裁云', ...data.tags],
    };
  }
  getDesc() {
    return `${this.data.desc}${this.data.weaponData[this.data.key]}%`
  }
  getAttributes() {
    if(!this.member.checkAlive()) return {};
    return {
      [this.data.key]: this.data.weaponData[this.data.key],
    }
  }
  checkSameBuff( buff ){
    return this.constructor === buff.constructor;
  }
}

class SRHarLYCY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `战斗开始及装备者回合开始时，随机生成一个效果。效果不和上次重复且同类效果无法叠加。效果包括：攻击提高${this.data.atkRate}%；暴伤提高${this.data.criDamage}%；能量恢复效率提高${this.data.enRate}%。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffWeapon, [], '', {
        name:'[攻]', short:'加攻', desc:'全队攻击提升', tags: ['加攻'],
        key: 'atkRate', weaponData: this.data
      }),
      Buff.getListJson(this.character, BuffWeapon, [], '', {
        name:'[暴]', short:'暴伤', desc:'全队暴击伤害提升', tags: ['暴伤'],
        key: 'criDamage', weaponData: this.data
      }),
      Buff.getListJson(this.character, BuffWeapon, [], '', {
        name:'[充]', short:'充能', desc:'全队能量恢复效率提升', tags: ['充能'],
        key: 'enRate', weaponData: this.data
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if((e==='BTL_S' || e==='TURN_S') && unit===c){
      const lastBuff = c.findBuff({tag:'镂月裁云'});
      let keys = ['[攻]','[暴]','[充]'];
      if(lastBuff) {
        keys = keys.filter(key => key !== lastBuff.data.name);
      }
      const key = keys[Math.floor(keys.length*Math.random())];
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + key), 'members', 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SRHarLYCY,
};
