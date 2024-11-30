'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffEn } = require('../buff_simple');

const baseData = {
  name: '同一种心情',
  short: '救治与维修',
  rarity: 'SR',
  job: '丰饶',
  hp: D.levelData['43_952'],
  atk: D.levelData['19_423'],
  def: D.levelData['18_396'],
  data: D.makeTable([['healRate','en'],[10.0, 2.0],[12.5, 2.5],[15.0, 3.0],[17.5, 3.5],[20.0, 4.0]]),
};

class SrAbuTYZXQ extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `治疗量提高${this.data.healRate}%，施放战技时为我方全体恢复${this.data.en}点能量。`; }
  getExtendAttributes() {
    return { healRate: this.data.healRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffEn, [], '', {
        en: this.data.en,
        name: baseData.short, source:'光锥',
        title: '救治与维修[回能]', label: '单次回能', tip: this.character.name + '施放战技时',
        target: 'members', hide: true,
      }),
    ];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(e==='ACT_S' && unit===c && D.checkType(data.type,'NS')){
      c.team.getAliveUnits('members').forEach(member => member.addEn(this.data.en));
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SrAbuTYZXQ,
}