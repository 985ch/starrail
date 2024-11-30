'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffAtkRate, DebuffDefRate, DebuffSpeedRate, DebuffDodge } = require('../debuff_simple');

const baseData = {
  name: '银狼',
  image: 'silver_wolf.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Quantum',
  hp: D.levelData['142_1047'],
  atk: D.levelData['87_640'],
  def: D.levelData['62_460'],
  speed: 107,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.25, 0.25, 0.5],
  naSoul: 5,
  ns: D.makeTable([
    ['hit', 'defendAll', 'rate'],
    [75, 7.5, 98],
    [76, 7.7, 107],
    [77, 8.0, 117],
    [78, 8.2, 127],
    [79, 8.5, 137],
    [80, 8.7, 147],
    [81, 9.0, 159],
    [82, 9.3, 171],
    [83, 9.6, 183],
    [85, 10.0, 196],
    [86, 10.2, 205],
    [87, 10.5, 215]
  ]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([
    ['atkRate', 'defDown', 'speedRate', 'hit'],
    [5.0, 4.0, 3.0, 60.0],
    [5.5, 4.4, 3.3, 61.0],
    [6.0, 4.8, 3.6, 62.0],
    [6.5, 5.2, 3.9, 63.0],
    [7.0, 5.6, 4.2, 64.0],
    [7.5, 6.0, 4.5, 66.0],
    [8.1, 6.5, 4.8, 67.0],
    [8.7, 7.0, 5.2, 69.0],
    [9.3, 7.5, 5.6, 70.0],
    [10.0, 8.0, 6.0, 72.0],
    [10.5, 8.4, 6.3, 73.0],
    [11.0, 8.8, 6.6, 74.0]
  ]),
  psSoul: 3,
  us: D.makeTable([
    ['hit', 'defDown', 'rate'],
    [85, 36, 228],
    [86, 36, 243],
    [88, 37, 258],
    [89, 38, 273],
    [91, 39, 288],
    [92, 40, 304],
    [94, 41, 323],
    [96, 42, 342],
    [98, 43, 361],
    [100, 45, 380],
    [101, 45, 395],
    [103, 46, 410]
  ]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '生成', '注入', '旁注' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { bonusQuantum: 3.2 }, { bonusQuantum: 4.8 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 8.0 },
  ],
  defaultJson: {
    weapon:'雨一直下', name4: '流星追迹的怪盗', name2: '泛银河商业公司',
    body: 'criRate', foot: 'speed', link:'enRate', ball:'bonusQuantum',
    atk: [0, 0, 1]
  },
  ai:{
    na: ai.na_default,
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["selected"]},{t:"buff",v:["t","key","银狼$战技$抗性降低.","no",0]}],
        [{t:"target",v:["selected"]},{t:"sp",v:["gt",2]}]
      ]
    },
    us:ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hit:[1000, 0, 90],
      speed:[30, 0, 99999],
    },
    main: {
      body: 'hit',
      foot: 'speed',
      link: 'enRate',
    },
  },
};

// 全抗性降低
class DebuffDefendAll extends Buff {
  static info() {
    return {
      name: '抗性降低',
      short: '减抗',
      source: '战技',
      desc: '全抗性降低',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '减抗'],
    };
  }
  getDesc() {
    return `全抗性降低${this.getData().toFixed(1)}%`;
  }
  getAttributes() {
    return { defendAll: -this.getData()}
  }
  getData() {
    const m = this.member;
    return m.skillData.ns.defendAll + (this.state.plus? 3: 0);
  }
}
// 增伤
class BuffBonusAll extends Buff {
  static info() {
    return {
      name: '重叠网络',
      short: '增伤',
      source: '星魂',
      desc: '根据对方负面效果增伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    const count = target.countBuffs( {tag:'debuff'}, 5);
    return { bonusAll: count*20 };
  }
}
// 监听击破事件
class BuffBreakListener extends Buff {
  static info() {
    return {
      name: '生成',
      short: '生成',
      source: '天赋',
      desc: '敌方弱点被击破时给其上负面效果',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.listen({e:'B_BREAK', t:'enemies', f:(buff, unit)=>this.member.randomDebuff(unit, 0.65)});
  }
}
// 临时弱点
class DebuffWeak extends Buff {
  static info(data) {
    const weak = data ? data.weak: 'Physical';
    const text = D.DamageTypeInfo[data.weak].text;
    return {
        name: text + '属性弱点',
        short: '弱点',
        source: '战技',
        desc: text + '属性弱点',
        show: true,
        maxValue: 1,
        target: 'enemy',
        tags: ['debuff','weak', 'weak' + weak],
    };
  }
  getAttributes(){
    return { ['defend' + this.data.weak]: -20 };
  }
  checkSameBuff(buff) {
    return this.constructor === buff.constructor && this.target===buff.target;
  }
}
// 抵抗降低
class SilverWolfListener extends Buff {
  static info() {
    return {
        name: '银狼',
        short: '银狼',
        source: '天赋',
        desc: '事件监听buff',
        show: false,
        maxValue: 0,
        target: 'self',
        tags:  [],
    };
  }
  init() {
    this.listen({ e: 'BTL_S', t:'enemies', f: (buff, unit, data)=>{
      this.member.addBuff(Buff.getKey(this.member.name, '星魂', '僵尸网络'), unit, 1, {});
    }});
  }
}

class SsrSilverWolf extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { atkRate, defDown, speedRate } = this.skillData.ps;
    const list = [
      Buff.getListJson(this, DebuffAtkRate, [Buff.simpleListener()], '', { atkRate, name: '减攻', source: '天赋', maxValue: 1, tags: ['debuff', '减攻', '缺陷'] }),
      Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()], '', { defDown, name: '减防', source: '天赋', maxValue: 1, tags: ['debuff', '减防', '缺陷']}),
      Buff.getListJson(this, DebuffSpeedRate, [Buff.simpleListener()], '', { speedRate, name: '减速', source: '天赋', maxValue: 1, tags: ['debuff', '减速', '缺陷'] }),
      Buff.getListJson(this, DebuffDefendAll, [Buff.simpleListener()]),
      Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()], '', { defDown: this.skillData.us.defDown, name: '减防', source: '终结技', maxValue: 1 }),
    ];
    this.getTeamAttrList().forEach(attr => {
      list.push(Buff.getListJson(this, DebuffWeak, [Buff.simpleListener()], attr, { weak:attr }))
    })
    if(this.checkES('生成')) list.push(Buff.getListJson(this, BuffBreakListener));
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, DebuffDodge, [], '', { dodge: 20, name:'僵尸网络', source: '星魂', target: 'enemy', maxValue: 1 }));
      list.push(Buff.getListJson(this, SilverWolfListener));
    }
    if(this.checkSoul(6)) list.push(Buff.getListJson(this, BuffBonusAll));
    return list;
  }
  updateData() {
    super.updateData();
    this.teamAttrList = this.getTeamAttrList();
  }
  updateReport(enemy){
    const debuffCount = enemy.countBuffs({tag:'debuff'}, 5);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, debuffCount),
        ...R.getActionReport(this),
        ...this.getEnergyReport(debuffCount),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      const weakList = target.weakList || [];
      const list = this.teamAttrList.filter(attr => !weakList.includes(attr));
      if(list.length>0) {
        const attr = list[Math.floor(Math.random() * list.length)];
        this.addBuffRandom(Buff.getKey(this.name, '战技', D.DamageTypeInfo[attr].text + '属性弱点', attr), target, 1, { count:this.checkES('注入')?3:2}, this.skillData.ns.hit * 0.01);
      }
      const count = target.countBuffs({tag:'debuff'}, 5);
      this.addBuffRandom(Buff.getKey(this.name, '战技', '抗性降低'), target, 1, { count:2, plus:  this.checkES('旁注') && count>=3}, 1);
      cb();
    }, 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addBuffRandom(Buff.getKey(this.name, '终结技', '减防'), target, 1, { count:3}, this.skillData.us.hit*0.01);
      cb();
    },'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this, 2, this.rawFuncRate(0, 80), 'all', 'enemies', this.base.type, 0, { forceBreak: 1 });
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);

    if(e==='C_DMG_E' && D.checkType(data.type, ['NA','NS','US','SP','AA'])) {
      this.randomDebuff(data.targets[0], this.skillData.ps.hit * 0.01);
      if(D.checkType(data.type,'US') && this.checkSoul(1)) {
        const count = data.targets[0].countBuffs( {tag:'debuff'}, 5)
        this.addEn(count * 7);
        if(this.checkSoul(4)){
          const base = this.getAttr('atk') * 0.2;
          for(let i=0; i< count; i++) {
            A.newAddDmg(this, this, [data.targets[0]], base);
          }
        }
      }
    }
    super.onEvent(e, unit, data);
  }
  // 给目标植入随机缺陷
  randomDebuff(target, hit) {
    const buffs = target.filterBuffs({ tag:'缺陷' });
    const invalidNames = buffs.filter(b=>b.member===this).map(b=>b.data.name);
    const list = ['减攻', '减防', '减速'];
    const names = (invalidNames.length>0 && invalidNames.length<3)? list.filter(name=>!invalidNames.includes(name)): list;
    const name = D.sample(names);
    const count = this.checkES('生成')?4:3;
    this.addBuffRandom(Buff.getKey(this.name, '天赋', name), target, 1, { count }, hit);
  }
  // 获取伤害报告
  getDamageReport(enemy, dCount){
    const base = this.getAttr('atk') * 0.01;
    const { na, ns, us, ps } = this.skillData;
    const bonusRate = this.checkSoul(4)?20: 0;
    const hitReport = { type:'hit', name: '天赋命中率', labels:['攻击触发'], hit0: C.calHitRate(ps.hit * 0.01, this, enemy)};
    if(this.checkES('生成')) {
      hitReport.labels.push('被击破触发');
      hitReport.hit1 = C.calHitRate(0.65, this, enemy);
    }

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg}, C.calDmg(base * na.rate, ['Quantum', 'NA'], this, enemy)),
      Object.assign({ type:'damage', name:'战技', brkDmg: brkDmg*2, hitRate: C.calHitRate(ns.hit * 0.01, this, enemy)}, C.calDmg(base * ns.rate, ['Quantum', 'NS'], this, enemy)),
      Object.assign({ type:'damage', name:'终结技', brkDmg: brkDmg*3, hitRate: C.calHitRate(us.hit * 0.01, this, enemy)}, C.calDmg(base * us.rate, ['Quantum', 'US'], this, enemy)),
    ];
    if(bonusRate>0){
      list.push( Object.assign({ type:'damage', name:'终结技[追伤]', tip:'共触发'+dCount+'次'}, C.calDmg(base * bonusRate, ['Quantum', 'AD'], this, enemy)));
    }
    list.push(Object.assign({ type:'damage', name:'秘技', brkDmg: 2}, C.calDmg(base * 80, ['Quantum', 'SP'], this, enemy)));
    list.push( hitReport, R.getBreakReport(this, enemy));
    return list;
  }
  // 获取能量报告
  getEnergyReport(dCount){
    const bonus = this.checkSoul(1)? 7 * dCount : 0;
    return R.getEnergyReport(this,{us:5 + bonus});
  }
  // 获取所有队友的攻击属性列表
  getTeamAttrList(){
    const list = this.team.members.filter(m=>m).map(m=>m.base.type);
    return Array.from(new Set(list));  
  }
}

module.exports = {
  data: baseData,
  character: SsrSilverWolf,
};