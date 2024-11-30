'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '知更鸟',
  image: 'robin.jpg',
  rarity: 'SSR',
  job: '同谐',
  type: 'Physical',
  damages: ['NA','AD'],
  hp: D.levelData['174_1280'],
  atk: D.levelData['87_640'],
  def: D.levelData['66_485'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 160,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [0.33,0.33,0.34],
  naSoul: 5,
  ns: D.makeTable([['bonusAll'],[25],[27.5],[30],[32.5],[35],[37.5],[40.63],[43.75],[46.88],[50],[52.5],[55],[57.5],[60],[62.5]]),
  nsTarget: 'members',
  nsSoul: 5,
  ps: D.makeTable([['criDamage'],[5],[6.5],[8],[9.5],[11],[12.5],[14.38],[16.25],[18.13],[20],[21.5],[23],[24.5],[26],[27.5]]),
  psSoul: 3,
  us: D.makeTable([
    ['atkRate','atk','rate'],
    [15.2, 50, 72],
    [15.96, 65, 76.8],
    [16.72, 80, 81.6],
    [17.48, 95, 86.4],
    [18.24, 110, 91.2],
    [19, 125, 96],
    [19.95, 144, 102],
    [20.9, 163, 108],
    [21.85, 181, 114],
    [22.8, 200, 120],
    [23.56, 215, 124.8],
    [24.32, 230, 129.6],
    [25.08, 245, 134.4],
    [25.84, 260, 139.2],
    [26.6, 275, 144],
  ]),
  usTarget: 'members',
  usSoul: 3,
  es: [ '华彩花腔', '即兴装饰', '模进乐段' ],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {speed: 2.0 }, {speed: 3.0 }, {hpRate: 4.0 }, {hpRate: 6.0 }, {hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'夜色流光溢彩', name4: '骇域漫游的信使', name2: '折断的龙骨',
    body: 'atkRate', foot: 'speed', link:'enRate', ball:'atkRate',
    def:[0,0,1], atk:[0,0,1],
  },
  aiConditions: [],
  ai:{
    na: ai.na_default,
    ns: ai.ns_buff_noS("知更鸟$战技$咏叹调."),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      atk:[100, 0, 9999],
      speed:[10, 0, 99999],
    },
    main: {
      body: 'atkRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'atkRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
  },
};

const buffUsKey = Buff.getKey(baseData.name, '终结技', '协奏'); 
class BuffUS extends Buff {
  static info() {
    return {
      name: '协奏',
      short: '协奏',
      source: '终结技',
      desc: '攻击力提高，攻击时造成附加伤害',
      show: true,
      maxValue: 1,
      target:'members',
      tags: ['buff','加攻','report','附加伤害'],
    }
  }
  getDesc(target, enemy) {
    const data = this.getData(target, enemy, true);
    let text = `攻击力提高${Math.floor(data.atk)}，攻击时知更鸟会造成${Math.floor(data.damage)}的物理属性附加伤害。`;
    if(data.criDmgAA) text += `追加攻击暴伤提高${data.criDmgAA}%。`;
    if(data.throughAll) text += `全抗性穿透提高${data.throughAll}%。`;
    if(data.speedRate) text += `速度提高${data.speedRate}%。`;
    if(data.dodge) text += `效果抵抗提高${data.dodge}%。`;
    return text;
  }
  init() {
    const m = this.member;
    this.listen({e:'UPDATE_DATA', t:'self', f:(buff, unit, data)=>{
      this.markTargets(true, m);
    }})
    this.listen({e:'C_DMG_E', t:'members', f:(buff, unit, data)=>{
      const t = D.sample(data.targets.filter(t=>t.checkAlive()));
      const base = m.getAttr('atk') * m.skillData.us.rate * 0.01;
      if(t)A.newAddDmg(m, data.member, [t], base, false, 'Physical', 'AD', {}, ()=>{
        return m.getRobinDamage(t);
      });
    }})
  }
  getAttributes(target) {
    return this.getData(target, target.getEnemy(), false);
  }
  getTransAttr(target) {
    const m = this.member;
    if(target!==m) return null;
    const us = m.skillData.us;
    return {
      atk: { raw:'atk', rate:us.atkRate*0.01, add:us.atk}
    }
  }
  getData(target, enemy, withDmg = false) {
    const m = this.member;
    const us = m.skillData.us;
    const atk = (target===m)? (withDmg && this.lastTransAttr[m.name]? this.lastTransAttr[m.name].atk : 0): m.getAttr('atk') * us.atkRate*0.01 + us.atk;
    const data = { atk }
    if(withDmg) data.damage = m.getRobinDamage(enemy).expDamage;
    if(m.checkES('即兴装饰')) data.criDmgAA = 25;
    if(m.checkSoul(1)) data.throughAll = 24;
    if(m.checkSoul(2)) data.speedRate = 16;
    if(m.checkSoul(4)) data.dodge = 50;
    return data;
  }
  blockDebuff(member, target, info) {
    return this.member === target && info.tags.includes('控制'); 
  }
  getReportData(target) {
    const enemy = target.getEnemy();
    return [Object.assign({ type: 'damage', name:'[知更鸟]追伤'}, this.member.getRobinDamage(enemy) )]
  }
}
class BuffPS extends Buff {
  static info() {
    return {
      name: '合颂',
      short: '暴伤',
      source: '天赋',
      desc: '暴击伤害提高',
      show: true,
      maxValue: 0,
      target:'members',
      tags: ['report','暴伤'],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'C_ATK_E', t:'members', f:(buff, unit, data) => {
      m.addEn(2);
    }})
  }
  getDesc() {
    const en = C.calEnergy(this.member.checkSoul(2)? 3: 2, this.member);
    return `暴击伤害提高${D.toPercent(this.member.skillData.ps.criDamage)}，我方攻击敌方后知更鸟恢复${en.toFixed(2)}点能量。`;
  }
  getReportData(target) {
    if(target!==this.member) return [];
    return [{ type: 'energy', name: '天赋回能', labels: ['每次攻击'], en0: C.calEnergy(this.member.checkSoul(2)? 3: 2, this.member) }]
  }
}
class BuffSP extends Buff {
  static info() {
    return {
      name: '序曲',
      short: '序曲',
      source: '秘技',
      desc: '每个波次开始回能',
      show: true,
      maxValue: 1,
      target:'self',
      tags: ['report'],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'WAVE_S', t:'self', f:(buff, unit, data) => {
      m.addEn(5);
    }})
  }
  getDesc() {
    const en = C.calEnergy(5, this.member);
    return `每个波次开始时恢复${en.toFixed(2)}点能量。`;
  }
  getReportData() {
    return [{ type: 'energy', name: '波次回能', labels: ['每波次'], en0: C.calEnergy(5, this.member) }]
  }
}

class SsrRobin extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffDamage, [Buff.eventListener('TURN_S','self')], '', {
        bonusAll: this.skillData.ns.bonusAll, name:'咏叹调', target:'members', source:'战技', maxValue: 1,
      }),
      Buff.getListJson(this, BuffUS, [Buff.eventListener('TURN_S', 'self')]),
      Buff.getListJson(this, BuffSP, []),
      Buff.getListJson(this, BuffPS),
    ];
    return list;
  }
  getStateExText() {
    const { ns, us } = this.getStateExData();
    return `增伤${ns} ${us?'协奏中':'行动中'}`;
  }
  getStateExData(key) {
    const buffNs = this.findBuff({key:Buff.getKey(this.name, '战技', '咏叹调'), target:'members'});
    const buffUs = this.findBuff({key:buffUsKey, target:'members'});
    const data = {
      ns: buffNs? buffNs.state.count: 0,
      us: buffUs? 1: 0,
    };
    return key? data[key]: data;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, {ns: this.checkES('模进乐段')? 35: 30}),
        ...this.getActionReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(Buff.getKey(this.name, '战技', '咏叹调'), target, 1, { count: 3 });
    });
    this.addEn(this.checkES('模进乐段')? 35: 30);
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(buffUsKey, target, 1, { count:1 });
      this.team.getAliveUnits('members').forEach(member => {
        if(member!==this) member.changeWaitTime(-100);
        if(this.checkSoul(4)) {
          while(member.findBuff({tag:'控制'})) {
            member.removeABuff('控制');
          }
        }
      });
      if(this.checkSoul(6)) this.state.soul6Bouns = 8;
    });
    this.addEn(5);
    this.state.actionLocked = true;
    if(this.checkMyTurn()) {
      this.team.state.acted = true;
      this.state.nextWait = this.calActionTime();
    } else {
      this.state.wait = this.calActionTime();
      this.team.updateActionUnit(this);
    }
  }
  checkDisableUS() {
    return this.state.actionLocked || super.checkDisableUS();
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '序曲'), this, 1);
  }
  getRobinDamage(enemy) {
    const info = C.calDmgData(['Physical', 'AD'], this, enemy);
    info.crit = 1;
    info.criDmg = this.state.soul6Bouns? 6: 1.5;
    if(this.state.soul6Bouns) this.state.soul6Bouns--;
    return C.calDmgByData(this.getAttr('atk')*this.skillData.us.rate*0.01, info);
  }
  // 覆盖几个行动时间相关的方法
  calActionTime() {
    if(this.state.actionLocked) {
      return C.calActionTime(90, 0);
    }
    return super.calActionTime();
  }
  changeWaitTime(percent, forceChange = false) {
    if(this.state.actionLocked) percent = 0;
    super.changeWaitTime(percent, forceChange)
  }
  setNextWaitTime(percent) {
    if(this.state.actionLocked) percent = 0;
    super.setNextWaitTime(percent);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.fieldActivated) this.onSP();
      if(this.checkES('华彩花腔')) this.changeWaitTime(-25);
    } else if(e==='TURN_S') {
      if(this.state.actionLocked) this.state.actionLocked = false;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(base * this.skillData.na.rate, ['Physical', 'NA'], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  getActionReport() {
    const list = R.getActionReport(this);
    if(this.checkES('华彩花腔')) {
      const wait = C.calActionTime(this.getAttr('speed'), 25.0);
      list.push({ type:'action', name:'进战首动', wait, hideTurn: true });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrRobin,
};