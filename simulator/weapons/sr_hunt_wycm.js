'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffCriRate } = require('../buff_simple');

const baseData = {
  name: '唯有沉默',
  short: '记录',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['atkRate', 'criRate'], [16, 12], [20, 15], [24, 18], [28, 21], [32, 24]]),
};

class SrHuntWYCM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `攻击提高${this.data.atkRate}%。场上敌方目标数量小于等于2时，暴击提高${this.data.criRate}%。`}
  getExtendAttributes() {
    return { atkRate: this.data.atkRate}
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffCriRate, [], '', {
        criRate: this.data.criRate,
        name: baseData.short, source: '光锥', desc:'场上目标小于等于2时', maxValue: 1,
      }),
    ];
  }
  addListens() {
    const enemies = this.character.team.enemies;
    enemies.forEach(enemy => enemy && enemy.listenEvent(['B_KILL','REBORN'], this));
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if( (unit.faction==='enemies' && (e==='B_KILL' || e=='REBORN')) || (unit===c && e==='BTL_S')) {
      if(c.team.getAliveUnits('enemies').length <=2 ) {
        c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), c, 1);
      } else {
        c.removeBuff(c.findBuff({key: Buff.getKey(c.name,'光锥', baseData.short)}), true);
      }
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntWYCM,
}