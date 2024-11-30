'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDefRate } = require('../buff_simple')

const baseData = {
  name: '制胜的瞬间',
  short: '决断',
  rarity: 'SSR',
  job: '存护',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['27_595'],
  data: D.makeTable([
    ['defRate', 'hit', 'defPlus'],
    [24, 24, 24],
    [30, 28, 30],
    [36, 32, 36],
    [42, 36, 42],
    [48, 40, 48],
  ]),
};

class SsrPreZSDSJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `防御提高${this.data.defRate}%，效果命中提高${this.data.hit}，同时使自身受到攻击的概率提高。装备者受到攻击后，防御力额外提高${this.data.defPlus}%，持续到自身回合结束。`
  }
  getExtendAttributes() {
    return {
      defRate: this.data.defRate,
      hit: this.data.hit,
      hateRate: 100, 
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDefRate, [Buff.simpleListener(false)], '', {
        defRate: this.data.defPlus,
        name: baseData.short, source:'光锥',
        maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e === 'B_ATK_E' && unit===c) {
      c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrPreZSDSJ,
}