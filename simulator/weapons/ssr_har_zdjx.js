'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffDamage } = require('../buff_simple')

const baseData = {
  name: '但战斗还未结束',
  short: '继承人',
  rarity: 'SSR',
  job: '同谐',
  hp: D.levelData['52_1164'],
  atk: D.levelData['24_529'],
  def: D.levelData['21_463'],
  data: D.makeTable([['enRate','bonusAll'],[10,30],[12,35],[14,40],[16,45],[18,50]]),
};

class SsrHarZDJX extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `装备者能量恢复提高${this.data.enRate}%，并在对我方施放终结技后恢复一个战技点。该效果每施放2次终结技可触发一次。装备者施放战技后，下一个行动的我方其他目标造成的伤害提高${this.data.bonusAll}%，持续1回合。`
  }
  getExtendAttributes() {
    return { enRate: this.data.enRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffDamage, [Buff.simpleListener(false)], '', {
        bonusAll: this.data.bonusAll,
        name: baseData.short, source:'光锥', desc: '下一个我方行动成员',
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
    if(e==='ACT_E' && unit===c) {
      if(D.checkType(data.type,'NS')) {
        ws.activated = true;
      } else if(D.checkType(data.type,'US') && (data.target==='members' || data.target.faction==='members')) {
        if(!ws.coolDown) {
          c.changeSp(1);
          ws.coolDown = 1;
        } else {
          ws.coolDown--;
        }
      }
    }else if(e ==='ACT_S' && D.checkType(data.type,['NA','NS','US']) && ws.activated && unit!==c && unit.faction==='members') {
      ws.activated = false;
      c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), unit, 1);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHarZDJX,
}