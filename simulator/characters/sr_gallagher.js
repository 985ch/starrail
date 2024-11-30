'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDodge } = require('../buff_simple');
const { DebuffAtkRate } = require('../debuff_simple');

const baseData = {
  name: '加拉赫',
  image: 'gallagher.jpg',
  rarity: 'SR',
  job: '丰饶',
  type: 'Fire',
  damages: ['NA','US'],
  needAttrs: [{raw:'breakRate', tar:['healRate'], range:[0,150] }],
  hp: D.levelData['178_1305'],
  atk: D.levelData['72_529'],
  def: D.levelData['60_441'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 110,
  na: D.makeTable([
    ['rate','ratePlus','atkRate'],
    [50,125,10],
    [60,150,11],
    [70,175,12],
    [80,200,13],
    [90,225,14],
    [100,250,15],
    [110,275,16],
    [120,300,17],
    [130,325,18]
  ]),
  naHits: [1],
  naPlusHits: [1],
  naSoul: 3,
  ns: D.makeTable([['heal'],[200],[340],[480],[676],[830],[984],[1138],[1292],[1446],[1600],[1684],[1768],[1852],[1936],[2020]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['weakBRK','heal'],[6,80],[6.6,136],[7.2,192],[7.8,270],[8.4,332],[9,394],[9.75,455],[10.5,517],[11.25,578],[12,640],[12.6,674],[13.2,707],[13.8,741],[14.4,774],[15,808]]),
  psSoul: 5,
  us: D.makeTable([['rate'], [75], [82.5], [90], [97.5], [105], [112.5], [121.88], [131.25], [140.63], [150], [157.5], [165], [172.5], [180],[187.5]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '崭新配方', '天然酵母', '敬请干杯' ],
  attributes: [
    { dodge: 4.0 }, { dodge: 4.0 }, { dodge: 6.0 }, { dodge: 6.0 }, { dodge: 8.0 },
    { breakRate: 5.3 }, { breakRate: 8.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'等价交换', name4: '云无留迹的过客', name2: '盗贼公国塔利亚',
    body: 'healRate', foot: 'speed', link:'breakRate', ball:'hpRate',
    hp: [1, 0, 0]
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_heal_target,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      breakRate:[10, 0, 150],
      speed:[10, 0, 99999],
      dodge:[3, 0, 100],
    },
    main: {
      body: 'healRate',
      foot: 'speed',
      link: 'breakRate',
      ball: 'hpRate',
    },
    set4: ['云无留迹的过客', null],
  },
};

class DebuffMD extends Buff {
  static info() {
    return {
      name: '酩酊',
      short: '酩酊',
      source: '天赋',
      desc: '受到击破伤害提高',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '酩酊'],
    };
  }
  getDesc() {
    return `受到击破伤害提高${D.toPercent(this.member.skillData.ps.weakBRK)}。`;
  }
  init() {
    const m = this.member;
    this.listen({e:'B_ATK_E', t:'enemy', f:(buff, unit, data)=>{
      const healAll = (data.member === m && m.checkES('敬请干杯') && data.options.naPlus);
      const targets = healAll? m.team.getAliveUnits('members'): [data.member];
      m.triggerHeal(targets, m.skillData.ps.heal );
    }});
  }
  getAttributes() {
    return { weakBRK: this.member.skillData.ps.weakBRK }
  }
}
class BuffMDReport extends Buff {
  static info() {
    return {
      name: '酩酊[回血]）',
      short: '回血',
      source: '天赋',
      desc: '展示回血报告',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    const heal0 = C.calHealData(this.member.skillData.ps.heal, this.member, target);
    return [{
      type:'heal', name: '酩酊[回血]', labels:['治疗量'], heal0, 
    }];
  }
}
class BuffHealRate extends Buff {
  static info() {
    return {
      name: '崭新配方',
      short: '治疗量',
      source: '遗器',
      desc: '提高相当于击破特攻50%的治疗量，最多提高75%',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const healRate = Math.min(75, this.member.attr.data.breakRate * 0.5);
    return `治疗量提高${Math.floor(healRate)}%`
  }
  getTransAttr() {
    return {
      healRate: { raw:'breakRate', rate:0.5, max: 75 }
    };
  }
}

class SrGallagher extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkSoul(1)) list.push({
      dodge: 50,
      breakRate: this.checkSoul(6)? 20: 0,
      breakBonus: this.checkSoul(6)? 20: 0,
    });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffMD, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffMDReport, []),
      Buff.getListJson(this, DebuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: this.skillData.na.atkRate, name: '攻击降低', source: '普攻', maxValue: 1
      }),
    ];
    if(this.checkES('崭新配方')){
      list.push(Buff.getListJson(this, BuffHealRate, []));
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffDodge, [Buff.simpleListener()], '', {
        dodge: 30, name: '抵抗提升', source:'战技', target:'member', maxValue:1,
      }))
    }
    return list;
  }
  getStateExText() {
    return `${this.state.naPlus?'已':'未'}强化`;
  }
  getStateExData() {
    return this.state.naPlus? 1 : 0;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getLiveReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    if(!this.state.naPlus ) {
      return super.castNA(target);
    }
    this.actionAttack(cb=>{
      cb();
      this.addBuff(Buff.getKey(this.name, '普攻', '攻击降低'), target, 1, { count: 2 });
      this.state.naPlus = false;
    }, 'NA', target, 'single', 20, this.rawFunc(3, 'na', 'ratePlus'), this.base.naPlusHits, null, { naPlus:true });
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    this.actionHeal(cb=>{
      cb();
      if(this.checkSoul(2)) {
        target.removeABuff('debuff');
        this.addBuff(Buff.getKey(this.name, '战技', '抵抗提升'), target, 1, {count:2});
      }
    },'NS', target, 'single', this.skillData.ns.heal, 30);
  }
  castUS(target){
    const buffKey = Buff.getKey(this.name,'天赋','酩酊');
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      this.state.naPlus = true;
      this.team.getAliveUnits('enemies').forEach(t => {
        this.addBuff(buffKey, t, 1, { count: this.checkSoul(4)?3 :2 })
      });
    }, 'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
    if(this.checkES('天然酵母'))this.changeWaitTime(-100, true);
  }
  castSP() {
    super.castSP(()=>{
      const buffKey = Buff.getKey(this.name,'天赋','酩酊');
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 50));
      this.team.getAliveUnits('enemies').forEach(t => {
        this.addBuff(buffKey, t, 1, { count: 2 })
      });
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkSoul(1)) this.addEn(20);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, us } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻', brkDmg: brkDmg * 3}, C.calDmg(base * na.ratePlus, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg * 2 }, C.calDmg(base * us.rate, ['Fire', 'US'], this, enemy)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    list.push({
      type:'heal', name:'战技[回复]', labels:['治疗量'],
      heal0: C.calHealData(this.skillData.ns.heal, this, this),
    });
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrGallagher,
};