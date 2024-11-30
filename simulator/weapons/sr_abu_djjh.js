'use strict';

const BaseWeapon = require('../weapon');
const { C, D, Buff } = require('../index');

const baseData = {
  name: '等价交换',
  short: '酣适',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['en'],[8],[10],[12],[14],[16]]),
};

// 回能
class BuffEn extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '回能',
      source: '光锥',
      desc: '回能',
      show:  false ,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    if(target === this.member) return [];
    const en = C.calEnergy(this.data.en, target); // 不确定这个是吃谁的能量回复效率
    return[{
      type:'energy', name: '酣适[回能]', labels:[ '概率回能'], tip: this.member.name + '每回合给低能量随机队友充能',
      en0: en,
    }];
  }
}

class SrAbuNYBMC extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `装备者回合开始时，随机为1个当前能量百分比小于50%的我方其他目标恢复${this.data.en}点能量。`; }
  getBuffList(){
    return [ Buff.getListJson(this.character, BuffEn, [], '', this.data) ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e!=='TURN_S' || unit!==c ) return;
    const members = c.team.members.filter(m => {
      return m && m!==c && m.checkAlive() && (m.state.en < m.base.enMax * 0.5);
    });
    if(members.length <= 0)return;
    D.sample(members).addEn(this.data.en);
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuNYBMC,
}