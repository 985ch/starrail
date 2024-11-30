'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDefRate } = require('../debuff_simple');

const baseData = {
  name: '黑天鹅',
  image: 'blackswan.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Wind',
  damages: ['DOT','US'],
  needAttrs: [{raw:'hit', tar:['bonusAll'], range:[0,120]}],
  hp: D.levelData['147_1086'],
  atk: D.levelData['89_659'],
  def: D.levelData['66_485'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 130,
  na: D.makeTable([['rate','chance'],[30,50],[36,53],[42,56],[48,59],[54,62],[60,65],[66,68],[72,71],[78,74]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([
    ['rate','defDown'],
    [45,14.8],
    [49.5,15.4],
    [54,16],
    [58.5,16.6],
    [63,17.2],
    [67.5,17.8],
    [73.12,18.55],
    [78.75,19.3],
    [84.38,20.05],
    [90,20.8],
    [94.5,21.4],
    [99,22],
    [103.5,22.6],
    [108,23.2],
    [112.5,23.8],
  ]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([
    ['rateC','chance','ratePlus','rateD'],
    [96,50,4.8,72],
    [111.84,51.5,5.59,83.88],
    [127.68,53,6.38,95.76],
    [143.52,54.5,7.18,107.64],
    [159.36,56,7.97,119.52],
    [175.2,57.5,8.76,131.4],
    [189.6,59.38,9.48,142.2],
    [204,61.25,10.2,153],
    [222,63.12,11.1,166.5],
    [240,65,12,180],
    [252,66.5,12.6,189],
    [264,68,13.2,198],
    [276,69.5,13.8,207],
    [288,71,14.4,216],
    [300,72.5,15,225],
  ]),
  psHits: [1],
  psSoul: 3,
  us: D.makeTable([['rate', 'weakAll'],[72,15],[76.8,16],[81.6,17],[86.4,18],[91.2,19],[96,20],[102,21.25],[108,22.5],[114,23.75],[120,25],[124.8,26],[129.6,27],[134.4,28],[139.2,29],[144,30]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '脏中躁动', '杯底端倪', '烛影朕兆' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { bonusWind: 3.2 }, { bonusWind: 4.8 }, { bonusWind: 6.4 }, { hit: 4.0 }, { hit: 6.0 },
  ],
  defaultJson: {
    weapon:'重塑时光之忆', name4: '幽锁深牢的系囚', name2: '苍穹战线格拉默',
    body: 'hit', foot: 'speed', link:'atkRate', ball:'bonusWind',
  },
  ai:{
    na:ai.na_buff_noT("黑天鹅$天赋$奥迹."),
    ns:ai.ns_buff_noT("黑天鹅$战技$减防."),
    us:ai.us_always,
  },
  equipSetting: {
    rule: 'dmgDOT',
    attrs: {
      hit:[1000, 0, 120],
    },
    main: {
      body: 'hit',
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusWind',
    },
    set4: ['幽锁深牢的系囚', '幽锁深牢的系囚'],
    set2: '泛银河商业公司',
  },
};
const buffPSKey = Buff.getKey(baseData.name, '天赋', '奥迹');
const buffUSKey = Buff.getKey(baseData.name, '终结技', '揭露')

class BuffBlackSwan extends Buff {
  static info() {
    return {
      name: '黑天鹅',
      short: '黑天鹅',
      source: '天赋',
      desc:'黑天鹅监控事件处理用buff',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'B_HIT_S', t:'enemies', f:(buff, unit, data)=>{
      if(!D.checkType(data.type, 'DOT')) return;
      if(unit.checkMyTurn(false)) {
        m.addOJ(unit, 1, m.skillData.ps.chance);
      }
      if(m.checkES('杯底端倪') && unit.state.blackSwanOJenable && unit.state.blackSwanOJcount<3 && m.addOJ(unit, 1, 0.65)) {
        unit.state.blackSwanOJcount++;
      }
    }});
    if(m.checkES('杯底端倪')){
      this.listen({e:['BTL_S','REBORN'], t:'enemies', f:(buff, unit, data)=>{
        m.addOJ(unit, 1, 0.65);
      }})
      this.listen({e:'B_DMG_S', t:'enemies', f:(buff, unit, data)=>{
        unit.state.blackSwanOJcount = 0;
        unit.state.blackSwanOJenable = 1;
      }})
      this.listen({e:'B_DMG_E', t: 'enemies', f:(buff, unit, data)=>{
        unit.state.blackSwanOJenable = 0;
      }})
    }
    if(m.checkSoul(6)) this.listen({e:'B_DMG_S', t:'enemies', f:(buff, unit, data)=>{
      if(data.member===m || data.member.faction!=='members') return;
      m.addOJ(unit, 1, 0.65);
    }})
  }
  getAttributesT(target) {
    if(!this.member.checkSoul(1)) return {};
    const dotTypes = this.member.checkDots(target);
    const data = {};
    for(let key in dotTypes) {
      if(dotTypes[key]) data['defend'+key] = -25;
    }
    return data;
  }
}

class BuffOJ extends Buff {
  static info(data) {
    const tags = ['debuff', 'dot', '奥迹'].concat(data.hasJL? ['风化','灼烧','裂伤','触电']:[]);
    return {
      name: '奥迹',
      short: '奥迹',
      source: '天赋',
      desc:'每回合受到伤害，根据层数有额外效果',
      show: true,
      maxValue: 50,
      target: 'enemy',
      tags,
    };
  }
  getDesc() {
    const { damage, damageD } = this.getData();
    return `回合开始时受到${Math.floor(damage)}点伤害${ damageD>0? `，对相邻目标造成${Math.floor(damageD)}点伤害`:''}${this.data.hasJL?'，本状态可同时视为风化、裂伤、触电、灼烧': ''}。`
  }
  init() {
    const m = this.member;
    this.id = Math.floor(Math.random()*30000);
    const usBuff = this.target.findBuff({key: buffUSKey})
    if(usBuff)this.data.hasJL = true;
    if(m.team.battleMode && this.value<50 && m.checkSoul(6)) this.value += 1;

    this.listen({e:'TURN_S', t:'enemy', f:(buff, unit, data)=>{
      this.triggerDot('DOT', 1, { noCrit:true })
      const usb = unit.findBuff({key: buffUSKey})
      if(usb && usb.state.noReset) {
        usb.state.noReset = false;
      } else {
        const usp = unit.findBuff({key: buffPSKey})
        if(!usp) return;
        usp.value = 1;
        usp.markTargets();
      }
    }});
    if(m.checkSoul(2)) this.listen({e:'B_KILL', t:'enemy', f:(buff,unit,data)=>{
      const targets = A.getTargets(m, 'adj', unit);
      for(let t of targets) {
        m.addOJ(t, 6, 1);
      }
    }});
  }
  triggerDot(type, percent, options={}) {
    const m = this.member;
    const t = this.target;
    const targets = A.getTargets(m, 'diff', t);
    const { damage, damageD } = this.getData();
    //console.log('奥迹:'+this.value);
    A.newAddDmg(m, m, targets, damage * percent, true, 'Wind', 'DOT', options, (types, member, target)=>{
      const dmg = target === targets[0]? damage: damageD;
      return { damage: dmg, expDamage: dmg, criDamage: dmg };
    });
  }
  stack(sameBuff) {
    this.value = Math.max(0, Math.min(sameBuff.value + this.value, 50));
    this.data.hasJL = sameBuff.data.hasJL;
  }
  getData() {
    return this.member.calDamageOJ(this.value, this.target);
  }
}

class BuffJL extends Buff {
  static info(data) {
    return {
      name: '揭露',
      short: '揭露',
      source: '终结技',
      desc:'自身回合内受到伤害提高，奥迹状态可视为多种持续伤害状态',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '揭露'],
    };
  }
  getDesc() {
    const { dodge, en } = this.getData();
    return `自身回合内承伤提高${D.toPercent(this.member.skillData.us.weakAll)}${dodge<0?'，抵抗降低10%':''}${en>0?'，回合开始或被消灭时给黑天鹅回复8点能量，':''}。`
  }
  init() {
    const m = this.member;
    this.state.addEn = true;
    this.state.noReset = true;
    const psBuff = this.target.findBuff({key: buffPSKey});
    if(psBuff){
      psBuff.data.hasJL = true;
    }
    if(m.checkSoul(4))this.listen({e:['TURN_S','B_KILL'], t:'enemy', f:(buff)=>{
      m.addEn(8);
      buff.state.addEn = false;
    }})
  }
  getAttributesT() {
    const t = this.target;
    const { dodge } = this.getData();
    if(t.checkMyTurn(false)) {
      return { dodge, weakAll: this.member.skillData.us.weakAll }
    }
    return {dodge};
  }
  beforeRemove() {
    const psBuff = this.target.findBuff({key: buffPSKey})
    if(psBuff)psBuff.data.hasJL = false;
  }
  getData() {
    if(this.member.checkSoul(4)) {
      return { dodge: -10, en: this.state.addEn? 8: 0}
    }
    return {dodge: 0, en: 0};
  }
}

class BuffDmg extends Buff {
  static info() {
    return {
      name: '烛影朕兆',
      short: '增伤',
      source: '天赋',
      desc: '基于效果命中提高自身伤害',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const bonusAll = Math.min(72, this.member.attr.data.hit * 0.6);
    return `伤害提高${D.toPercent(bonusAll)}。`
  }
  getTransAttr() {
    return {
      bonusAll: { raw:'hit', rate:0.6, max: 72 }
    };
  }
}

class SsrBlackSwan extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffBlackSwan),
      Buff.getListJson(this, BuffOJ, [], '', {hasJL:false}),
      Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()],'',{
        defDown: this.skillData.ns.defDown, name: '减防', source:'战技', maxValue: 1, target:'enemy',
      }),
      Buff.getListJson(this, BuffJL, [Buff.simpleListener()]),
    ];
    if(this.checkES('烛影朕兆'))list.push(Buff.getListJson(this, BuffDmg));
    return list;
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
  castNA(target) {
    super.castNA(target, 'atk', cb=>{
      cb();
      const hit = this.skillData.na.chance*0.01;
      this.addOJ(target, 1, hit);
      const dots = this.checkDots(target);
      for(let key in dots) {
        if(dots[key])this.addOJ(target, 1, hit);
      }
    });
  }
  castNS(target) {
    super.castNS(target);
    const targets = A.getTargets(this, 'diff', target);
    this.actionAttack(cb=>{
      cb();
      for(let t of targets) {
        this.addBuffRandom(Buff.getKey(this.name, '战技', '减防'), t, 1, {count:3}, 1, 1)
      }
      if(this.checkES('脏中躁动')) {
        const dots = this.checkDots(target);
        for(let key in dots) {
          if(dots[key])this.addOJ(target, 1, 0.65);
        }
      }
    },'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rate','rate'), this.base.nsHits, this.base.nsHits);
    
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      const targets = A.getTargets(this, 'all', target);
      targets.forEach(t => this.addBuff(buffUSKey, t, 1, {count:2}));
      cb();
    }, 'US', target, 'all', 5, this.rawFunc(2,'us','rate'), this.base.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    const enemies = this.team.getAliveUnits('enemies');
    enemies.forEach(t => {
      let chance = 1.5;
      let value = 0;
      while(Math.random()*100 < C.calHitRate(chance, this, t, 1, false, true)){
        value ++;
        chance *= 0.5;
      }
      if(value>0) this.addBuff(buffPSKey, t, value, {count: 1});
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  addOJ(target, value, hit) {
    //console.log('叠奥迹', value);
    if(!target || !target.checkAlive()) return;
    this.addBuffRandom(buffPSKey, target, value, {count: 1}, hit, 1, false, true);
  }
  calDamageOJ(val, target) {
    const ps = this.skillData.ps;
    const { damage } = C.calDmg(this.getAttr('atk')*0.01, ['Wind', 'DOT'], this, target, {}, { defThrough: val>=7? 20: 0 });
    return {
      damage: damage * (ps.rateC + val * ps.ratePlus),
      damageD: val>=3? damage * ps.rateD: 0,
    }
  }
  checkDots(enemy) {
    const allDots = enemy.filterBuffs({tag:'dot'});
    const dotTypes = [['Fire','灼烧'],['Wind','风化'],['Physical','裂伤'],['Thunder','触电']];
    const result = {};
    for(let i=0;i<dotTypes.length;i++) {
      const [ key, tag ] = dotTypes[i];
      if(enemy.findBuff({ tag }, allDots)) result[key] = true;
    }
    return result;
  }
  calOJHitRate(chance, target){
    return C.calHitRate(chance*0.01, this, target, 1, false, true);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const oj = C.calDmg(base, ['Wind', 'DOT'], this, enemy);
    const ojEx = C.calDmg(base, ['Wind', 'DOT'], this, enemy, {}, { defThrough: 20 });

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg, hitRate: this.calOJHitRate(na.chance, enemy)}, C.calDmg(base * na.rate, ['Wind', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', tip:`中心削韧${(brkDmg*2).toFixed(1)}，两侧削韧${brkDmg.toFixed(1)}。`, hitRate: C.calHitRate(1, this, enemy)}, C.calDmg(base * ns.rate, ['Wind', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rate, ['Wind', 'US'], this, enemy)),
      Object.assign({ type:'dot', name:'奥迹[指定目标][1]', damage: oj.damage*(ps.rateC + ps.ratePlus), turn: 0, totalDamage: 0 }),
      Object.assign({ type:'dot', name:'奥迹[相邻目标][3+]', damage: oj.damage*ps.rateD, turn: 0, totalDamage: 0 }),
      Object.assign({ type:'dot', name:'奥迹[指定目标][7]', damage: ojEx.damage*(ps.rateC + ps.ratePlus * 7), turn: 0, totalDamage: 0 }),
      Object.assign({ type:'dot', name:'奥迹[相邻目标][7+]', damage: ojEx.damage*ps.rateD, turn: 0, totalDamage: 0 }),
      Object.assign({ type:'dot', name:'奥迹[指定目标][50]', damage: ojEx.damage*(ps.rateC + ps.ratePlus * 50), turn: 0, totalDamage: 0 }),
      {
        type:'hit', name: '奥迹命中率', labels:['天赋命中', '65%基础', '100%基础'],
        hit0: this.calOJHitRate(ps.chance, enemy),
        hit1: this.calOJHitRate(65,enemy),
        hit2: this.calOJHitRate(100, enemy)
      },
      {
        type:'hit', name: '秘技命中率', labels:['第1次', '第2次', '第3次', '第4次'],
        hit0: this.calOJHitRate(150,enemy),
        hit1: this.calOJHitRate(75, enemy),
        hit2: this.calOJHitRate(37.5, enemy),
        hit3: this.calOJHitRate(18.75, enemy),
      },
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
  getEnergyReport() {
    const list = R.getEnergyReport(this);
    if(!this.checkSoul(4)) return list;
    list.push({
      type:'energy', name:'揭露回能', tip:'每目标最多一次', labels:['回能'], en0: C.calEnergy(8, this)
    })
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrBlackSwan,
};