'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDefThrough, BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '银枝',
  image: 'argenti.jpg',
  rarity: 'SSR',
  job: '智识',
  type: 'Physical',
  hp: D.levelData['142_1047'],
  atk: D.levelData['100_737'],
  def: D.levelData['49_363'],
  speed: 103,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 180,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[60],[66],[72],[78],[84],[90],[97.5],[105],[112.5],[120],[126],[132]]),
  nsHits: [1],
  nsTarget: 'enemies',
  nsSoul: 3,
  ps: D.makeTable([['criRate'],[1.0],[1.15],[1.3],[1.45],[1.6],[1.75],[1.9],[2.1],[2.3],[2.5],[2.65],[2.8]]),
  psSoul: 3,
  us: D.makeTable([
    ['rateA','rateB','rateC'],
    [96, 168, 57],
    [102, 179, 60],
    [108, 190, 64],
    [115, 201, 68],
    [121, 212, 72],
    [128, 224, 76],
    [136, 238, 80],
    [144, 252, 85],
    [152, 266, 90],
    [160, 280, 95],
    [166, 291, 98],
    [172, 302, 102],
  ]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '虔诚', '慷慨', '勇气' ],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {hpRate: 4.0}, {hpRate: 6.0}, {bonusPhysical: 3.2}, {bonusPhysical: 4.8}, {bonusPhysical: 6.4},
  ],
  defaultJson: {
    weapon:'片刻，留在眼底', name4: '街头出身的拳王', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusPhysical',
    atkRate: [0, 3, 2],
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us:{
      disable:false,
      rules:[[{t:"en",v:["s","absolute","eqm",0]}]]
    }
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'enRate',
      ball: 'bonusPhysical',
    },
    set2: '停转的萨尔索图'
  },
};
const buffPsKey = Buff.getKey(baseData.name, '天赋', '升格');
class BuffSG extends Buff {
  static info(data) {
    return {
      name: '升格',
      short: '升格',
      source: '天赋',
      desc: '暴击和暴伤提高。',
      show: true,
      maxValue: data.maxValue,
      target:'self',
      tags: ['buff', '暴击', '暴伤'],
    }
  }
  getDesc() {
    const { criRate, criDamage } = this.getData();
    return `暴击提高${D.toPercent(criRate)}${ criDamage>0? '，暴伤提高'+D.toPercent(criDamage) : ''}。`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const m = this.member;
    return {
      criRate: m.skillData.ps.criRate * this.value,
      criDamage: m.checkSoul(1)? 4 * this.value : 0,
    }
  }
}
class BuffBonus extends Buff {
  static info() {
    return {
      name: '勇气',
      short: '增伤',
      source: '天赋',
      desc: '对低生命值目标增伤。',
      show: false,
      maxValue: 0,
      target:'self',
      tags: [],
    }
  }
  getAttributesT(target) {
    return target.checkHp(50)? { bonusAll: 15 }: {};
  }
}
class BuffAddEn extends Buff {
  static info() {
    return {
      name: '银枝',
      short: '银枝',
      source: '天赋',
      desc: '监听用状态',
      show: false,
      maxValue: 0,
      target:'self',
      tags: [],
    }
  }
  init() {
    this.listen({e:'BTL_S', t:'enemies', f:(buff, unit, data)=>this.member.addEn(2)});
  }
}

class SsrArgenti extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffSG, [],'',{ maxValue: this.checkSoul(4)? 12: 10 }),
    ];
    if(this.checkES('慷慨')) list.push(Buff.getListJson(this, BuffAddEn));
    if(this.checkES('勇气')) list.push(Buff.getListJson(this, BuffBonus));
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()],'', {
        atkRate: 40, name: '谦卑', source: '星魂',  maxValue: 1
      }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffDefThrough, [Buff.eventListener('ACT_E','self')],'', {
        defThrough: 30, name: '光芒', source: '星魂',  maxValue: 1, hide: true,
      }));
    }
    return list;
  }
  getStateExText() {
    const buff = this.findBuff({key: buffPsKey})
    return `升格:${buff? buff.value: 0}`;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'all', 30, this.rawFunc(1, 'ns'), baseData.nsHits);
  }
  checkDisableUS() {
    return  !this.checkAlive() || this.state.en < 90 || this.findBuff({tag:'freeze'})
  }
  castUS(target){
    if(this.state.en<this.base.enMax) {
      this.state.en -= 90;
      this.actionAttack(cb=>cb(), 'US', target, 'all', 5, this.rawFunc(2, 'us', 'rateA'), baseData.usHits);
    } else {
      this.state.en = 0;
      this.castUSPlus(target);
    }
  }
  castUSPlus(target){
    const { us } = this.skillData;
    const getHitInfo = (i, targets) => {
      if(i===0) {
        return targets.map(t=>({t, r: 1}))
      }
      const t = D.sample(targets.filter(t=>t.checkAlive()))
      return [{t: t || targets[0], r: 1}];
    }
    this.actionAttack(cb=>cb(), 'US', target, 'random', 0, (idxT, idxH)=>{
      const data= {
        brkDmg: idxH===0? 2 : 0.5,
        raw: this.getAttr('atk')*0.01*(idxH===0? us.rateB: us.rateC),
      }
      return data;
    }, 7, null, { getHitInfo });
    this.addEn(5);
  }
  castSP() {
    this.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    A.startBattleDmg(this, 0, this.rawFuncRate(0, 80));
    this.addEn(15);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='ACT_S') {
      const type = D.checkType(data.type, ['NA','NS','US']);
      if(type) {
        const count = type==='NA'? 1: this.team.getAliveUnits('enemies').length;
        this.addEn(3*count);
        this.addBuff(buffPsKey, this, count);
        if( type==='US') {
          if(this.checkSoul(2) && count >=3 ) {
            this.addBuff(Buff.getKey(this.name, '星魂', '谦卑'), this, 1, {count:1});
          }
          if(this.checkSoul(6)) {
            this.addBuff(Buff.getKey(this.name, '星魂', '光芒'), this, 1, {count:1});
          }
        }
      }
    } else if(e==='TURN_S') {
      if(this.checkES('虔诚')) this.addBuff(buffPsKey, this, 1);
    } else if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
      if(this.checkSoul(4)) this.addBuff(buffPsKey, this, 2);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const arp = this.checkSoul(6) && !this.findBuff({key:Buff.getKey(this.name, '星魂', '光芒')}) ? 30 : 0;
    const fixed = { defDown: arp }

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Physical', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg }, C.calDmg(base * ns.rate, [ 'Physical', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rateA, [ 'Physical', 'US' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'终结技[强化]', brkDmg: brkDmg*2}, C.calDmg(base * us.rateB, [ 'Physical', 'US' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'终结技[追加]', brkDmg: brkDmg/2, tip:'共触发6次'}, C.calDmg(base * us.rateC, [ 'Physical', 'US' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'秘技'}, C.calDmg(base * 80, [ 'Physical', 'SP' ], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
  // 获取基本的能量数据报告
  getEnergyReport() {
    const others = [['秘技进战', 15]];
    if(this.checkES('慷慨')) others.push(['敌人进战', 2]);
    const list = R.getEnergyReport(this, { others });
    const en = C.calEnergy(3, this);
    list.push({
      type:'energy', name:'攻击命中', labels:['五目标', '三目标', '每个目标'],
      en0: en * 5, en1: en * 3, en2: en,
    })
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrArgenti,
};