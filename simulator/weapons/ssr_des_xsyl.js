'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffAtkRate, BuffDamage } = require('../buff_simple')

const baseData = {
  name: '记一位星神的陨落',
  short: '扑火',
  rarity: 'SSR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['24_529'],
  def: D.levelData['18_396'],
  data: D.makeTable([['atkRate','bonusAll'],[8,12],[10,15],[12,18],[14,21],[16,24]]),
};

class SsrDesXSYL extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `施放攻击时本场战斗中攻击力提高${this.data.atkRate}%，该效果可叠加4层。击破弱点后伤害提高${this.data.bonusAll}%，该效果持续2回合。`;
  }
  getBuffList(){
    const atkData = {
      atkRate: this.data.atkRate,
      name: baseData.short + '[加攻]',
      desc: '攻击时攻击力提高，可叠加4层。', source:'光锥',
      maxValue: 4,
    }
    const dmgData = {
      bonusAll: this.data.bonusAll,
      name: baseData.short + '[增伤]',
      desc: '装备者击破弱点后', source:'光锥',
      maxValue: 1,
    }
    return [
      Buff.getListJson(this.character, BuffAtkRate, [], '', atkData),
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', dmgData),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c)return;
    if(e==='C_BREAK'){
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + '[增伤]'), c, 1, {count: 2});
    } else if(e === 'C_DMG_S') {
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short + '[加攻]'), c, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrDesXSYL,
}