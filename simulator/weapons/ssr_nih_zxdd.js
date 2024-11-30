'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffSpeedRate } = require('../buff_simple');
const { DebuffDot } = require('../debuff_simple');

const baseData = {
  name: '只需等待',
  short: '蛛网',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['26_582'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['bonusAll', 'speedRate', 'rate'],
    [24, 4.8, 60],
    [28, 5.6, 70],
    [32, 6.4, 80],
    [36, 7.2, 90],
    [40, 8.0, 100],
  ]),
};

class SsrNihZXDD extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `伤害提高${this.data.bonusAll}%。每次施放攻击后速度提高${this.data.speedRate}%，最多叠加3层。击中敌方目标时，若目标未处于【游丝】状态，有100%基础概率使其陷入【游丝】状态，【游丝】状态被视作触电，在目标回合开始时使其受到等同于装备者${this.data.rate}%攻击力的雷属性持续伤害，持续1回合。`
  }
  getExtendAttributes() {
    return { bonusAll: this.data.bonusAll };
  }
  getDotData() {
    return {
      rate: this.data.rate,
      count: 1,
      turn: 1,
      baseHit: 100,
      baseAttr: 'atk',
      type: 'Thunder',
      isDot: true,
      name: '游丝[触电]', source:'光锥',
      title: '游丝[触电]',
      tags: ['debuff', 'dot', '触电', '游丝'],
    }
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, DebuffDot, [Buff.dotListener()], 'dot', this.getDotData()),
      Buff.getListJson(this.character, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: this.data.speedRate,
        name: baseData.short + '[加速]', source: '光锥', desc: '施放攻击后',
        maxValue: 3, minValue: 1,
      })
    ];
  }
  getReportData(target) {
    return this.getAdditionDamageReport(target, this.getDotData());
  }
  onEvent(e, unit, data) {
    const c = this.character;
    const t = data.target;
    if(e === 'C_HIT_S' && D.checkType(data.type, ['NA','NS','US','AA']) && unit === c && t.faction === 'enemies' && !t.findBuff({ tag: '游丝'})) {
      c.addBuffRandom(Buff.getKey(c.name,'光锥', '游丝[触电]', 'dot'), t, 1, {}, 1, 1, false, true);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrNihZXDD,
}