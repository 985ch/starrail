'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBlock, BuffAtkRate, BuffBonus } = require('../buff_simple');

const baseData = {
  name: '克拉拉',
  image: 'clara.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Physical',
  damages: ['NS','AA'],
  hp: D.levelData['168_1241'],
  atk: D.levelData['100_737'],
  def: D.levelData['66_485'],
  speed: 90,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['rate'],[60],[66],[72],[78],[84],[90],[97],[105],[112],[120],[126],[132]]),
  nsTarget: 'enemies',
  nsHits: [0.25, 0.25, 0.25, 0.25],
  nsSoul: 3,
  ps: D.makeTable([['rate'],[80],[88],[96],[104],[112],[120],[130],[140],[150],[160],[168],[176]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([['damageRate', 'rate'],[15,96],[16,102],[17,108],[18,115],[19,121],[20,128],[21,136],[22,144],[23,152],[25,160],[26,166],[27,172]]),
  usTarget: 'self',
  usSoul: 5,
  es: ['家人', '守护', '复仇'],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {hpRate: 4.0}, {hpRate: 6.0}, {bonusPhysical: 3.2}, {bonusPhysical: 4.8}, {bonusPhysical: 6.4},
  ],
  defaultJson: {
    weapon:'无可取代的东西', name4: '街头出身的拳王', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusPhysical',
  },
  aiConditions: [{value:'c_clara',text:'强化反击'}],
  ai:{
    na:ai.na_default,
    ns:{
      disable:false,
      rules:[
        [{t:"buff",v:["t","key","克拉拉$天赋$反击标记.","yes",0]}],
        [{t:"enCount",v:["gt",1]}]
      ]
    },
    us:{
      disable:false,
      rules:[[{t:"c_clara",v:["eq",0]}]]
    }
  },
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusPhysical',
    },
    set2: '停转的萨尔索图'
  },
};
const buffMarkKey = Buff.getKey(baseData.name, '天赋', '反击标记');
const buffPlusKey = Buff.getKey(baseData.name, '终结技', '反击强化');
class BuffCounter extends Buff {
  static info() {
    return {
      name: '反击',
      short: '反击',
      source: '天赋',
      desc:'反击',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.listen({e:'B_DMG_E', t:'members', f:(buff, unit, data)=>{
      if(data.member.faction==='enemies' && this.checkCounter(unit)) {
        this.member.castCounter(data.member);
      }
    }});
  }
  getAttributes() {
    return {
      damageRate: 0.9,
    }
  }
  checkCounter(unit) {
    const m = this.member;
    if(unit === m) return true;
    const buff = m.findBuff({key:buffPlusKey});
    return buff!==null || (m.checkSoul(6) && Math.random()<0.5);
  }
}
class DebuffMark extends Buff {
  static info() {
    return {
      name: '反击标记',
      short: '标记',
      source: '天赋',
      desc:'受到克拉拉的反击时承受更多伤害',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff'],
    };
  }
}
class BuffCounterPlus extends Buff {
  static info() {
    return {
      name: '反击强化',
      short: '强化',
      source: '终结技',
      desc:'被攻击概率提高，反击强化',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.state.counterPlus = this.member.checkSoul(6)? 3: 2;
  }
  getDesc() {
    const us = this.member.skillData.us;
    return `受击概率提高，承伤降低${us.damageRate}%,反击倍率提高${us.rate}%,且反击造成扩散伤害`;
  }
  getAttributes() {
    return {
      hateRate: 300,
      damageRate: 1 - this.member.skillData.us.damageRate * 0.01,
    }
  }
}
class BuffHateRate extends Buff {
  static info() {
    return {
      name: '受击概率提高',
      short: '嘲讽',
      source: '秘技',
      desc:'被攻击概率提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['Buff'],
    };
  }
  getAttributes() {
    return {
      hateRate: 300,
    }
  }
}
class SsrClara extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffCounter),
      Buff.getListJson(this, DebuffMark),
      Buff.getListJson(this, BuffCounterPlus, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffHateRate, [Buff.simpleListener()]),
    ];
    if(this.checkES('复仇')){
      list.push(Buff.getListJson(this, BuffBonus, [Buff.eventListener('C_DMG_E', 'self')], '', {
        type:'AA', bonusAA: 30, name: '复仇', source: '天赋',  maxValue: 1, //hide: true,
      }));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: 30, name: '攻击提升', source: '星魂',  maxValue: 1,
      }));
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffBlock, [Buff.eventListener('TURN_S', 'self')], '', {
        damageRate: 30, name: '承伤降低', source: '星魂',  maxValue: 1,
      }));
    }
    return list;
  }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('守护')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getStateExText() {
    const val = this.getStateExData();
    return val>0?`强化次数:${val}`:'未强化';
  }
  getStateExData() {
    const buff = this.findBuff({key: buffPlusKey});
    return buff? buff.state.counterPlus: 0;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...this.getDefendReport(enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    A.actionAttack({
      type: 'NS', member:this, target, atkType: 'all', hits: this.base.nsHits
    }, cb=>cb(), ()=>A.simpleDmg('Physical', 30, this.rawFunc(1, 'ns')), (raw, data, types, info)=> {
      const t = info.t;
      const buff = t.findBuff({key: buffMarkKey});
      const dmgData = C.calDmg(raw * (buff?2:1), types, data.member, t, data.options);
      if(buff && !this.checkSoul(1)) t.removeBuff(buff);
      return dmgData;
    });
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target: this}, ()=>{
      this.addBuff(buffPlusKey, this, 1, { count: 2 });
      if(this.checkSoul(2))this.addBuff(Buff.getKey(this.name, '星魂', '攻击提升'), this, 1, { count: 2 });
    });
  }
  castSP() {
    super.castSP(() => {
      A.startBattleDmg(this);
      this.addBuff(Buff.getKey(this.name, '秘技', '受击概率提高'), this, 1, { count: 2 });
    });
  }
  castCounter(target) {
    if(!this.checkAlive())return;
    const buff = this.findBuff({key: buffPlusKey});
    const { ps, us } = this.skillData;
    this.addBuff(buffMarkKey, target, 1);
    if(this.checkES('复仇'))this.addBuff(Buff.getKey(this.name, '天赋', '复仇'), this, 1);
    const rawDmg = (i) => {
      return { brkDmg: 1, raw: this.getAttr('atk') * 0.01 * (ps.rate + (buff? us.rate: 0) * (i===0? 1: 0.5)) }
    }
    const hits = this.base.psHits;
    if(buff) {
      buff.state.counterPlus--;
      this.castAdditionAttack(target, 'diff', 5, rawDmg, hits, hits, { claraFinish: buff.state.counterPlus<=0});
    } else {
      this.castAdditionAttack(target, 'single', 5, rawDmg, hits);
    }
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='B_DMG_E') {
      if(this.checkES('家人') && Math.random()<0.35) this.removeABuff('debuff');
      if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '星魂', '承伤降低'), this, 1);
    } else if(e==='C_ATK_E') {
      if(data.options && data.options.claraFinish) {
        const buff = this.findBuff({key: buffPlusKey});
        if(buff)this.removeBuff(buff);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const bonus = this.checkES('复仇') && this.findBuff({key:Buff.getKey(this.name, '天赋','复仇')})? 30: 0;
    const dmgPlus = base * (ps.rate + us.rate);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Physical', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[未标记]', brkDmg }, C.calDmg(base * ns.rate, ['Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[已标记]', brkDmg }, C.calDmg(base * ns.rate * 2, ['Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'反击', brkDmg }, C.calDmg(base*ps.rate, ['Physical', 'AA'], this, enemy, null, { bonus })),
      Object.assign({ type: 'damage', name:'强化反击[中心]', brkDmg}, C.calDmg(dmgPlus,  ['Physical', 'AA'], this, enemy, null, { bonus })),
      Object.assign({ type: 'damage', name:'强化反击[扩散]', brkDmg}, C.calDmg(dmgPlus*0.5,  ['Physical', 'AA'], this, enemy, null, { bonus })),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    if(this.checkES('守护')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrClara,
};