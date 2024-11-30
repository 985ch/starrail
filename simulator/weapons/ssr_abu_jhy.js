'use strict';

const BaseWeapon = require('../weapon');
const { C, D, Buff} = require('../index');
const { BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '惊魂夜',
  short: '深度深呼吸',
  rarity: 'SSR',
  job: '丰饶',
  hp: D.levelData['52_1164'],
  atk: D.levelData['21_476'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['enRate','healR','atkRate'],
    [12,10,2.4],
    [14,11,2.8],
    [16,12,3.2],
    [18,13,3.6],
    [20,14,4.0],
  ]),
};

class BuffHealReport extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '附加治疗',
      source: '光锥',
      desc: '附加治疗',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    return [{
      type:'heal', name:'深度深呼吸[回复]', labels:['治疗量'], tip: `来自${this.member.name}的光锥【惊魂夜】`,
      heal0: C.calHealData(target.getAttr('hp') * this.data.healR * 0.01, this.member, target),
    }];
  }
}

class SsrAbuJHY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `能量恢复效率提高${this.data.enRate}%。我方目标施放终结技时，装备者为生命值百分比最低的我方目标回复等同于其${this.data.healR}%生命上限的生命值。装备者对我方目标提供治疗时，该目标的攻击力提升${this.data.atkRate}%，该效果可叠加5层，持续2回合。`;
  }
  getExtendAttributes() {
    return {enRate: this.data.enRate};
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffHealReport, [], '', this.data),
      Buff.getListJson(this.character, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: this.data.atkRate, name:'攻击力提升', source:'光锥', target:'member', maxValue: 5,
      }),
    ];
  }
  addListens() {
    const members = this.character.team.members;
    members.forEach(member => member && member.listenEvent('ACT_S', this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit===c && e==='C_HEAL_S') {
      c.addBuff(Buff.getKey(c.name, '光锥', '攻击力提升'), data.targets[data.idx], 1, {count:2});
    } else if(e==='ACT_S' && D.checkType(data.type, 'US')) {
      const target = c.team.findUnitByFunc('members', (m, t) => m.state.hp/m.getAttr('hp') < t.state.hp/t.getAttr('hp'));
      c.triggerHeal([target], target.getAttr('hp') * this.data.healR * 0.01);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrAbuJHY,
}