'use strict';

const BaseWeapon = require('../weapon');
const { D, Buff} = require('../index');

const baseData = {
  name: '我将，巡征追猎',
  short: '震慑',
  rarity: 'SSR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['28_635'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['criRate', 'arpUS'],
    [15, 27],
    [17.5, 30],
    [20, 33],
    [22.5, 36],
    [25, 39],
  ]),
};

class BuffArpUS extends Buff {
  static info() {
    return {
      name: '震慑',
      short: '破防',
      source: '光锥',
      desc: '终结技伤害可无视目标一定比例的防御力',
      show: true,
      maxValue: 2,
      target: 'self',
      tags: ['buff', 'arpUS', '破防'],
    };
  }
  getDesc() {
    return `终结技伤害可无视目标${D.toPercent(this.data.arpUS*this.value)}防御力`;
  }
  getAttributesT() {
    return { arpUS: this.data.arpUS * this.value };
  }
}

class SsrHuntXLZZ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击提高${D.toPercent(this.data.criRate)}%。装备者施放追击时，获得1层【流光】，可叠加2层。每层【流光】使终结技伤害无视目标${this.data.arpUS}%防御力。装备者回合结束时，【流光】层数减1。`
  }
  getExtendAttributes(){
    return { criRate: this.data.criRate }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffArpUS, [
        {e:'TURN_E', t:'self', f:(buff, unit, data)=>{
          if(buff.value > 1) {
            buff.value--;
          } else {
            buff.state.count = 0;
          }
        }}
      ], '', this.data)
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_ATK_S' || unit!==c || !D.checkType(data.type,['AA'])) return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1, { count: 1 });
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHuntXLZZ,
}