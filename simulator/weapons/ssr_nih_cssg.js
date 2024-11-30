'use strict';

const { D, Buff, BaseWeapon} = require('../index');

const baseData = {
  name: '重塑时光之忆',
  short: '结晶',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['hit', 'atkRate', 'arpDOT'],
    [ 40, 5, 7.2 ],
    [ 45, 6, 7.9 ],
    [ 50, 7, 8.6 ],
    [ 55, 8, 9.3 ],
    [ 60, 9, 10 ],
  ]),
};
const tags = ['风化','灼烧','触电','裂伤'];
class BuffXZ extends Buff {
  static info() {
    return {
      name: '先知',
      short: '先知',
      source: '光锥',
      desc: '攻击提高，持续伤害破防',
      show: true,
      maxValue: 4,
      target: 'self',
      tags: ['buff', '加攻', '防御穿透'],
    }
  }
  getDesc() {
    const data = this.getData();
    return `攻击力提高${data.atkRate}%，持续伤害无视目标${data.arpDOT}%的防御。`
  }
  getAttributes() { return this.getData() }
  getData() {
    return {
      atkRate: this.value * this.data.atkRate,
      arpDOT: this.value * this.data.arpDOT,
    }
  }
}
class SrNihCSSG extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `效果命中提高${this.data.hit}%。对陷入风化、灼烧、触电、裂伤的敌人造成伤害时分别获得一层[先知]，每种类型最多叠加1层，共4层。每层[先知]提高攻击${this.data.atkRate}%，并使装备者的持续伤害无视目标${this.data.arpDOT}%的防御。`
  }
  getExtendAttributes() {
    return { hit: this.data.hit };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffXZ, [], '', this.data),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e !== 'C_HIT_S' || unit!==c) return;
    const t = data.target;
    const ws = c.state.weapon;
    tags.forEach(tag=>{
      if(ws[tag] || !t.findBuff({tag}))return;
      c.addBuff(Buff.getKey(c.name, '光锥', '先知'), c, 1);
      ws[tag] = 1;
    })
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihCSSG,
}