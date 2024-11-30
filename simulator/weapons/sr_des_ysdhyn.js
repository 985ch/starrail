'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffAtkRate } = require('../buff_simple')

const baseData = {
  name: '鼹鼠党欢迎你',
  short: '奇妙冒险',
  rarity: 'SR',
  job: '毁灭',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['12_264'],
  data: D.makeTable([['atkRate'],[12],[15],[18],[21],[24]]),
};

class SrDesYSDHYN extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放普攻，战技和终结技攻击敌方目标后，分别获取一层【淘气值】，每层使攻击提高${this.data.atkRate}%。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffAtkRate, [], '', {
        atkRate: this.data.atkRate,
        name: baseData.short, source:'光锥', maxValue: 3,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c || e!=='C_HIT_E') return;
    if(data.idxT !== 0 || data.idxH !== data.idxMH) return;
    const ws = c.state.weapon || {};
    const type = D.checkType(data.type, ['NA','NS','US']);
    if(!type)return;
    if(!ws[type]) {
      ws[type] = true;
      //console.log('奇妙冒险')
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
      c.state.weapon = ws;
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrDesYSDHYN,
}