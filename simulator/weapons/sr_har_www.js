'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const C = require('../compute');

const baseData = {
  name: '舞！舞！舞！',
  short: '停不下来',
  rarity: 'SR',
  job: '同谐',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['actionRate'], [16], [18], [20], [22], [24]]),
};

// 行动提前
class BuffActionRate extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '拉条',
      source: '光锥',
      desc: '施放终结技后全队行动提前',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    const speed = target.getAttr('speed');
    return [{ type:'action', name: this.member.name +'终结技后', wait: C.calActionTime(speed, this.data.actionRate) }];
  }
}

class SrHarWWW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `施放终结技后我方全体行动提前${this.data.actionRate}%。` }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffActionRate, [], '', this.data) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(e!=='ACT_E' || !D.checkType(data.type,'US') || c!== unit) return;
    c.team.getAliveUnits('members').forEach( m=> m.changeWaitTime(-this.data.actionRate));
  }
}

module.exports = {
  data: baseData,
  weapon: SrHarWWW,
};
