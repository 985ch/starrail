'use strict';

const { A, D, BaseWeapon, Buff} = require('../index');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '好戏开演',
  short: '自娱自乐',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['48_1058'],
  atk: D.levelData['21_476'],
  def: D.levelData['12_264'],
  data: D.makeTable([['bonusAll','atkRate'],[6,20],[7,24],[8,28],[9,32],[10,36]]),
};

class BuffAtkRate extends Buff {
  static info() {
    return {
      name: '自娱自乐',
      short: '加攻',
      source: '光锥',
      desc: '命中大于80%则攻击力提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  getDesc() { return `攻击力提高${this.getData()}%。` }
  getTransAttr() {
    return {
      atkRate: { raw:'hit', min:80, add: this.data.atkRate }
    };
  }
  getData() { return (this.member.attr.data.hit >= 80)? this.data.atkRate : 0 }
}
class SrNihHXKY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `对敌人添加负面状态后获得一层[戏法]，每层使伤害提高${this.data.bonusAll}%，最多叠加3层，持续1回合。效果命中大于80%时，攻击提高${this.data.atkRate}%。`}
  getBuffList(){
    const c = this.character;
    return [
      Buff.getListJson(c, BuffAtkRate, [], '', this.data ),
      Buff.getListJson(c, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.data.bonusAll, maxValue: 3, source: '光锥', name:'戏法'
      } ),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit !== c || e!== 'C_BUFF_E' || !data.buff ) return;
    const ws = c.state.weapon;
    if(data.buff.checkTag('debuff') && !ws.locked) {
      ws.locked = true;
      c.addBuff(Buff.getKey(c.name, '光锥', '戏法'), c, 1);
      ws.locked = false;
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihHXKY,
}