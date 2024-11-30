'use strict';

const BaseWeapon = require('../weapon');
const {C,D} = require('../index');

const baseData = {
  name: '记忆中的模样',
  short: '老相片',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['breakRate', 'en'],[28,4], [35,5], [42,6], [49,7], [56,8]]),
};

class SrHarJYZDMY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击破特攻提高${this.data.breakRate}%，施放攻击后额外恢复${this.data.en}点能量，该效果单个回合内不可重复触发。` }
  getExtendAttributes() {
    return { breakRate: this.data.breakRate };
  }
  getReportData() {
    const en0 = C.calEnergy(this.data.en, this.character);
    return [{ type:'energy', name:'老相片[回能]', tip:'施放攻击后', labels:['额外回能'], en0}];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='C_ATK_E' && unit===c && this.updateCD(1, true)){
      c.addEn(this.data.en);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHarJYZDMY,
};