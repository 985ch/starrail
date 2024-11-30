'use strict';

const { D, Buff,BaseWeapon } = require('../index');
const { BuffEnRate } = require('../buff_simple')

const baseData = {
  name: '夜色流光溢彩',
  short: '抚慰',
  rarity: 'SSR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['28_635'],
  def: D.levelData['21_463'],
  data: D.makeTable([['enRate','atkRate','bonusAll'],[3, 48, 24],[3.5, 60, 28],[4, 72, 32],[4.5, 84, 36],[5, 96, 40]]),
};

class BuffHC extends Buff {
  static info() {
    return {
      name: '华彩',
      short: '增伤',
      source: '光锥',
      desc: '装备者攻击提升，我方全体伤害增加',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '加攻', '增伤', 'bonusAll'],
    };
  }
  getDesc() {
    return `装备者攻击力提高${this.data.atkRate}%，我方全体伤害提高${this.data.bonusAll}%`
  }
  getAttributes(target) {
    return {
      atkRate: target===this.member? this.data.atkRate: 0,
      bonusAll: this.data.bonusAll
    };
  }
}

class BuffListener extends Buff {
  static info() {
    return {
      name: '歌咏(监听)',
      short: '监听',
      source: '光锥',
      desc: '监听歌咏的叠加事件',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.listen({e:'C_ATK_S', t:'members', f:(buff, unit, data)=>{
      this.member.addBuff(Buff.getKey(this.member.name, '光锥', '歌咏'), this.member, 1, {})
    }});
  }
}

class SsrHarLGYC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `我方角色攻击时装备者获得1层【歌咏】，使能量恢复效率提高${this.data.enRate}%，可叠5层。施放终结技时移除【歌咏】，获得【华彩】，使攻击力提高${this.data.atkRate}%，我方全体伤害提高${this.data.bonusAll}%，持续1回合。`
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffEnRate, [], '', {
        enRate: this.data.enRate,
        name: '歌咏', source: '光锥', maxValue: 5,
      }),
      Buff.getListJson(this.character, BuffHC, [Buff.simpleListener(true,'self')], '', this.data),
      Buff.getListJson(this.character, BuffListener),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c) return;
    if(e==='ACT_E' && D.checkType(data.type,'US')) {
      const buffGY = c.findBuff({key: Buff.getKey(c.name, '光锥', '歌咏')});
      if(buffGY)c.removeBuff(buffGY);
      c.addBuff(Buff.getKey(c.name, '光锥', '华彩'), c, 1, {count:1});
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHarLGYC,
}