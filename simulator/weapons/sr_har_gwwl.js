'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDamage } = require('../buff_simple')

const baseData = {
  name: '过往未来',
  short: '旧日纸鸢',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['bonusAll'],[16],[20],[24],[28],[32]]),
};

class SrHarGWWL extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放战技后下一个行动的我方其他目标造成的伤害提高${this.data.bonusAll}%，持续1回合。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener(false)], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source: '光锥', desc: '下一个我方行动成员',
        target: 'member', maxValue: 1,
      }),
    ];
  }
  addListens() {
    const members = this.character.team.members;
    members.forEach(member => member && member.listenEvent('ACT_S', this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    const ws = c.state.weapon;
    if(e==='ACT_E' && D.checkType(data.type,'NS') && unit===c) {
      ws.activated = true;
    }else if(e ==='ACT_S' && ws.activated && unit!==c && unit.faction==='members') {
      ws.activated = false;
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), unit, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHarGWWL,
}