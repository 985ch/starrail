'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBonus, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '驭空',
  image: 'yukong.jpg',
  rarity: 'SR',
  job: '同谐',
  type: 'Void',
  damages: ['NA','US'],
  hp: D.levelData['124_917'],
  atk: D.levelData['81_599'],
  def: D.levelData['51_374'],
  speed: 107,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 130,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.2, 0.2, 0.6],
  naSoul: 3,
  ns: D.makeTable([['atkRate'],[40],[44],[48],[52],[56],[60],[65],[70],[75],[80],[84],[88]]),
  nsTarget: 'members',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[40],[44],[48],[52],[56],[60],[65],[70],[75],[80],[84],[88]]),
  psSoul: 5,
  us: D.makeTable([
    ['criRate', 'criDamage', 'rate'],
    [ 21, 39, 228],
    [ 21, 41, 243],
    [ 22, 44, 258],
    [ 23, 46, 273],
    [ 23, 49, 288],
    [ 24, 52, 304],
    [ 25, 55, 323],
    [ 26, 58, 342],
    [ 27, 61, 361],
    [ 28, 65, 380],
    [ 28, 67, 395],
    [ 29, 70, 410],
  ]),
  usHits: [1],
  usTarget: 'enemy',
  usSoul: 5,
  es: [ '襄尺', '迟彝', '气壮' ],
  attributes: [
    {bonusVoid: 3.2}, {bonusVoid: 3.2}, {bonusVoid: 4.8}, {bonusVoid: 4.8}, {bonusVoid: 6.4},
    {atkRate: 4.0 }, {atkRate: 6.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'过往未来', name4: '野穗伴行的快枪手', name2: '折断的龙骨',
    body: 'criRate', foot: 'speed', link:'enRate', ball:'bonusVoid',
  },
  aiConditions: [{value:'c_yukong',text:'普攻强化'}],
  ai:{
    na: ai.na_default,
    ns:{
      disable:false,
      rules:[[{t:"actSeq",v:["驭空","lt",3,"yes"]},{t:"sp",v:["gt",1]}]]
    },
    us:{
      disable:false,
      rules:[[{t:"target",v:["selected"]},{t:"buff",v:["s","key","驭空$战技$鸣弦号令.","yes",0]}]]
    }
  },
  equipSetting: {
    rule: 'dmgNA',
    main: {
      foot: 'speed',
      link: 'enRate',
      ball: 'bonusVoid',
    },
  },
};
const buffNSKey = Buff.getKey(baseData.name, '战技', '鸣弦号令');
class BuffMXHL extends Buff {
  static info() {
    return {
      name: '鸣弦号令',
      short: '号令',
      source: '战技',
      desc: '增加攻击力，可额外增加双暴',
      show: true,
      maxValue: 2,
      target: 'members',
      tags: ['buff', '加攻', '暴击', '暴伤'],
    };
  }
  init() {
    const m = this.member;
    this.listen({e: 'TURN_E', t:'members', f:(buff, unit, data)=>{
      if(unit !== m || !m.state.keepBuff) this.state.count--;
      m.state.keepBuff = false;
    }})
    if(m.checkES('气壮'))this.listen({e: 'ACT_E', t:'members', f:(buff, unit, data)=>{
      m.addEn(2);
    }})
  }
  getDesc(target) {
    const { atkRate, criRate, criDamage, bonusAll } = this.getData(target);
    return `攻击提升${D.toPercent(atkRate)}${criRate? `，暴击提升${D.toPercent(criRate)}，暴伤提升${D.toPercent(criDamage)}` : ''}${bonusAll? `，伤害增加${D.toPercent(bonusAll)}`:''}。`
  }
  getAttributes(target) {
    return this.getData(target);
  }
  getData(target) {
    const m = this.member;
    const { ns, us } = m.skillData;
    return {
      atkRate: ns.atkRate,
      criRate: us.criRate * (this.value - 1),
      criDamage: us.criDamage * (this.value - 1),
      bonusAll: m.checkSoul(4) && m===target? 30: 0,
    }
  }
}
class BuffEn extends Buff {
  static info() {
    return {
      name: '驭空回能',
      short: '回能',
      source: '星魂',
      desc: '驭空额外回能监听',
      show: false,
      maxValue: 1,
      target:'self',
      tags: [],
    }
  }
  init() {
    this.state.members = [];    
    const m = this.member;
    m.team.getAliveUnits('members').forEach(u => {
      if(u.state.en < u.base.enMax) return;
      this.state.members.push(u.name);
      m.addEn(5);
    })
    this.listen({e: 'EN_CHANGE', t:'members', f:(buff, unit, data)=>{
      if(data.after < unit.base.enMax || buff.state.members.indexOf(unit.name)>= 0) return;
      buff.state.members.push(unit.name);
      m.addEn(5);
    }})
  }
}
class BuffBlocker extends Buff {
  static info() {
    return {
      name: '抵抗负面效果',
      short: '抵抗',
      source: '天赋',
      desc: '抵抗负面效果',
      show: false,
      maxValue: 0,
      target:'self',
      tags: ['抵抗异常'],
    }
  }
  blockDebuff() {
    return this.member.updateCD(2, 'blockDebuff', false, true);
  }
}
class SrYukong extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [ Buff.getListJson(this, BuffMXHL) ];
    if(this.checkES('襄尺')){
      list.push(Buff.getListJson(this, BuffBlocker));
    }
    if(this.checkES('迟彝')){
      list.push(Buff.getListJson(this, BuffBonus, [], '', { bonusVoid: 12, type: 'Void', name: '迟彝', source:'天赋', target:'members' }));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 10, name: '加速', source:'星魂', maxValue: 1, target:'member',
      }));
    }
    if(this.checkSoul(2)) list.push(Buff.getListJson(this, BuffEn));
    return list;
  }
  getStateExText() {
    const buff = this.findBuff({key: buffNSKey})
    return `号令:${buff? buff.state.count: 0}`;
  }
  getStateExData() {
    this.updateCD(2, 'naPlus', false, false);
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
    if(this.updateCD(2, 'naPlus', false, true)) {
      const { na, ps } = this.skillData;
      this.actionAttack(cb=>cb(), 'NA', target, 'single', 20, ()=>{
        return { brkDmg: 2, raw: this.getAttr('atk')*0.01*(na.rate + ps.rate) }
      }, baseData.naHits);
      this.changeSp(1);
    } else {
      super.castNA(target);
    }
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addNsBuff(2);
    });
    this.addEn(30);
    this.state.keepBuff = true;
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addNsBuff(this.checkSoul(6)? 1: 0, true);
      cb();
    }, 'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
    if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂','驭空回能'), this, 1)
  }
  castSP() {
    super.castSP(()=> {
      A.startBattleDmg(this);
      this.addNsBuff(2);
    });
  }
  addNsBuff(count, isUS) {
    const buff = this.findBuff({key: buffNSKey});
    if(!buff) {
      this.addBuff(buffNSKey, this, isUS? 2: 1, { count });
    } else {
      buff.state.count = Math.min(2, buff.state.count + count);
      if(isUS && buff.value===1) {
        buff.value = 2;
        buff.markTargets();
      }
    }
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S' && this.checkSoul(1)) {
      if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂','驭空回能'), this, 1);
      this.team.getAliveUnits('members').forEach(m => this.addBuff(Buff.getKey(this.name, '星魂','加速'), m, 1, {count:2}));
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ps, us } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻', brkDmg: brkDmg*2 }, C.calDmg(base * (na.rate + ps.rate), [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3 }, C.calDmg(base * us.rate, [ 'Fire', 'US' ], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  getEnergyReport() {
    const others = [];
    if(this.checkES('气壮')) others.push(['带号令行动', 2]);
    const list = R.getEnergyReport(this, { others });
    if(this.checkSoul(2)) {
      list.push({type:'energy',  name:'星魂回能', tip:'我方满能量时触发', labels: ['每人'], en0: C.calEnergy(5, this)});
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrYukong,
};