'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '比阳光更明亮的',
  short: '抵死',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['28_635'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['criRate', 'atkRate', 'enRate'],
    [18, 18, 6],
    [21, 21, 7],
    [24, 24, 8],
    [27, 27, 9],
    [30, 30, 10],
  ]),
};

class BuffLY extends Buff {
  static info() {
    return {
      name: '龙吟',
      short: '龙吟',
      source: '光锥',
      desc: '攻击力和能量恢复效率提高',
      show: true,
      maxValue: 2,
      target: 'self',
      tags: ['buff', 'removable', '加攻', '充能' ],
    }
  }
  getDesc() {
    const n = this.value;
    const { atkRate, enRate } = this.data;
    return `攻击提高${(atkRate * n).toFixed(1)}%，能量恢复提高${(enRate * n).toFixed(1)}%`;
  }
  getAttributes() {
    return {
      atkRate: this.data.atkRate * this.value,
      enRate: this.data.enRate * this.value,
    }
  }
}

class SsrDesBYGML extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴击提高${this.data.criRate}%。施放普攻时，获得1层【龙吟】，持续2回合。每层【龙吟】使攻击提高${this.data.atkRate}%，能量恢复效率提高${this.data.enRate}%，【龙吟】可叠加2层。`;
  }
  getExtendAttributes() {
    return { criRate: this.data.criRate };
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffLY, [Buff.simpleListener()], '', this.data)];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt !=='C_ATK_S' || !D.checkType(data.type,'NA') || unit !== c) return;
    c.addBuff(Buff.getKey(c.name,'光锥', '龙吟'), c, 1, { count:2 });
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesBYGML,
}