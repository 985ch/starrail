'use strict';

const { D, Buff, BaseWeapon } = require('../index');
const { BuffBlock, BuffHeal } = require('../buff_simple')

const baseData = {
  name: '我们是地火',
  short: '泪中人',
  rarity: 'SR',
  job: '存护',
  hp: D.levelData['33_740'],
  atk: D.levelData['21_476'],
  def: D.levelData['21_463'],
  data: D.makeTable([['dmgRate', 'heal'], [8, 30], [10, 35], [12, 40], [14, 45], [16, 50]]),
};

class SrPreWMSDH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `战斗开始时使我方全体的承伤降低${this.data.dmgRate}%，持续5回合。同时立即为我方全体回复等同于已损失生命值${this.data.heal}%的生命值。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffBlock, [Buff.simpleListener()], 'dmgRate', {
        damageRate: this.data.dmgRate,
        name: baseData.short, source:'光锥',
        target: 'member', maxValue: 1,
      }),
      Buff.getListJson(this.character, BuffHeal, [], 'report', {
        healR: this.data.heal, heal:0, baseAttr: 'hp',
        name: baseData.short, source:'光锥',
        title: '泪中人[最大回血]', tip: '进入战斗时',
        hide: true,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c=this.character;
    if(e!== 'BTL_S' || unit!==c) return;
    const members = c.team.getAliveUnits('members');
    const key = Buff.getKey(c.name,'光锥',  baseData.short, 'dmgRate');
    members.forEach(m => c.addBuff(key, m, 1, { count:5 }));
    c.triggerHeal(members, (c.getAttr('hp') - c.state.hp) * this.data.heal * 0.01);
  }
}

module.exports = {
  data: baseData,
  weapon: SrPreWMSDH,
}