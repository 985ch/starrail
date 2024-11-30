// 星体差分机
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffCriDamage extends Buff {
  static info() {
    return {
      name: '蕉乐园',
      short: '暴伤',
      source: '遗器',
      desc: '存在装备者的召唤物时，暴伤提高32%',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', 'removable', '暴击'],
    };
  }
  getDesc() {
    return this.getData()?'暴伤提高32%':'暂无召唤物'
  }
  getAttributes() {
    return this.getData()?{ criDamage: 32 }:{};
  }
  init() {
    this.listen({e:'SUMMON_A', t:'self', f:()=>{
      this.markTargets(true);
    }});
    this.listen({e:'SUMMON_D', t:'self', f:()=>{
      this.markTargets(true);
    }});
  }
  getData() {
    const m = this.member;
    const list = m.getSummonList();
    for(let i=0; i<list.length; i++) {
      if(list[i].checkAlive()) return true;
    }
    return false;
  }
}

class Cridmg2JLY extends EquipSet {
  static getDesc() {
    return {
      name: '奇想蕉乐园',
      short: '蕉乐园',
      set2: '暴伤提升16%。当存在装备者召唤的目标时，暴伤额外提高32%',
      image: 'cridmg2_jly',
    }
  }
  getAttributes() {
    return (this.count >= 2)? { criDamage: 16 }: {};
  }
  getBuffList() {
    if(this.count<2)return [];
    return [ Buff.getListJson(this.character, BuffCriDamage) ];
  }
}

module.exports = Cridmg2JLY;