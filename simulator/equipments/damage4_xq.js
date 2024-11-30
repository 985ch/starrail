'use strict';

const { Buff, EquipSet, D } = require('../index');

function getCriDmg(count) {
  return count < 2? 0: (count < 4? 8: 12);
}

class BuffDamage extends Buff {
  static info() {
    return {
      name: '先驱',
      short: '增伤',
      source: '遗器',
      desc: '对负面效果增伤+暴伤',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc(target, enemy) {
    if(!enemy) return super.getDesc();
    const { bonusAll, criDamage } = this.getData(enemy, true);
    return `对当前选中目标伤害增加${D.toPercent(bonusAll || 0)}，暴伤增加${D.toPercent(criDamage || 0)}。`
  }
  getAttributesT(target) {
    return this.getData(target, false);
  }
  getData(target, isDesc) {
    const count = target.countBuffs({tag:'debuff'});
    const bonusBuff = !isDesc? null: this.member.findBuff({key: Buff.getKey(this.member.name, '遗器', '先驱[翻倍]')});
    const rate = (isDesc && bonusBuff) ? 2: 1;
    if(count===0) return {};
    return {
      bonusAll: 12,
      criDamage: this.data.count < 4? 0 : getCriDmg(count) * rate,
    };
  }
}
class BuffCrit extends Buff {
  static info() {
    return {
      name: '先驱[翻倍]',
      short: '双暴',
      source: '遗器',
      desc: '遗器提供的暴击和暴伤效果翻倍',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '暴击', '暴伤'],
    };
  }
  getAttributes(){
    return {criRate:4}
  }
  getAttributesT(target) { return this.getData(target)}
  getData(target) {
    const count = target.countBuffs({tag:'debuff'});
    if(count===0) return {};
    return {
      criDamage: getCriDmg(count),
    };
  }
}

class Damage4XQ extends EquipSet {
  static getDesc() {
    return {
      name: '死水深潜的先驱',
      short: '先驱',
      set2: '对受负面状态影响的敌人造成的伤害提高12%',
      set4: '暴击提高4%，对不少于2/4个负面效果的敌方目标暴伤提高8%/12%。装备者对敌方目标施加负面效果后，遗器提供的双暴翻倍，持续1回合。',
      image: 'damage4_xq',
      buffs: [['额外双爆','先驱[翻倍]', 1]],
      evt: 'C_BUFF_E',
    }
  }
  getAttributes() {
    return this.count<4 ? {} : {criRate: 4};
  }
  getBuffList() {
    const list = [];
    if(this.count>=2) list.push(Buff.getListJson(this.character, BuffDamage, [], '', {count: this.count}));
    if(this.count===4) list.push(Buff.getListJson(this.character, BuffCrit, [Buff.simpleListener()]));
    return list;
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(this.count<4 || unit !== c || !data.buff) return;
    const ws = c.state.weapon;
    if(data.buff.checkTag('debuff') && !ws.locked) {
      ws.locked = true;
      c.addBuff(Buff.getKey(c.name, '遗器', '先驱[翻倍]'), c, 1);
      ws.locked = false;
    }
  }
}

module.exports = Damage4XQ;