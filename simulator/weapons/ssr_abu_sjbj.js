'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const C = require('../compute');
const D = require('../data');
const A = require('../action');

const baseData = {
  name: '时节不居',
  short: '日有四时',
  rarity: 'SSR',
  job: '丰饶',
  hp: D.levelData['57_1270'],
  atk: D.levelData['21_476'],
  def: D.levelData['21_463'],
  data: D.makeTable([
    ['hpRate','healRate','rate'],
    [18,12,36],
    [21,14,42],
    [24,16,48],
    [27,18,54],
    [30,20,60],
  ]),
};

// 计算附加伤害
function calDamage(m, e, d) {
  const type = m.base.type;
  const { criDmg, crit, dmgRate, dmgDown, defEffect, weak, defend} = C.calDmgData([type], m, e);
  const damage = d * weak * defend * dmgRate * dmgDown * defEffect;
  return {
    damage,
    criDamage: damage * (1 + criDmg),
    expDamage: damage * (1 + crit * criDmg),
    criRate: crit,
  };
}

// 附加伤害
class BuffAdditionDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '附加伤害',
      source: '光锥',
      desc: '附加伤害',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    return [Object.assign({ type:'damage', name: '日有四时[追伤]', tip:'每1000治疗量' }, calDamage(this.member, target.getEnemy(), 10*this.data.rate))];
  }
}

class SsrAbuSJBJ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `生命上限提高${this.data.hpRate}%，治疗量提高${this.data.healRate}。装备者对我方目标提供治疗时，记录治疗量。任意我方目标施放攻击后，根据记录治疗量的${this.data.rate}%对随机一个受到攻击的敌方目标造成基于装备者属性的伤害。该伤害不受加成影响，每回合最多结算1次。`;
  }
  getExtendAttributes() {
    return {
      hpRate: this.data.hpRate,
      healRate: this.data.healRate,
    };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAdditionDamage, [], '', this.data),
    ];
  }
  addListens() {
    const members = this.character.team.members;
    members.forEach(member => member && member.listenEvent('C_DMG_E', this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    const ws = c.state.weapon;
    if(e==='CURE_E' && unit===c) {
      ws.healCount = (ws.healCount || 0) + data.heal;
    }else if(e ==='C_DMG_E' && unit.faction==='members' && ws.healCount && ws.healCount>0 && this.updateCD(1, true)) {
      const dmg = ws.healCount * this.data.rate * 0.01;
      //console.log('日有四时', dmg);
      ws.healCount = 0;
      const t = D.sample(data.targets);
      const { damage, criDamage, expDamage, criRate } = calDamage(c, t, dmg);
      const isCri = Math.random()*100 < criRate;
      const dmgData = {
        type: 'AD', attrType: c.base.type, member: c, attacker:c, target: t, 
        raw:dmg, brkDmg: 0, expDamage, isCri, damage: isCri? criDamage : damage, rate: 1,
        idx: 0, idxMax: 0,
      };
      A.triggerHit(c, data.member, t, dmgData, false);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrAbuSJBJ,
}