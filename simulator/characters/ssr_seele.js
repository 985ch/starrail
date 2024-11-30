'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '希儿',
  image: 'seele.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Quantum',
  hp: D.levelData['126_931'],
  atk: D.levelData['87_640'],
  def: D.levelData['49_363'],
  speed: 115,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3, 0.7],
  naSoul: 5,
  ns: D.makeTable([['rate'],[110],[121],[132],[143],[154],[165],[178],[192],[206],[220],[231],[242]]),
  nsTarget: 'enemy',
  nsHits: [0.2, 0.1, 0.1, 0.6],
  nsSoul: 3,
  ps: D.makeTable([['bonusAll'],[40],[44],[48],[52],[56],[60],[65],[70],[75],[80],[84],[88]]),
  psSoul: 3,
  us: D.makeTable([['rate'],[255],[272],[289],[306],[323],[340],[361],[382],[403],[425],[442],[459]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '夜行', '割裂', '涟漪' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { criDamage: 5.3 }, { criDamage: 8.0 }, { criDamage: 10.7 },
  ],
  defaultJson: {
    weapon:'于夜色中', name4: '繁星璀璨的天才', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusQuantum',
  },
  aiConditions: [{value:'c_seele',text:'额外回合'}],
  ai:{
    na:{
      rules:[
        [{t:"target",v:["hp","min","gt",0,"no"]},{t:"hp",v:["t","absolute","lt",3000]},{t:"c_seele",v:["no"]}],
        [{t:"target",v:["selected"]}]
      ]
    },
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["selected"]},{t:"c_seele",v:["yes"]}],
        [{t:"target",v:["hp","min","gt",0,"no"]},{t:"c_seele",v:["no"]},{t:"hp",v:["t","absolute","lt",8000]}],
        [{t:"target",v:["selected"]}]
      ]
    },
    us:{
      disable:false,
      rules:[
        [{t:"target",v:["selected"]},{t:"c_seele",v:["yes"]}],
        [{t:"target",v:["hp","min","gt",0,"yes"]},{t:"c_seele",v:["no"]},{t:"hp",v:["t","absolute","lt",30000]}],
        [{t:"target",v:["selected"]}]
      ]
    }
  },
  equipSetting: {
    rule: 'dmgUS',
    attrs: {
      speed:[50, 0, 160],
    },
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusQuantum',
    },
    set2: '停转的萨尔索图'
  },
};

const buffPsKey = Buff.getKey(baseData.name, '天赋', '增幅');
// 全属性增伤
class BuffDamage extends Buff {
  static info() {
    return {
      name: '增幅',
      short: '增伤',
      source: '天赋',
      desc:'伤害提高，量子抗性穿透',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll', '量子穿透', 'removable'],
    };
  }
  getDesc() {
    const { throughQuantum, bonusAll } = this.member.getDamageBonusData();
    let text = `伤害提高${bonusAll.toFixed(1)}%`;
    if(throughQuantum > 0){
      text += `，获得${throughQuantum.toFixed(1)}%量子穿透`;
    }
    return text;
  }
  getAttributes() {
    return this.member.getDamageBonusData();
  }
}
// 乱蝶
class DebuffLD extends Buff {
  static info() {
    return {
      name: '乱蝶',
      short: '乱蝶',
      source: '终结技',
      desc:'受到攻击时承受来自希儿的额外伤害',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', 'removable'],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'B_DMG_E', t:'enemy', f:(buff, unit, data)=>{
      A.newAddDmg(m, data.member, [unit], m.getBaseDmg('us')*0.15);
    }})
  }
}
// 额外暴击
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '斩尽',
      short: '暴击',
      source: '星魂',
      desc:'对生命值低于80%的敌方目标暴击提高15%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    return (target.checkHp(80))? { criRate: 15 }: {};
  }
}
class SsrSeele extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()],'', {
        speedRate: 25, name: '归刃', source: '战技',
        maxValue: this.checkSoul(2)? 2 : 1,
      }),
    ];
    if(this.checkSoul(1)){
      list.push(Buff.getListJson(this, BuffCriRate));
    }
    if(this.checkSoul(6)){
      list.push(Buff.getListJson(this, DebuffLD, [Buff.eventListener('TURN_S', 'enemy')]));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getActionReport(),
        ...this.getEnergyReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return this.checkBonusTurn()?'额外回合中':'普通回合';
  }
  getStateExData() {
    return this.checkBonusTurn()?'yes':'no';
  }
  castNA(target) {
    const isBonusTurn = this.checkBonusTurn();
    A.actionAttack({ type: 'NA', member:this, target, atkType: 'single', keepTurn: isBonusTurn, hits: baseData.naHits },cb=>cb(), ()=>{
      return A.simpleDmg(this.base.type, 20, this.rawFunc(1, 'na'))
    });
    if(this.checkES('涟漪'))this.changeWaitTime(-20);
    this.changeSp(1);
    if(isBonusTurn)this.endBonusTurn();
  }
  castNS(target) {
    const isBonusTurn = this.checkBonusTurn();
    super.castNS(target);
    A.actionAttack({ type: 'NS', member:this, target, atkType: 'single', keepTurn: isBonusTurn, hits: baseData.nsHits },cb=>{
      this.addBuff(Buff.getKey(this.name, '战技', '归刃'), this, 1, {count:2});
      cb();
    },()=>A.simpleDmg(this.base.type, 30, this.rawFunc(2, 'ns')));
    if(isBonusTurn)this.endBonusTurn();
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addBuff(buffPsKey, this, 1);
      cb();
    }, 'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
    if(this.checkSoul(6)){
      this.addBuff(Buff.getKey(this.name, '终结技', '乱蝶'), target, 1);
    }
  }
  checkDisableUS() {
    return super.checkDisableUS() || this.checkBonusTurn();
  };
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this);
      this.addBuff(buffPsKey, this, 1);
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_KILL') {
      if(this.checkSoul(4))this.addEn(15);
      if(D.checkType(data.type, ['NA','NS','US']) && this.team.state.bonusTurn !== this.name) {
        this.addBuff(buffPsKey, this, 1);
        this.startBonusTurn();
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const fixed = {}
    const buff = this.findBuff({key:buffPsKey});
    if(!buff){
      const data = this.getDamageBonusData();
      fixed.bonus = data.bonusAll;
      fixed.defend = data.throughQuantum;
    }

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Quantum', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(base * ns.rate, [ 'Quantum', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, [ 'Quantum', 'US' ], this, enemy, null, fixed)),
    ];
    if(this.checkSoul(6)){
      list.push(Object.assign({ type:'damage', name:'乱蝶[追伤]'}, C.calDmg(base * 0.15 * us.rate, [ 'Quantum', 'AD' ], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getActionReport() {
    const list = R.getActionReport(this);
    if(this.checkES('涟漪')) {
      const wait = C.calActionTime(this.getAttr('speed'), 20);
      list.push({ type:'action', name:'普攻后', wait });
    }
    return list;
  }
  getEnergyReport() {
    const list = R.getEnergyReport(this);
    if(this.checkSoul(4)) {
      list.push({ type:'energy', name:'掠影[回能]', labels:['击杀回能'], en0: C.calEnergy(15, this)})
    }
    return list;
  }
  getDamageBonusData() {
    const throughQuantum = this.checkES('割裂') ? 20 : 0;
    return { throughQuantum, bonusAll: this.skillData.ps.bonusAll }
  }
}

module.exports = {
  data: baseData,
  character: SsrSeele,
};