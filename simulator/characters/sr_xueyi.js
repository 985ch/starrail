'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffBreakRate } = require('../buff_simple');

const baseData = {
  name: '雪衣',
  image: 'xueyi.jpg',
  rarity: 'SR',
  job: '毁灭',
  type: 'Quantum',
  damages: ['AA','US'],
  needAttrs: [{raw:'breakRate', tar:['bonusAll'], range:[0,240] }],
  hp: D.levelData['144_1058'],
  atk: D.levelData['81_599'],
  def: D.levelData['54_396'],
  speed: 103,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [0.4,0.6],
  naSoul: 3,
  ns: D.makeTable([
    ['rateC', 'rateD'],
    [ 70, 35 ],
    [ 77, 38.5 ],
    [ 84, 42 ],
    [ 91, 45.5 ],
    [ 98, 49 ],
    [ 105, 52.5 ],
    [ 113.75, 56.88],
    [ 122.5, 61.25],
    [ 131.25, 65.63],
    [ 140, 70],
    [ 147, 73.5],
    [ 154, 77],
    [ 161, 80.5],
    [ 168, 84],
    [ 175, 87.5],
  ]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 3,
  ps: D.makeTable([['rate'],[45], [49.5], [54], [58.5], [63], [67.5], [73.13], [78.75], [84.38], [90],[94.5],[99],[103.5],[108],[112.5]]),
  psSoul: 5,
  us: D.makeTable([['rate', 'bonusUS'],[150,36],[160,38.4],[170,40.8],[180,43.2],[190,45.6],[200,48],[212.5,51],[225,54],[237.5,57],[250,60],[260,62.4],[270,64.8],[280,67.2],[290,69.6],[300,72]]),
  usTarget: 'enemy',
  usHits: [1], 
  usSoul: 5,
  es: [ '预兆机杼', '摧锋轴承', '	伺观中枢' ],
  attributes: [
    { breakRate: 5.3 }, { breakRate: 5.3 }, { breakRate: 8.0 }, { breakRate: 8.0 }, { breakRate: 10.7 },
    { bonusQuantum: 3.2 }, { bonusQuantum: 4.8 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'记一位星神的陨落', name4: '繁星璀璨的天才', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'breakRate', ball:'bonusQuantum',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai:{
    na: ai.na_breaker('弱量子'),
    ns: {
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","gt",1,"yes"]},{t:"buff",v:["t","tag","弱量子","gt",0]},{t:"shield",v:["gt",1]}],
        [{t:"target",v:["selected"]},{t:"sp",v:["gt",1]}]
      ]
    },
    us: {
      disable:false,
      rules:[[{t:"target",v:["shield","min","gt",0,"no"]}]]
    }
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'breakRate',
      ball: 'bonusQuantum',
    },
    set2: '停转的萨尔索图'
  },
};

class BuffUsBonus extends Buff {
  static info() {
    return {
      name: '天罚贯身',
      short: '增伤',
      source: '终结技',
      desc: '终结技伤害增加，增加幅度由削韧值决定',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusUS'],
    }
  }
  getDesc(target, enemy) {
    if(!enemy) return super.getDesc();
    return `终结技伤害提高${D.toPercent(this.getData(enemy))}。`;
  }
  getAttributesT(target) {
    return { bonusUS: this.getData(target)};
  }
  getData(target) {
    return this.member.countUsBonus(target);
  }
}
class BuffXueyi extends Buff {
  static info() {
    return {
      name: '雪衣天赋',
      short: '雪衣',
      source: '天赋',
      desc: '监控雪衣天赋效果',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'C_BRKDMG', t:'members', f:(buff, unit, data)=>{
      if(data.options && data.options.flag==='恶报') return;
      const val = Math.min(data.shield, data.brkDmg);
      if(val <=0) return;
      if(unit===m) {
        m.addBrkValue(val);
      } else if(!unit.state['雪衣天赋']){
        m.addBrkValue(1);
        unit.state['雪衣天赋'] = 1;
      }
    }});
    this.listen({e:'C_DMG_S', t:'members', f:(buff, unit, data)=>{
      if(unit!==m) unit.state['雪衣天赋'] = 0;
    }})
  }
}
class BuffDamageX extends Buff {
  static info() {
    return {
      name: '预兆机杼',
      short: '增伤',
      source: '天赋',
      desc: '伤害增加，增加幅度由击破特攻决定',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  getTransAttr() {
    return {
      bonusAll: { raw:'breakRate', rate:1, max: 240 }
    };
  }
}

class SrXueyi extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffUsBonus, [Buff.eventListener('C_DMG_E','self')]),
      Buff.getListJson(this, BuffXueyi),
    ];
    if(this.checkES('预兆机杼')){
      list.push(Buff.getListJson(this, BuffDamageX));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffDamage, [Buff.eventListener('C_DMG_E','self')], '', {
        bonusAll: 40, name: '缚心魔', source:'星魂', maxValue: 1, target:'self',
      }));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffBreakRate, [Buff.simpleListener()], '', {
        breakRate: 40, name: '断业根', source:'星魂', maxValue: 1, target:'self',
      }));
    }
    return list;
  }
  getStateExText() {
    return `恶报:${this.getStateExData()}`;
  }
  getStateExData() {
    return Math.floor(this.state.psCount || 0);
  }
  updateReport(enemy){
    const options = {others:[['追加攻击', 2]]};
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, options),
        ...R.getActionReport(this),
        ...this.getDefendReport(enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'diff', 30, this.rawDiffFunc(2, 1,'ns','rateC','rateD'), baseData.nsHits, baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addBuff(Buff.getKey(this.name, '终结技', '天罚贯身'), this, 1, {}, false, true);
      if(this.checkSoul(4))this.addBuff(Buff.getKey(this.name, '星魂', '断业根'), this, 1, {count:2});
      cb();
    }, 'US', target, 'single', 5, this.rawFunc(4, 'us'), baseData.usHits, null, {forceBreak: 1});
  }
  castSP() {
    super.castSP(()=> A.startBattleDmg(this, 2, this.rawFuncRate(0, 80)));
  }
  addBrkValue(val) {
    const count = (this.state.psCount || 0) + val;
    const maxCount = this.checkSoul(6)? 6 : 8;
    if(count >= maxCount) {
      if(this.checkSoul(2))this.triggerHeal([this], this.getAttr('hp')*0.05);
      this.castAdditionAttack(D.sample(this.team.getAliveUnits('enemies')), 'random', 2, this.rawFunc(0.5, 'ps'), 3, null, { flag:'恶报', forceBreak:this.checkSoul(2)? 1: 0});
      this.state.psCount = this.checkES('伺观中枢')? Math.min(6, count - maxCount) : 0;
    } else {
      this.state.psCount = count;
    }
  }
  countUsBonus(target) {
    const shield = target.state.shield || 0;
    const val = Math.min(shield, 4);
    const bonus = (this.checkES('摧锋轴承') && shield - target.shield*0.5 > -0.005)? 10: 0;
    return bonus  + val/4 * this.skillData.us.bonusUS;
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_ATK_S') {
      if(this.checkSoul(1) && data.options && data.options.flag==='恶报') {
        this.addBuff(Buff.getKey(this.name, '星魂', '缚心魔'), this, 1)
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const usBonus = this.findBuff({key:Buff.getKey(this.name, '终结技', '天罚贯身')})? 0 : this.countUsBonus(enemy);
    const aaBonus = !this.checkSoul(1) || this.findBuff({key:Buff.getKey(this.name, '星魂', '缚心魔')})? 0: 40;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Quantum', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rateC, [ 'Quantum', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, [ 'Quantum', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*4}, C.calDmg(base * us.rate, [ 'Quantum', 'US' ], this, enemy, null, {bonus: usBonus})),
      Object.assign({ type: 'damage', name:'追击', brkDmg: brkDmg/2, tip:'弹射3次'}, C.calDmg(base * ps.rate, [ 'Quantum', 'AA' ], this, enemy, null, {bonus: aaBonus})),
      Object.assign({ type: 'damage', name:'秘技', brkDmg: brkDmg*2 }, C.calDmg(base * 80, [ 'Quantum', 'SP'], this, enemy))
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    if(this.checkSoul(2)) {
      list.push({ type:'heal', name:'天赋回血', labels: ['治疗量'], heal0: C.calHealData(this.getAttr('hp') * 0.05, this, this) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrXueyi,
};