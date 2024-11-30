'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const C = require('../compute');
const { BuffCriDamage } = require('../buff_simple');
const { DebuffWeakAll } = require('../debuff_simple');

const baseData = {
  name: '命运从未公平',
  short: '全下',
  rarity: 'SSR',
  job: '存护',
  hp: D.levelData['48_1058'],
  atk: D.levelData['19_423'],
  def: D.levelData['30_661'],
  data: D.makeTable([
    ['defRate', 'criDamage', 'chance', 'weakAll'],
    [40, 40, 100, 10],
    [46, 46, 115, 11.5],
    [52, 52, 130, 13],
    [58, 58, 145, 14.5],
    [64, 64, 160, 16],
  ]),
};

class SsrPreMYBGP extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `防御提高${this.data.defRate}%。装备者为我方提供护盾时暴伤提高${this.data.criDamage}%，持续2回合。装备者发动追加攻击击中敌人时，有${this.data.chance}%基础概率使目标受到的伤害提高${this.data.weakAll}%，持续2回合。`
  }
  getExtendAttributes() {
    return { defRate: this.data.defRate };
  }
  getBuffList(){
    const c = this.character;
    return [
      Buff.getListJson(c, BuffCriDamage, [Buff.simpleListener()],'',{
        criDamage: this.data.criDamage, name:'暴伤', source:'光锥', maxValue: 1,
      }),
      Buff.getListJson(c, DebuffWeakAll, [Buff.simpleListener()], '', {
        weakAll: this.data.weakAll, name: '易伤', source:'光锥', target:'enemy', maxValue: 1
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(unit !== c) return;
    if(e==='C_BUFF_E') {
      const ws = c.state.weapon;
      if(!ws.locked && data.target.faction === 'members' && data.buff.checkTag('shield') >= 0) {
        ws.locked = true;
        c.addBuff(Buff.getKey(c.name, '光锥', '暴伤'), c, 1, {count: 2});
        ws.locked = false;
      }
    } else if(e==='C_HIT_S' && D.checkType(data.type, ['AA'])) {
      c.addBuffRandom(Buff.getKey(c.name,'光锥','易伤'), data.target, 1, {count: 2}, this.data.chance*0.01, 1, false, false);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrPreMYBGP,
}