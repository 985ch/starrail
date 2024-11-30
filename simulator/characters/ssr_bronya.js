'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffCriRate, BuffAtkRate, BuffDefRate, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '布洛妮娅',
  image: 'bronya.jpg',
  rarity: 'SSR',
  job: '同谐',
  type: 'Wind',
  damages: ['NA','NS'],
  hp: D.levelData['168_1241'],
  atk: D.levelData['79_582'],
  def: D.levelData['72_533'],
  speed: 99,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['bonusAll'],[33],[36],[39],[42],[46],[49],[53],[57],[61],[66],[69],[72]]),
  nsTarget: 'member',
  nsSoul: 5,
  ps: D.makeTable([['waitRate'],[15],[16.5],[18],[19.5],[21],[22.5],[24],[26],[28],[30],[31.5],[33]]),
  psSoul: 3,
  us: D.makeTable([
    ['atkRate', 'criDmgT', 'criDamage'],
    [33, 12.0, 12.0],
    [35, 12.4, 12.8],
    [37, 12.8, 13.6],
    [39, 13.2, 14.4],
    [41, 13.6, 15.2],
    [44, 14.0, 16.0],
    [46, 14.5, 17.0],
    [49, 15.0, 18.0],
    [52, 15.5, 19.0],
    [55, 16.0, 20.0],
    [57, 16.4, 20.8],
    [59, 16.8, 21.6],
  ]),
  usTarget: 'member',
  usSoul: 3,
  es: [ '号令', '阵地', '军势' ],
  attributes: [
    {bonusWind: 3.2}, {bonusWind: 3.2}, {bonusWind: 4.8}, {bonusWind: 4.8}, {bonusWind: 6.4},
    {dodge: 4.0 }, {dodge: 6.0 }, {criDamage: 5.3 }, {criDamage: 8.0 }, {criDamage: 10.7 },
  ],
  ai:{
    na: ai.na_default,
    ns: ai.ns_sp_gt(1),
    us: ai.us_buff_noT("布洛妮娅$终结技$贝洛伯格进行曲."),
  },
  defaultJson: {
    weapon:'但战斗还未结束', name4: '骇域漫游的信使', name2: '生命的翁瓦克',
    body: 'criDamage', foot: 'speed', link:'enRate', ball:'bonusWind',
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      speed:[10, 0, 99999],
      criDamage:[5, 0, 99999],
    },
    main: {
      body: 'criDamage',
      foot: 'speed',
      link: 'enRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
    set2: '生命的翁瓦克',
  },
};

class BuffBLBG extends Buff {
  static info() {
    return {
      name: '贝洛伯格进行曲',
      short: '攻暴',
      source: '终结技',
      desc:'攻击力和暴伤提高',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', '暴伤', '加攻', 'atkRate'],
    };
  }
  getDesc() {
    const { atkRate, criDamage } = this.getData();
    return `攻击提高${D.toPercent(atkRate)}，暴击伤害提高${D.toPercent(criDamage)}。`
  }
  init() {
    const m = this.member;
    const us = m.skillData.us;
    this.state.criDamage = m.attr.data.criDamage * us.criDmgT * 0.01 + us.criDamage;
  }
  getAttributes() { return this.getData() }
  getData() {
    const us = this.member.skillData.us;
    return {
      atkRate: us.atkRate,
      criDamage: this.state.criDamage,
    };
  }
}
class BuffSpeedListener extends Buff {
  static info() {
    return {
      name: '快速行军（监听）',
      short: '加速',
      source: '星魂',
      desc:'buff消失时加速',
      show: false,
      maxValue: 1,
      target:'member',
      tags: [],
    }
  }
  beforeRemove() {
    this.member.addBuff(Buff.getKey(baseData.name, '星魂', '快速行军'), this.target, 1, {count: 1});
  }
}
class BuffAdDamage extends Buff {
  static info() {
    return {
      name: '追加伤害',
      short: '追伤',
      source: '星魂',
      desc:'对弱风敌人造成追加伤害',
      show: false,
      maxValue: 0,
      target:'members',
      tags: ['report'],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'TURN_E', t:'self', f:(buff,unit, data)=>{
      m.state.castedAdDmg = false;
    }});
    this.listen({e:'C_DMG_E', t:'members', f:(buff,unit, data)=>{
      const t = data.targets[0];
      if(unit === m || m.state.castedAdDmg || !D.checkType(data.type, 'NA') || !t.findBuff({tag:'weakWind'})) return;
      A.newAddDmg(m, data.member, [t], m.getBaseDmg('na')*0.8 );
      m.state.castedAdDmg = true;
    }})
  }
  getReportData(target) {
    const self = this.member;
    const enemy = target.getEnemy();
    if(target === self || !enemy.findBuff({tag:'weakWind'})) return [];
    return [Object.assign({ type:'damage', name: `布洛妮娅[追伤]`, }, self.getAdditionDamage(self.getBaseDmg('na')*0.8, enemy, 'Wind'))];
  }
}
class SsrBronya extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { ns } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()],'',{
        bonusAll: ns.bonusAll, name: '作战再部署', source:'战技', maxValue: 1, target:'member',
      }),
      Buff.getListJson(this, BuffBLBG, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()],'',{
        atkRate: 15, name: '在旗帜下', source:'秘技', maxValue: 1, target:'member',
      }),
    ];
    if(this.checkES('阵地')){
      list.push(Buff.getListJson(this, BuffDefRate, [Buff.simpleListener()], '', {
        defRate: 20, name: '阵地', source: '天赋',  maxValue: 1, target:'member',
      }));
    }
    if(this.checkES('军势')){
      list.push(Buff.getListJson(this, BuffDamage, [], '', {
        bonusAll: 10, name: '军势', source: '天赋', target:'members',
      }));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 30, name: '快速行军', source: '星魂', maxValue: 1, target:'member',
      }),Buff.getListJson(this, BuffSpeedListener, [Buff.eventListener('ACT_E','member')]));
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffAdDamage));
    }
    return list;
  }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('号令')) list.push({ critNA:100 });
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        { type:'action', name:'行动间隔（普攻后）', wait: this.calActionTime()*(1 - this.skillData.ps.waitRate * 0.01) },
        ...R.getEnergyReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    super.castNA(target);
    this.changeWaitTime(-this.skillData.ps.waitRate);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      target.removeABuff('debuff');
      target.changeWaitTime(-100, true);
      this.addBuff(Buff.getKey(this.name, '战技', '作战再部署'), target, 1, { count: this.checkSoul(6)? 2: 1 });
      if(this.checkSoul(2))this.addBuff(Buff.getKey(this.name, '星魂', '快速行军（监听）'), target, 1, { count: 1 });
    });
    if(this.checkSoul(1) && Math.random()<0.5 && this.updateCD(2, 'addSp', true) ) {
      this.changeSp(1);
    }
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    const buffKey = Buff.getKey(this.name, '终结技', '贝洛伯格进行曲');
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.team.getAliveUnits('members').forEach(m=>{
        if(m===this)return;
        this.addBuff(buffKey, m, 1, {count:2});
      });
      this.addBuff(buffKey, this, 1, {count:2});
    });
    this.addEn(5);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('members').forEach(m => this.addBuff(Buff.getKey(this.name, '秘技', '在旗帜下'), m, 1, {count:2}));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      this.team.getAliveUnits('members').forEach(m => {
        if(this.checkES('阵地')) this.addBuff(Buff.getKey(this.name, '天赋', '阵地'), m, 1, {count:2});
        if(this.state.spActivated) this.onSP();
      })
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const crit = this.checkES('号令')? 100 : 0; 
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(this.getBaseDmg('na'), ['Wind','NA'], this, enemy, null, { crit })),
      R.getBreakReport(this, enemy),
    ];
  }
}

module.exports = {
  data: baseData,
  character: SsrBronya,
};