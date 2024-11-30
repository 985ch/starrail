'use strict';

const BaseWeapon = require('../weapon');
const {Buff, D} = require('../index');
const { BuffAtkRate } = require('../buff_simple')

const baseData = {
  name: '早餐的仪式感',
  short: '各就其位',
  rarity: 'SR',
  job: '智识',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['bonusAll','atkRate'],[12,4],[15,5],[18,6],[21,7],[24,8]]),
};

class SrEruZC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `伤害提高${this.data.bonusAll}%。每消灭一个敌方目标攻击力提高${this.data.atkRate}%，最多叠加3次。` }
  getExtendAttributes() {
    return { bonusAll: this.data.bonusAll };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAtkRate,[], '', {
        atkRate: this.data.atkRate,
        name: baseData.short, source: '光锥', desc: '消灭敌方目标后',
        maxValue: 3,
      }),
    ];
  }
  onEvent(evt, unit, data) {
    const c = this.character;
    if(evt!== 'C_KILL' || unit!==c || data.target.faction!=='enemies') return;
    c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
  }
}

module.exports = {
  data: baseData,
  weapon: SrEruZC,
}