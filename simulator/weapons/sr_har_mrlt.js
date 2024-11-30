'use strict';

const { D, BaseWeapon, Buff } = require('../index');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '为了明日的旅途',
  short: '联结',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate','bonusAll'], [16, 18], [20, 21], [24, 24], [28, 27], [32, 30]]),
};

class SrHarMRLT extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `装备者攻击力提高${this.data.atkRate}%。施放终结技后，伤害提高${this.data.bonusAll}%，持续1回合。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source: '光锥', maxValue: 1,
      }),
    ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(e!=='ACT_E' || c!== unit || !D.checkType(data.type, ['US'])) return;
    c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1);
  }
}

module.exports = {
  data: baseData,
  weapon: SrHarMRLT,
};
