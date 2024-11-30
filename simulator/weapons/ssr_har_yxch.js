'use strict';

const { D, Buff,BaseWeapon } = require('../index');

const baseData = {
  name: '游戏尘寰',
  short: '善变',
  rarity: 'SSR',
  job: '同谐',
  hp: D.levelData['52_1164'],
  atk: D.levelData['24_529'],
  def: D.levelData['21_463'],
  data: D.makeTable([['criDamage','criRate','criDmgAll'],[32,10,28],[39,11,35],[46,12,42],[53,13,49],[60,14,56]]),
};

class BuffCrit extends Buff {
  static info() {
    return {
      name: '假面',
      short: '双暴',
      source: '光锥',
      desc: '装备者队友双暴提升',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '暴击', '暴伤'],
    };
  }
  getDesc() {
    return `除${this.member.name}外的我方成员暴击提高${this.data.criRate}%，暴伤提高${this.data.criDmgAll}%`
  }
  getAttributes(target) {
    return (target === this.member) ? {} : { criRate: this.data.criRate, criDamage: this.data.criDmgAll };
  }
}

class SsrHarYXCH extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() {
    return `暴伤提高${this.data.criDamage}%。战斗开始时，装备者获得[假面]。[假面]使装备者队友暴击提高${this.data.criRate}%，暴伤提高${this.data.criDmgAll}%，持续3回合。装备者每恢复4个战技点可以重新获得[假面]，恢复时溢出的战技点也算在内。`
  }
  getExtendAttributes() {
    return { criDamage: this.data.criDamage };
  }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffCrit, [Buff.simpleListener(true, 'self')], '', this.data) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c) return;
    if(e==='BTL_S') {
      c.addBuff(Buff.getKey(c.name, '光锥', '假面'), c, 1, { count:3 });
    } else if(e==='SP_CHANGE' && data.sp > 0.005) {
      const ws = c.state.weapon;
      ws.spCount = (ws.spCount || 0) + data.sp;
      if(ws.spCount >= 4) {
        ws.spCount = 0;
        c.addBuff(Buff.getKey(c.name, '光锥', '假面'), c, 1, { count:3 });
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrHarYXCH,
}