'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const C = require('../compute');
const D = require('../data');
const { DebuffWeakAll } = require('../debuff_simple');

const baseData = {
  name: '雨一直下',
  short: '幻影现实',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['hit', 'criRate', 'weakAll'],
    [24, 12, 12],
    [28, 14, 14],
    [32, 16, 16],
    [36, 18, 18],
    [40, 20, 20],
  ]),
};

class BuffCriRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '暴击',
      source: '光锥',
      desc: '暴击率提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    if(target.countBuffs({ tag:'debuff' }) < 3) return {};
    return { criRate: this.data.criRate }
  }
}

class SsrNihYYZX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `效果命中提高${this.data.hit}%。对负面效果大于等于3个的敌方目标造成伤害时，暴击率提高${this.data.criRate}%。施放普攻，战技，终结技后，有100%基础概率对随机一个未持有【以太编码】的受击目标施加【以太编码】，使其受到伤害提高${this.data.weakAll}%，持续1回合。`
  }
  getExtendAttributes() {
    return { hit: this.data.hit };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [], 'criRate', this.data),
      Buff.getListJson(this.character, DebuffWeakAll, [Buff.simpleListener()], 'weakAll', {
        weakAll: this.data.weakAll,
        name: '以太编码[易伤]', source: '光锥',
        maxValue: 1, tags:['debuff', '易伤', '以太编码']
      })
    ];
  }
  getReportData(){
    const enemy = this.character.getEnemy();
    return [{ type:'hit', name: '以太编码[命中]', labels:['易伤概率'], tip: '对随机目标', hit0: C.calHitRate(1, this.character, enemy)}];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e === 'C_DMG_E' && unit===c && D.checkType(data.type, ['NA','NS','US'])) {
      const targets = D.filterItems(data.targets).filter( t => t && t.checkAlive() && !t.findBuff({ tag: '以太编码'}));
      if(targets.length <= 0) return;
      c.addBuffRandom(Buff.getKey(c.name,'光锥', '以太编码[易伤]', 'weakAll'), D.sample(targets), 1, {}, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrNihYYZX,
}