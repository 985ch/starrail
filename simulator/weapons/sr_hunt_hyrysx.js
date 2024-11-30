'use strict';

const BaseWeapon = require('../weapon');
const { BuffSpeedRate } = require('../buff_simple');
const { D, Buff } = require('../index');

const baseData = {
  name: '黑夜如影随行',
  short: '隐匿',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['38_846'],
  atk: D.levelData['21_476'],
  def: D.levelData['18_396'],
  data: D.makeTable([['breakRate', 'speedRate'],[28, 8], [35, 9], [42, 10], [49, 11], [56, 12]]),
};

class SrHuntHYRYSX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%。进入战斗及造成击破伤害后，速度提高${this.data.speedRate}%，持续2回合，该效果每回合只能触发1次。`}
  getExtendAttributes() {
    return { breakRate: this.data.breakRate}
  }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffSpeedRate, [ Buff.simpleListener() ], '', {
      speedRate: this.data.speedRate,
      name: '隐匿', source:'光锥', target:'self', maxValue: 1,
    }) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if((e==='BTL_S' || e==='C_DMG_E') && unit===c){
      if(e === 'C_DMG_E' && !D.checkType(data.type, ['BRK'])) return;
      if(this.updateCD(1)) {
        c.addBuff(Buff.getKey(c.name, '光锥', baseData.short), c, 1, { count: 2});
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntHYRYSX,
}