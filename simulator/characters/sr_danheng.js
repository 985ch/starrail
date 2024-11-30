'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffAtkRate, BuffSpeedRate } = require('../buff_simple');
const { DebuffSpeedRate } = require('../debuff_simple');

const baseData = {
  name: '丹恒',
  image: 'danheng.jpg',
  rarity: 'SR',
  job: '巡猎',
  type: 'Wind',
  hp: D.levelData['120_882'],
  atk: D.levelData['74_546'],
  def: D.levelData['54_396'],
  speed: 110,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.45, 0.55],
  naSoul: 3,
  ns: D.makeTable([['rate'],[130],[143],[156],[169],[182],[195],[211],[227],[243],[260],[273],[286]]),
  nsTarget: 'enemy',
  nsHits: [0.3, 0.15, 0.15, 0.4],
  nsSoul: 3,
  ps: D.makeTable([['throughWind'], [18], [19], [21], [23], [25], [27], [29], [31], [33], [36], [37], [39]]),
  psSoul: 5,
  us: D.makeTable([['rate','rateBonus'],[240, 72],[256, 76],[272, 81],[288, 86],[304, 91],[320, 96],[340, 102],[360, 108],[380, 114],[400, 120],[416, 124],[432, 129]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '潜龙', '绝影', '罡风' ],
  attributes: [
    { bonusWind: 3.2 }, { bonusWind: 3.2 }, { bonusWind: 4.8 }, { bonusWind: 4.8 }, { bonusWind: 6.4 },
    { defRate: 5.0 }, { defRate: 7.5 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
  ],
  defaultJson: {
    weapon:'唯有沉默', name4: '晨昏交界的翔鹰', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusWind',
    hp: [1, 0, 0]
  },
};

class BuffThrough extends Buff {
  static info() {
    return {
      name: '风抗穿透',
      short: '风穿',
      source: '天赋',
      desc: '风抗性穿透',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '风穿', 'throughWind', 'removable'],
    };
  }
  getDesc() {
    return `下一次攻击风抗性穿透提高${D.toPercent(this.member.skillData.ps.throughWind)}。`;
  }
  getAttributes() {
    return {
      throughWind: this.member.skillData.ps.throughWind,
    }
  }
}
class BuffDanHeng extends Buff {
  static info() {
    return {
      name: '丹恒天赋',
      short: '特殊',
      source: '天赋',
      desc: '丹恒',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'ACT_E', t:'members', f:(buff, unit, data)=>{
      if(unit.faction !=='members' || (data.target !=='members' && data.target !== m)) return;
      if(m.state.throughTurn && m.state.turn <= m.state.throughTurn) return;
      m.addBuff(Buff.getKey(m.name, '天赋', '风抗穿透'), m, 1);
      m.state.throughTurn = m.state.turn + (m.checkSoul(2)? 1: 2);
    }});
  }
  getAttributes() {
    const m = this.member;
    return (m.checkES('潜龙') && m.checkHp(50))? {hate:-50 }: {};
  }
  getAttributesT(target) {
    const m = this.member;
    const data = {};
    if(m.checkES('罡风' && target.findBuff({tag:'减速'}))) data.bonusNA = 40;
    if(m.checkSoul(1) && target.checkHp(50, true)) data.criRate = 12;
    return data;
  }
}

class SrDanHeng extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffSpeedRate, [Buff.simpleListener()],'',{
        speedRate: this.checkSoul(6)? 20 : 12,
        name: '减速', source:'战技', maxValue: 1
      }),
      Buff.getListJson(this, BuffThrough, [Buff.eventListener('C_ATK_E', 'self')]),
      Buff.getListJson(this, BuffDanHeng),
      Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: 40, name: '破敌锋芒', source:'秘技', maxValue: 1
      }),
    ];
    if(this.checkES('绝影')){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 20, name: '绝影', source: '天赋',  maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    const { rate, rateBonus } = this.skillData.us;
    const buff = target.findBuff({tag:'减速'});
    const usRate = rate + (buff?rateBonus:0);
    this.actionAttack(cb=>cb(), 'US', target, 'single', 5, ()=>{return { brkDmg:3, raw: this.getAttr('atk') * usRate * 0.01}}, baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '破敌锋芒'), this, 1, { count: 3 });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated)this.onSP();
    } else if(e==='C_HIT_E') {
      if(D.checkType(data.type, 'NS') && data.isCri) {
        this.addBuffRandom(Buff.getKey(this.name, '战技', '减速'), data.target, 1, { count: 2 }, 1, 1, true);
      }
    } else if(e==='C_DMG_E') {
      if(this.checkES('绝影') && Math.random()<0.5) this.addBuff(Buff.getKey(this.name, '天赋', '绝影'), this, 1, { count: 2 });
    } else if(e==='C_KILL') {
      if(this.checkSoul(4) && D.checkType(data.type, 'US')) this.changeWaitTime(-100, true);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const hasBuff = enemy.findBuff({tag:'减速'})!==null;
    const usRate = us.rate + (hasBuff?us.rateBonus:0);

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Wind', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg:brkDmg*2, hitRate: C.calHitRate(1, this, enemy, 1, true)}, C.calDmg(base * ns.rate, ['Wind', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * usRate, ['Wind', 'US'], this, enemy)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrDanHeng,
};