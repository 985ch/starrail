'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');

const baseData = {
  name: '重返幽冥',
  short: '汹涌',
  rarity: 'SR',
  job: '巡猎',
  hp: D.levelData['38_846'],
  atk: D.levelData['24_529'],
  def: D.levelData['15_330'],
  data: D.makeTable([['criRate', 'hit'], [12, 16], [15, 20], [18, 24], [21, 28], [24, 32]]),
};

class SrHuntCFYM extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `暴击提高${this.data.criRate}%。暴击后有${this.data.hit}%的固定概率解除敌方1个增益，该效果每次攻击只能触发一次。` }
  getExtendAttributes() {
    return { criRate: this.data.criRate }
  }
  getReportData() {
    return [{ type:'hit', name: '解除增益[命中]', labels:['每次暴击'], hit0: this.data.hit}];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(unit!==c) return;
    const ws = c.state.weapon;
    if(e==='C_ATK_S') {
      ws.ready = true;
    } else if(e==='C_HIT_E' && ws.ready && data.isCri) {
      ws.ready = false;
      if(Math.random() >= this.data.hit * 0.01) return;
      const t = data.target;
      if(t.faction!=='enemies') return;
      const buff = t.findBuff({tag:'removable'} ,t.filterBuffs({tag:['buff']}));
      if(!buff) return;
      t.removeBuff(buff, true);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrHuntCFYM,
}