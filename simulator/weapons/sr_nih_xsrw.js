'use strict';

const BaseWeapon = require('../weapon');
const D = require('../data');

const baseData = {
  name: '新手任务开始前',
  short: '眼疾手快',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['hit', 'en'],[20, 4], [25, 5], [30, 6], [35, 7], [40, 8]]),
};

class SrNihXSRW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `效果命中提高${this.data.hit}%。攻击防御力被降低的目标后恢复${this.data.en}点能量。` }
  getExtendAttributes() {
    return { hit: this.data.hit };
  }
  getReportData() {
    const char = this.character;
    const en = this.data.en * char.attr.data.enRate * 0.01;
    return[{
      type:'energy', name: '眼疾手快[回能]', labels:[ '额外回能'], tip: '攻击防御力被降低的目标时',
      en0: en,
    }];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if( e !== 'C_ATK_E' || unit !== c) return;
    let canAdd = false;
    for(let i = 0; i < data.targets; i++) {
      const buff = data.targets[i].findBuff({tag:'减防'});
      if(buff) {
        canAdd = true;
        break;
      }
    }
    if(canAdd) {
      c.addEn(this.data.en);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihXSRW,
}