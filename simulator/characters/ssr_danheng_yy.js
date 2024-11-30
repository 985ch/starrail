'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffCriDamage } = require('../buff_simple');

const baseData = {
  name: '丹恒•饮月',
  image: 'imbibitorlunae.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Void',
  damages: ['NA','US'],
  hp: D.levelData['168_1241'],
  atk: D.levelData['95_698'],
  def: D.levelData['49_363'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 140,
  na: D.makeTable([
    ['rate', 'rate1', 'rate2', 'rate2D', 'rate3', 'rate3D'],
    [50, 130, 190, 30, 250, 90],
    [60, 156, 228, 36, 300, 108],
    [70, 182, 266, 42, 350, 126],
    [80, 208, 304, 48, 400, 144],
    [90, 234, 342, 54, 450, 162],
    [100, 260, 380, 60, 500, 180],
    [110, 286, 418, 66, 550, 198],
  ]),
  naHits: [0.3, 0.7],
  naHits1: [0.33, 0.33, 0.34],
  naHits2: [0.2, 0.2, 0.2, 0.2, 0.2],
  naHits2D: [0, 0, 0, 0.5, 0.5],
  naHits3: [0.142, 0.142, 0.142, 0.142, 0.142, 0.142, 0.148],
  naHits3D: [0, 0, 0, 0.25, 0.25, 0.25, 0.25],
  naSoul: 3,
  ns: D.makeTable([['criDamage'], [6.0], [6.6], [7.2], [7.8], [8.4], [9.0], [9.7], [10.5], [11.2], [12.0], [12.6], [13.2]]),
  nsTarget: 'self',
  nsSoul: 3,
  ps: D.makeTable([['bonusAll'], [5.0], [5.5], [6.0], [6.5], [7.0], [7.5], [8.1], [8.7], [9.3], [10.0], [10.5], [11.0]]),
  psSoul: 5,
  us: D.makeTable([
    ['rateC', 'rateD'],
    [180, 84],
    [192, 89],
    [204, 95],
    [216, 100],
    [228, 106],
    [240, 112],
    [255, 119],
    [270, 126],
    [285, 133],
    [300, 140],
    [312, 145],
    [324, 151],
  ]),
  usTarget: 'enemy',
  usHits: [0.3, 0.3, 0.4], 
  usSoul: 5,
  es: ['伏辰', '修禹', '起蛰'],
  attributes: [
    {bonusVoid: 3.2}, {bonusVoid: 3.2}, {bonusVoid: 4.8}, {bonusVoid: 4.8}, {bonusVoid: 6.4},
    {hpRate: 4.0}, {hpRate: 6.0}, {criRate: 2.7}, {criRate: 4.0}, {criRate: 5.3},
  ],
  defaultJson: {
    weapon:'比阳光更明亮的', name4: '野穗伴行的快枪手', name2: '繁星竞技场',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusVoid',
  },
  aiLabels: [['na3','普3'],['na2','普2'],['na1','普1'],['us','终结技'],['na','普攻']],
  aiConditions: [{value:'c_danheng_yy',text:'逆鳞数量'}],
  ai: {
    na: ai.na_default,
    na1: { disable: true, rules: [] },
    na2: { disable: true, rules: [] },
    na3: { disable: false, rules: [] },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgNA',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusVoid',
    },
    set2: '繁星竞技场'
  },
};
const buffNsKey = Buff.getKey(baseData.name, '战技', '叱咤');
const buffPsKey = Buff.getKey(baseData.name, '天赋', '亢心');
const buffSoul6Key = Buff.getKey(baseData.name, '星魂', '虚数穿透');
class BuffThrough extends Buff {
  static info() {
    return {
      name: '虚数穿透',
      short: '虚穿',
      source: '星魂',
      desc:'虚数抗性穿透',
      show: true,
      maxValue: 3,
      target: 'self',
      tags: ['buff', 'throughVoid', '虚数穿透'],
    };
  }
  getDesc() {
    return `普攻MAX的虚数抗性穿透提高${20*this.value}%。`
  }
  getAttributes() {
    return { throughVoid: 20*this.value}
  }
}
class BuffCheckThrough extends Buff {
  static info() {
    return {
      name: '六魂效果',
      short: '六魂',
      source: '星魂',
      desc:'监听其他人开大',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'ACT_S', t:'members', f:(buff, unit, data)=> {
      if(unit !== m && D.checkType(data.type, 'US')) {
        m.state.throughCount = Math.min(3, (m.state.throughCount || 0) + 1);
      }
    }})
  }
}
class BuffCriDamageT extends Buff {
  static info() {
    return {
      name: '起蛰',
      short: '暴伤',
      source: '天赋',
      desc:'对弱虚数敌人暴伤提升',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    return target.findBuff({tag:'weakVoid'})? { criDamage: 24}: {};
  }
}

class SsrDanHengYY extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('修禹')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffCriDamage, [Buff.simpleListener(false)], '', {
        criDamage: this.skillData.ns.criDamage,
        name: '叱咤', source:'战技', maxValue: 4,
      }),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener(false)], '', {
        bonusAll: this.skillData.ps.bonusAll,
        name: '亢心', source: '天赋', maxValue: this.checkSoul(1)? 10: 6,
      })
    ];
    if(this.checkES('起蛰')){
      list.push(Buff.getListJson(this, BuffCriDamageT));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffThrough, [Buff.eventListener('C_DMG_E', 'self')]),
        Buff.getListJson(this, BuffCheckThrough));
    }
    return list;
  }
  getStateExText() {
    return '逆鳞:'+this.getStateExData();
  }
  getStateExData() {
    return this.state.spBonus || 0;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy).concat(this.checkES('修禹')?[
          { type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35.0) }
        ]:[]),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getBattleActions(isMyTurn) {
    return isMyTurn ? [{
      text: '普攻',
      key: 'na',
      target: 'enemy',
      disable: this.checkDisableNA(),
    },{
      text: '普攻+',
      key: 'na1',
      target: 'enemy',
      disable: this.checkDisableNA() || !this.checkSp(1),
    },{
        text: '普攻++',
        key: 'na2',
        target: 'enemy',
        disable: this.checkDisableNA() || !this.checkSp(2),
    },{
      text: '普攻MAX',
      key: 'na3',
      target: 'enemy',
      disable: this.checkDisableNA() || !this.checkSp(3),
    }] : [];
  }
  onAction(data) {
    const t = data.target;
    switch(data.key) {
      case 'na1':
        this.actionAttack(cb=>cb(), 'NA', t, 'single', 30, this.rawFunc(2, 'na', 'rate1'), this.base.naHits1);
        this.costSp(1);
        break;
      case 'na2':
        this.actionAttack(cb=>cb(), 'NA', t, 'diff', 35, this.rawDiffFunc(3, 1, 'na', 'rate2', 'rate2D'), this.base.naHits2, this.base.naHits2D);
        this.costSp(2);
        break;
      case 'na3':
        this.actionAttack(cb=>{
          if(this.state.throughCount) this.addBuff(Buff.getKey(this.name, '星魂', '虚数穿透'), this, this.state.throughCount);
          cb();
        },'NA', t, 'diff', 40, this.rawDiffFunc(4, 2, 'na', 'rate3', 'rate3D'), this.base.naHits3, this.base.naHits3D);
        this.costSp(3);
        this.state.throughCount = 0;
        break;
      default:
        break;
    }
    super.onAction(data);
  }
  checkSp(n) { return this.team.state.sp + (this.state.spBonus || 0) >= n; }
  costSp(n) {
    const bonusChange = Math.min(this.state.spBonus || 0, n);
    if(bonusChange>0) {
      this.state.spBonus -= bonusChange;
      n -= bonusChange;
    }
    if(n>0) this.changeSp(-n);
  }
  castUS(target){
    super.castUS(target);
    const hasSoul2 = this.checkSoul(2);
    this.actionAttack(cb=>cb(), 'US', target, 'diff', 5, this.rawDiffFunc(2, 1, 'us', 'rateC', 'rateD'), this.base.usHits, this.base.usHits);
    this.state.spBonus = Math.min((this.state.spBonus || 0) + (hasSoul2? 3: 2), 3);
    if(hasSoul2)this.changeWaitTime(-100, true);
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 120));
      this.state.spBonus = 1;
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    switch(e) {
      case 'BTL_S':
        if(this.checkES('伏辰')) this.addEn(15);
        break;
      case 'C_HIT_S':
        if(data.idxT===0 && data.idxH>=4 && D.checkType(data.type, 'NA')) {
          this.addBuff(buffNsKey, this, 1, {count: this.checkSoul(4)? 2: 1});
        }
        break;
      case 'C_HIT_E':
        if(data.idxT===data.idxMT && D.checkType(data.type, ['NA','US'])) {
          this.addBuff(buffPsKey, this, this.checkSoul(1)? 2: 1);
        }
        break;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, us } = this.skillData;
    
    const buffNs = this.findBuff({key:buffNsKey});
    const nsCount = buffNs? buffNs.value: 0;
    const buffPs = this.findBuff({key:buffPsKey});
    const psCount = buffPs? buffPs.value: 0;
    const buffSoul = this.findBuff({key:buffSoul6Key});
    const throughFix = buffSoul? -20*buffSoul.value: 0;
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      this.getDamageData('普攻', enemy, base*na.rate, brkDmg, 'NA', this.base.naHits, nsCount, psCount, throughFix),
      this.getDamageData('普攻+', enemy, base*na.rate1, brkDmg*2, 'NA', this.base.naHits1, nsCount, psCount, throughFix),
      this.getDamageData('普攻++[中心]', enemy, base*na.rate2, brkDmg*3, 'NA', this.base.naHits2, nsCount, psCount, throughFix),
      this.getDamageData('普攻++[扩散]', enemy, base*na.rate2D, brkDmg, 'NA', this.base.naHits2D, nsCount, psCount, throughFix),
      this.getDamageData('普攻MAX[中心]', enemy, base*na.rate3, brkDmg*4, 'NA', this.base.naHits3, nsCount, psCount, 0),
      this.getDamageData('普攻MAX[扩散]', enemy, base*na.rate3D, brkDmg*2, 'NA', this.base.naHits3D, nsCount, psCount, 0),
      this.getDamageData('终结技[中心]', enemy, base*us.rateC, brkDmg*2, 'US', this.base.usHits, nsCount, psCount, throughFix),
      this.getDamageData('终结技[扩散]', enemy, base*us.rateD, brkDmg*2, 'US', this.base.usHits, nsCount, psCount, throughFix),
      Object.assign({ type: 'damage', name:'秘技'}, C.calDmg(base*120, ['Void', 'SP'], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
  getDamageData(name, enemy, base, brkDmg, type, hits, nsCount, psCount, throughFix) {
    const data = { damage: 0, criDamage: 0, expDamage: 0}
    const {ps, ns} = this.skillData;
    const isUS = D.checkType(type,'US');
    let criDmgFix = (isUS || this.checkSoul(4))? 0 : -nsCount * ns.criDamage;
    const criDmgMax = (4 - nsCount) * ns.criDamage;
    let bonusAllFix = 0;
    const bonusAllMax = ((this.checkSoul(1)? 10: 6) - psCount) * ps.bonusAll;
    for(let i=0; i<hits.length; i++) {
      if(i>=4) criDmgFix = Math.min(criDmgMax, criDmgFix + ns.criDamage);
      const d = C.calDmg(base * hits[i], [ 'Void', type ], this, enemy, null, {
        criDmg: criDmgFix,
        bonus: bonusAllFix,
        defend: -throughFix,
      });
      data.damage += d.damage;
      data.criDamage += d.criDamage;
      data.expDamage += d.expDamage;
      bonusAllFix = Math.min(bonusAllMax, bonusAllFix + ps.bonusAll*(this.checkSoul(1)? 2: 1));
    }
    return Object.assign({type:'damage', name, brkDmg}, data);
  }
  getEnergyReport() {
    const list = [{
      type:'energy',
      name:'常规行动回能',
      labels: ['普攻', '终结技'],
      en0: C.calEnergy(20, this),
      en1: C.calEnergy(5, this),
    },{
      type:'energy',
      name:'强化普攻回能',
      labels: ['普攻+', '普攻++', '普攻MAX'],
      en0: C.calEnergy(30, this),
      en1: C.calEnergy(35, this),
      en2: C.calEnergy(40, this),
    },{
      type: 'energy',
      name: '其他回能',
      labels: ['击杀回能'],
      en0: C.calEnergy(10, this),
    }];
    if(this.checkES('伏辰')) {
      list[2].labels.push('进战回能');
      list[2].en1 = C.calEnergy(15, this);
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrDanHengYY,
};