'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffAtk } = require('../buff_simple');

const baseData = {
  name: '玲可',
  image: 'lynx.jpg',
  rarity: 'SR',
  job: '丰饶',
  type: 'Quantum',
  mainAttr: 'hp',
  damages: ['NA','NS'],
  hp: D.levelData['144_1058'],
  atk: D.levelData['67_493'],
  def: D.levelData['75_551'],
  speed: 100,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 100,
  na: D.makeTable([['rate'],[25],[30],[35],[40],[45],[50],[55],[60],[65]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['hpRate','hpMax','healR','heal'],
    [5,50,8,80],
    [5.25,80,8.5,128],
    [5.5,102.5,9,164],
    [5.75,125,9.5,200],
    [6,140,10,224],
    [6.25,155,10.4,248],
    [6.56,166.25,10.8,266],
    [6.88,177.5,11.2,284],
    [7.19,188.75,11.6,302],
    [7.5,200,12,320],
    [7.75,211.25,12.4,338],
    [8,222.5,12.8,356],
    [8.25,233.75,13.2,374],
    [8.5,245,13.6,392],
    [8.75,256.25,14,410],
  ]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([
    ['healR', 'heal', 'healPR', 'healP'],
    [2.4,24,3,30],
    [2.55,38.4,3.19,48],
    [2.7,49.2,3.38,61.5],
    [2.85,60,3.56,75],
    [3,67.2,3.75,84],
    [3.12,74.4,3.9,93],
    [3.24,79.8,4.05,99.75],
    [3.36,85.2,4.2,106.5],
    [3.48,90.6,4.35,113.25],
    [3.6,96,4.5,120],
    [3.72,101.4,4.65,126.75],
    [3.84,106.8,4.8,133.5],
    [3.96,112.2,4.95,140.25],
    [4.08,117.6,5.1,147],
    [4.2,123,5.25,153.75],
  ]),
  psSoul: 5,
  us: D.makeTable([['healR', 'heal'],[9,90],[9.56,144],[10.13,184.5],[10.69,225],[11.25,252],[11.7,279],[12.15,299.25],[12.6,319.5],[13.05,339.75],[13.5,360],[13.95,380.25],[14.4,400.5],[14.85,420.75],[15.3,441],[15.75,461.25]]),
  usTarget: 'members',
  usSoul: 5,
  es: [ '提前勘测', '探险技术', '极境求生' ],
  attributes: [
    { hpRate: 4.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
    { dodge: 4.0 }, { dodge: 6.0 }, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'一场术后对话', name4: '云无留迹的过客', name2: '不老者的仙舟',
    body: 'healRate', foot: 'speed', link:'enRate', ball:'hpRate',
    atk:[1,0,0],
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_heal_target,
    us: ai.us_heal_aoe,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[10, 4000, 99999],
      speed:[10, 0, 99999],
      dodge:[5, 0, 100],
    },
    main: {
      body: 'healRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'hpRate',
    },
    set4: ['云无留迹的过客', null],
  },
};

const buffNSKey = Buff.getKey(baseData.name, '战技', '求生反应');
const buffPSKey = Buff.getKey(baseData.name, '天赋', '户外生存经验');

class BuffQSFY extends Buff {
  static info() {
    return {
      name: '求生反应',
      short: '求生',
      source: '战技',
      desc: '生命上限提高，效果抵抗提高',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', '生命上限', '抵抗', '抵抗异常'],
    }
  }
  getDesc() {
    const { hp, dodge } = this.getData();
    let desc = `生命上限提高${Math.floor(hp)}`;
    if(dodge > 0) {
      desc += `, 效果抵抗提高${dodge}%`;
    }
    return desc;
  }
  init() {
    if(this.member.checkSoul(2)) this.state.blockCount = 1;
    if(this.member.checkES('提前勘测'))this.listen({ e: 'B_ATK_E', f: ()=> this.member.addEn(2)});
  }
  blockDebuff() {
    if(this.state.blockCount){
      this.state.blockCount--;
      return true;
    }
    return false
  }
  getAttributes() {
    const data = this.getData();
    if(['存护','毁灭'].includes(this.target.base.job)) data.hateRate = 300;
    return data;
  }
  getData() {
    const { hpRate, hpMax } = this.member.skillData.ns;
    const hp = this.member.getAttr('hp');
    const soul6 = this.member.checkSoul(6);
    return {
      hp: hp * ( hpRate + (soul6 ? 6: 0)) * 0.01 + hpMax,
      dodge: soul6 ? 30 : 0,
    }
  }
}
class BuffHeal extends Buff {
  static info() {
    return {
      name: '户外生存经验',
      short: '回血',
      source: '天赋',
      desc: '持续回血',
      show: true ,
      maxValue: 1,
      target: 'member',
      tags: ['buff', 'HOT', 'report'],
    };
  }
  getDesc() {
    const heal = this.getData(this.target);
    return `回合开始时恢复${Math.floor(heal)}点生命`;
  }
  getReportData(target) {
    return [{ type:'heal', name: '[玲可]持续治疗', labels:['治疗量'], tip:'玲可触发被动时', heal0:this.getData(target) }]
  }
  getData(target) {
    return this.member.getBaseHeal('ps') + (target.findBuff({key: buffNSKey}))? this.member.getBaseHeal('ps','healP'): 0;
  }
}
class BuffHealRate extends Buff {
  static info() {
    return {
      name: '远行雪杖的清晨',
      short: '治疗效率',
      source: '星魂',
      desc: '对半血以下的我方目标治疗量提升',
      show: false ,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    if(target.faction === 'members' && target.checkHp(50)) {
      return { healRate: 20 }
    }
    return {};
  }
}

class SrLynx extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('探险技术')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffQSFY, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffHeal, [Buff.hotListener()]),
    ];
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffHealRate));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffAtk, [Buff.simpleListener()], '', {
        atk: this.getAttr('hp') * 0.03,
        name: '求生反应[加攻]', source:'战技', target: 'member',
        maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getLiveReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...this.getEnergyReport(),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) { super.castNA(target, 'hp') }
  castNS(target) {
    super.castNS(target);
    this.actionHeal(cb=>{
      this.addBuff(buffNSKey, target, 1, { count: this.checkES('极境求生')? 3: 2 });
      if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '战技', '求生反应[加攻]'), target, 1);
      this.castPS(target);
      cb();
    }, 'NS', target, 'single', this.getBaseHeal('ns'), 30);
  }
  castUS(target){
    super.castUS(target);
    this.actionHeal(cb=>{
      this.team.getAliveUnits('members').forEach(m => {
        m.removeABuff('debuff');
        this.castPS(m);
      })
      cb();
    }, 'US', target, 'all', this.getBaseHeal('us'), 5);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('members').forEach((m)=>this.addBuff(buffPSKey, m, 1, { count:2 }));
  }
  onEvent(e, unit, data) {
    if(unit===this && e==='BTL_S' && this.state.spActivated) {
      this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  // 对指定目标添加天赋对应的buff
  castPS(target) {
    this.addBuff(buffPSKey, target, 1, {count: this.checkES('极境求生')?3:2});
  }
  // 获取生存性能报告
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    const baseNS = this.getBaseHeal('ns')
    const baseUS = this.getBaseHeal('us')
    list.push({
      type:'heal', name:'战技[回复]', labels:['治疗量'], heal0: C.calHealData(baseNS, this, this),
    }, {
      type:'heal', name:'终结技[回复]', labels:['治疗量'], heal0: C.calHealData(baseUS, this, this),
    });
    if(this.checkES('探险技术')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35.0) });
    }
    return list;
  }
  // 获取能量报告
  getEnergyReport(){
    const list = R.getEnergyReport(this, { ns:30, us:5 });
    if(this.checkES('极境求生')) {
      list.push({ type: 'energy', name: '求生反应[回能]', labels: ['队友受击'], en0: C.calEnergy(2, this)});
    }
    return list;
  }
  // 获取伤害报告
  getDamageReport(enemy){
    return [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(this.getAttr('hp') * this.skillData.na.rate * 0.01, ['Quantum', 'NA'], this, enemy)),
      R.getBreakReport(this,enemy),
    ];
  }
}

module.exports = {
  data: baseData,
  character: SrLynx,
};