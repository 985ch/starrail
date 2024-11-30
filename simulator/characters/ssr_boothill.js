'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBreakRate, BuffDefThrough } = require('../buff_simple');
const { DebuffWeakTmp } = require('../debuff_simple');

const baseData = {
  name: '波提欧',
  image: 'boothill.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Physical',
  hp: D.levelData['163_1203'],
  atk: D.levelData['84_620'],
  def: D.levelData['59_436'],
  speed: 107,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 115,
  na: D.makeTable([['rate','ratePlus'],[50,110],[60,132],[70,154],[80,176],[90,198],[100,220],[110,242],[120,264],[130,286]]),
  naHits: [1],
  naHitsPlus: [1],
  naSoul: 3,
  ns: D.makeTable([['weakAll'],[15],[16.5],[18],[19.5],[21],[22.5],[24.37],[26.25],[28.12],[30],[31.5],[33],[34.5],[36],[37.5]]),
  nsTarget: 'enemy',
  nsSoul: 5,
  ps: D.makeTable([
    ["rate1","rate2","rate3"],
    [35,60,85],
    [38.5,66,93.5],
    [42,72,102],
    [45.5,78,110.5],
    [49,84,119],
    [52.5,90,127.5],
    [56.87,97.5,138.13],
    [61.25,105,148.75],
    [65.62,112.5,159.38],
    [70,120,170],
    [73.5,126,178.5],
    [77,132,187],
    [80.5,138,195.5],
    [84,144,204],
    [87.5,150,212.5]
  ]),
  psSoul: 5,
  us: D.makeTable([["rate","late"],[240,30],[256,31],[272,32],[288,33],[304,34],[320,35],[340,36.25],[360,37.5],[380,38.75],[400,40],[416,41],[432,42],[448,43],[464,44],[480,45]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: [ '幽灵装填', '蛇之上行', '抵近射击' ],
  attributes: [
    { breakRate: 5.3 }, { breakRate: 5.3 }, { breakRate: 8.0 }, { breakRate: 8.0 }, { breakRate: 10.7 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
  ],
  defaultJson: {
    weapon:'驶向第二次生命', name4: '流星追迹的怪盗', name2: '盗贼公国塔利亚',
    body: 'criRate', foot: 'speed', link:'breakRate', ball:'bonusPhysical',
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_always,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgBRK',
    main: {
      foot: 'speed',
      link: 'breakRate',
    },
  },
};
const debuffJMDZ = Buff.getKey(baseData.name, '战技', '绝命对峙', '敌');
const buffYSKD = Buff.getKey(baseData.name, '天赋', '优势口袋');

class DebuffJMDZ extends Buff {
  static info() {
    return {
      name: '绝命对峙',
      short: '对峙',
      source: '战技',
      desc: '只能攻击波提欧，且其与波提欧互相攻击时，双方均受到更高的伤害',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags:  ['嘲讽'],
    }
  }
  getDesc() {
    const {weakT, weakM} = this.getData();
    return `攻击时只能以波提欧为目标，波提欧受到该目标攻击时受到伤害提高${D.toPercent(weakM)}，该目标受到波提欧攻击时受到伤害提高${D.toPercent(weakT)}。`;
  }
  init() {
    const m = this.member;
    this.listen({e:'B_BREAK', t:'enemy', f:(buff, unit)=>{
      m.addYSKD();
      buff.state.count = 0;
    }});
    this.listen({e:'B_KILL', t:'enemy', f:(buff, unit)=>{
      m.addYSKD();
      buff.state.count = 0;
    }});
  }
  getAttributesB(target) {
    if(target!==this.member) return null;
    const { weakT } = this.getData();
    return { weakAll: weakT };
  }
  getData() {
    return this.member.getNSData();
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}
class BuffJMDZ extends Buff {
  static info() {
    return {
      name: '绝命对峙',
      short: '对峙',
      source: '战技',
      desc: '只能攻击对峙中的目标，且其与目标互相攻击时，双方均受到更高的伤害',
      show: true,
      maxValue: 0,
      target: 'self',
      tags:  [],
    }
  }
  getDesc() {
    const {weakT, weakM} = this.getData();
    const tar = this.member.getStateExData();
    return `攻击时只能以${tar? tar.name:'指定对象'}为目标，波提欧受到该目标攻击时受到伤害提高${D.toPercent(weakM)}，该目标受到波提欧攻击时受到伤害提高${D.toPercent(weakT)}。`;
  }
  getAttributesB(target) {
    const buff = this.member.findBuff({key:debuffJMDZ }, null, false);
    if(!buff) return null;
    const { weakM, damageRate } = this.getData();
    return target===buff.target? { weakAll: weakM }: { damageRate };
  }
  isActivated() {
    return this.member.findBuff({key:debuffJMDZ }, null, false)? true: false;
  }
  getData() {
    return this.member.getNSData();
  }
}
class BuffYSKD extends Buff {
  static info() {
    return {
      name: '优势口袋',
      short: '口袋',
      source: '天赋',
      desc: '强化普攻对破韧后的目标造成额外的击破伤害',
      show: true,
      maxValue: 3,
      target: 'self',
      tags:  [],
    }
  }
  init() {
    this.listen({e:'C_DMG_E', t:'self', f:(buff, unit, data)=>{
      if(!data.options.naPlus || !data.curTarget.findBuff({tag:'破韧'})) return;
      buff.member.triggerBonusBreak(data.curTarget, buff.value);
    }})
  }
}
class BuffCrit extends Buff {
  static info() {
    return {
      name: '幽灵装填',
      short: '双暴',
      source: '天赋',
      desc: '双暴根据角色击破特攻增加',
      show: true,
      maxValue: 0,
      target: 'self',
      tags:  ['buff','暴击','暴伤'],
    }
  }
  getDesc() {
    const breakRate = Math.min(300, this.member.buffedAttr.data.breakRate);
    return `暴击提高${D.toPercent(breakRate*0.1)}，暴伤提高${D.toPercent(breakRate*0.5)}。`;
  }
  getTransAttr() {
    return {
      criRate: { raw:'breakRate', rate:0.1, max:30 },
      criDamage: { raw:'breakRate', rate:0.5, max:150},
    }
  }
}

class SsrBoothill extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffJMDZ, [Buff.eventListener('TURN_S','self')], '敌'),
      Buff.getListJson(this, BuffJMDZ, [], '我'),
      Buff.getListJson(this, BuffYSKD),
      Buff.getListJson(this, DebuffWeakTmp,[Buff.simpleListener()], '', { weak:'Physical', source:'终结技', noDefendDown: true, target:'enemy'}),
    ];
    if(this.checkES('幽灵装填')){
      list.push(Buff.getListJson(this, BuffCrit));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffDefThrough, [], '', {
        defThrough: 16, name: '扬尘孤星', source: '星魂',  maxValue: 0, hide: true,
      }));
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffBreakRate, [Buff.simpleListener()], '', {
        breakRate: 30, name: '里程碑贩子', source: '星魂',  maxValue: 1,
      }));
    }
    return list;
  }
  getStateExText() {
    const tar = this.getStateExData();
    return tar?`对峙:${tar.name}`: '非对峙状态';
  }
  getStateExData() {
    const buff = this.findBuff({key:debuffJMDZ}, null, false);
    return buff? buff.target: null;
  }
  updateReport(enemy){
    const tar = this.getStateExData();
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, tar),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    const tar = this.getStateExData();
    if(!tar)return super.castNA(target);
    const buff = this.findBuff({key: buffYSKD});
    const hits = this.base.naHitsPlus;
    const brkDmg = 2*(1 + (buff? buff.value*0.5: 0));
    this.actionAttack(cb=>cb(), 'NA', tar, 'single', 30, this.rawFunc(brkDmg, 'na', 'ratePlus'), hits, null, { naPlus: true });
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target, keepTurn:true}, ()=>{
      this.addBuff(debuffJMDZ, target, 1, { count: 2 });
      if(this.state.spActivated) this.addBuff(Buff.getKey(this.name, '终结技','物理属性弱点'), target, 1, { count: 2});
    });
    this.state.spActivated = false;
  }
  checkDisableNS() {
    return super.checkDisableNS() || this.getStateExData()!==null;
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addBuff(Buff.getKey(this.name, '终结技','物理属性弱点'), target, 1, { count: 2});
      cb();
      if(target.checkAlive())target.changeWaitTime(this.skillData.us.late);
    },'US', target, 'single', 5, this.rawFunc(3, 'us') , baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  getNSData() {
    const bonus = this.checkSoul(4)? 12: 0;
    const weakM = 15 - bonus;
    const weakT = this.skillData.ns.weakAll + bonus;
    const damageRate = this.checkES('蛇之上行')? 0.7: 1;
    return { weakM, weakT, damageRate };
  }
  addYSKD() {
    this.addBuff(buffYSKD, this, 1, { count: 1});
    if(this.checkES('抵近射击'))this.addEn(10);
    if(this.updateCD(1, 'soul2CD')) {
      this.changeSp(1);
      if(this.checkSoul(2))this.addBuff(Buff.getKey(this.name, '星魂','里程碑贩子'), this, 1, { count: 2 })
    }
  }
  triggerBonusBreak(enemy, bonusCount) {
    const dmgInfo = this.getBreakDamage(enemy, { maxShield: 16 });
    const rate = this.skillData.ps['rate'+bonusCount] * 0.01;
    const damage = rate * dmgInfo.damage;

    if(this.checkSoul(6)) {
      const targets = A.getTargets(this, 'diff', enemy);
      A.newAddDmg(this, this, targets, damage, false, 'Physical', 'BRK', {}, (types, member, target)=>{
        const dmg = (target === targets[0])? damage * 1.4: damage * 0.7;
        return { damage: dmg, expDamage: dmg };
      });
    } else {
      A.newAddDmg(this, this, [enemy], damage, false, this.base.type, 'BRK', {}, ()=>{
        return { damage, expDamage: damage };
      });
    }
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S' && this.checkSoul(1)) {
      this.addBuff(buffYSKD, this, 1, {});
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy, tar) {
    const type = baseData.type;
    const { na, ns, us, ps } = this.skillData;
    const base = this.getAttr('atk')*0.01;

    const weakFixed = ns.weakAll + (this.checkSoul(4)? 12: 0);
    const brokenFixed = enemy.findBuff({ tag: '破韧'})? 1: 0.9;
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const buff = this.findBuff({key: buffYSKD});
    const brkRate = 2*(1 + (buff? buff.value*0.5: 0));
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [type, 'NA'], this, enemy, null, { weak: tar && tar===enemy? -weakFixed: 0 })),
      Object.assign({ type: 'damage', name:'强化普攻', brkDmg: brkDmg * brkRate}, C.calDmg(base * na.ratePlus, [type, 'NA'], this, enemy, null, { weak: tar && tar===enemy? 0: weakFixed })),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, [type, 'US'], this, enemy)),
      R.getBreakReport(this, enemy),
    ]

    const dmgInfo = this.getBreakDamage(enemy, { maxShield: 16 });
    for(let i=1;i<=3;i++) {
      const damage = ps['rate'+i] * 0.01 * dmgInfo.damage / brokenFixed;
      if(this.checkSoul(6)) {
        list.push({
          type: 'damage', name: '追加击破' + i + '(中心)',
          damage: damage*1.4, expDamage: damage*1.4,
          tip: '优势口袋叠'+i+'层(主目标)',
        });
        list.push({
          type: 'damage', name: '追加击破' + i + '(扩散)',
          damage: damage*0.7, expDamage: damage*0.7,
          tip: '优势口袋叠'+i+'层(扩散目标)',
        });
      } else {
        const damage = ps['rate'+i] * 0.01 * dmgInfo.damage / brokenFixed;
        list.push({
          type: 'damage', name: '追加击破' + i,
          damage, expDamage: damage,
          tip: '优势口袋叠'+i+'层',
        });
      }
    }
    return list;
  }
  getEnergyReport() {
    const other ={
      type: 'energy',
      name: '其他回能',
      labels: ['击杀回能'],
      en0: C.calEnergy(10, this),
    };
    if(this.checkES('抵近射击')) {
      other.labels.push('抵近射击');
      other.en1= C.calEnergy(10, this);
    }
    return [{
      type:'energy', name:'行动回能', labels: ['普攻', '强化普攻', '终结技'],
      en0: C.calEnergy(20, this),
      en1: C.calEnergy(30, this),
      en2: C.calEnergy(5, this),
    }, other];
  }
}

module.exports = {
  data: baseData,
  character: SsrBoothill,
};