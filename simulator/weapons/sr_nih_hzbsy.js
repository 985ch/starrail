'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const C = require('../compute');
const D = require('../data');
const { DebuffDefRate } = require('../debuff_simple');

const baseData = {
  name: '决心如汗珠般闪耀',
  short: '回眸',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['hit', 'defDown'], [60, 12], [70, 13], [80, 14], [90, 15], [100, 16]]),
};

class SrNihHZBSY extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `击中目标时，若该目标不处于【攻陷】状态，则有${this.data.hit}%的基础概率时期陷入【攻陷】状态。【攻陷】状态下敌方目标防御降低${this.data.defDown}%，持续1回合。` }
  getBuffList(){
    return [
      Buff.getListJson(this.character, DebuffDefRate, [Buff.simpleListener()], '', {
        defDown: this.data.defDown,
        name: '攻陷', source: '光锥', maxValue: 1,
        tags:  ['debuff', '减防', '攻陷'],
      }),
    ];
  }
  getReportData() {
    const enemy = this.character.getEnemy();
    return [{ type:'hit', name: '攻陷[命中]', labels:['每次击中'], hit0: C.calHitRate(this.data.hit * 0.01, this.character, enemy)}];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    const t = data.target;
    if( e === 'C_HIT_S' && unit === c && t.faction === 'enemies' && !t.findBuff({tag: '攻陷'})) {
      c.addBuffRandom(Buff.getKey(c.name,'光锥', '攻陷'), t, 1, {}, this.data.hit * 0.01);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihHZBSY,
}