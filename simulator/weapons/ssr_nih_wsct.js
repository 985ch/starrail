'use strict';

const { C, D, Buff, BaseWeapon} = require('../index');
const { DebuffWeakAll } = require('../debuff_simple');

const baseData = {
  name: '那无数个春天',
  short: '世事无痕',
  rarity: 'SSR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['26_582'],
  def: D.levelData['24_529'],
  data: D.makeTable([
    ['hit', 'weakAll', 'weakAllP'],
    [ 60, 10, 14 ],
    [ 70, 12, 16 ],
    [ 80, 14, 18 ],
    [ 90, 16, 20 ],
    [ 100, 18, 22 ],
  ]),
};
class BuffQK extends Buff {
  static info() {
    return {
      name: '穷寇',
      short: '易伤',
      source: '光锥',
      desc: '受到的伤害提高',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '易伤'],
    }
  }
  getDesc() {
    return `易伤提高${D.toPercent(this.data.weakAll)}。`
  }
  getAttributes() { return { weakAll: this.data.weakAll} }
  init() {
    const buff = this.target.findBuff({ key: Buff.getKey(this.member.name, '光锥', '卸甲')});
    if(buff) this.target.removeBuff(buff);
  }
}
class SrNihWSCT extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `效果命中提高${this.data.hit}%。用普攻、战技、终结技攻击敌方目标后，有60%基础概率使其陷入【卸甲】状态，使其易伤提高${this.data.weakAll}%，持续2回合。若目标处于装备者施加的持续伤害状态下，则有60%基础概率将装备者施加的【卸甲】升级为【穷寇】状态，使其易伤额外提高${this.data.weakAllP}%，持续2回合，期间装备者无法对其施加【卸甲】。`
  }
  getExtendAttributes() {
    return { hit: this.data.hit };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, DebuffWeakAll, [Buff.simpleListener()], '', {
        weakAll: this.data.weakAll, name: '卸甲', source: '光锥', maxValue: 1,
      }),
      Buff.getListJson(this.character, BuffQK, [Buff.simpleListener()], '', { weakAll: this.data.weakAll + this.data.weakAllP })
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e !== 'C_ATK_E' || unit!==c || D.checkType(data.type, ['NA','NS','US'])) return;
    data.targets.forEach(tar=>{
      if(!tar) return;
      const buffQK = tar.findBuff({ key: Buff.getKey(c.name, '光锥', '穷寇')});
      if(buffQK) return;     
      const hit = C.calHitRate(0.6, c, tar);
      if(Math.random()*100 > hit) return;
      c.addBuff(Buff.getKey(c.name, '光锥', Math.random()*100 < hit? '穷寇': '卸甲'), tar, 1, { count: 2 });
    })
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihWSCT,
}