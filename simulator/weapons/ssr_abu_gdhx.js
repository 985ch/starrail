'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');
const { BuffSpeed } = require('../buff_simple');
const C = require('../compute');

const baseData = {
  name: '棺的回响',
  short: '荆棘',
  rarity: 'SSR',
  job: '丰饶',
  hp: D.levelData['52_1164'],
  atk: D.levelData['26_582'],
  def: D.levelData['18_396'],
  data: D.makeTable([
    ['atkRate', 'en', 'speed'],
    [24,3.0,12],
    [28,3.5,14],
    [32,4.0,16],
    [36,4.5,18],
    [40,5.0,20],
  ]),
};

class SsrAbuGDHX extends BaseWeapon {
  getBase() { return baseData }
  getDesc() {
    return `攻击提高${this.data.atkRate}%。施放攻击时，每击中一个不同目标恢复${this.data.en}点能量，每次攻击最多计入3次。施放终结技后，我方全体速度提高${this.data.speed}点，持续1回合。`;
  }
  getExtendAttributes() {
    return { atkRate: this.data.atkRate };
  }
  getBuffList(){
    return [
      Buff.getListJson(this.character, BuffSpeed, [Buff.simpleListener()], '', {
        speed: this.data.speed, name: baseData.short, source: '光锥', target: 'member', maxValue: 1,
      }),
    ];
  }
  getReportData() {
    const en = C.calEnergy(this.data.en, this.character);
    return [{
      type:'energy', name:'荆棘[回能]', labels:['三目标', '二目标', '单目标'],
      tip: '攻击命中目标时',
      en0: en * 3, en1: en * 2.0, en2: en,
    }];
  }
  onEvent(e, unit, data) {
    const c = this.character;
    if(unit!==c)return;
    if(e==='ACT_E' && D.checkType(data.type,'US')) {
      c.team.getAliveUnits('members').forEach(m => c.addBuff(Buff.getKey(c.name,'光锥', baseData.short), m, 1));
    }else if(e ==='C_ATK_E') {
      let count = 0;
      let targets = D.filterItems(data.targets);
      for(let i=0; i<targets.length; i++) {
        let canAdd = true;
        for(let j=0; j<i; j++) {
          if(targets[i]===targets[j]){
            canAdd = false;
            break;
          }
        }
        if(canAdd)count++;
        if(count>=3)break;
      }
      c.addEn(this.data.en * count);
    }
  }
}

module.exports = {
  data: baseData,
  weapon: SsrAbuGDHX,
}