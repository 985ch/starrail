'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffFreeze, DebuffDefRate } = require('../debuff_simple');
const { BuffHit, BuffDamage } = require('../buff_simple');

const baseData = {
  name: '米沙',
  image: 'misha.jpg',
  rarity: 'SR',
  job: '毁灭',
  type: 'Ice',
  hp: D.levelData['173_1270'],
  atk: D.levelData['81_599'],
  def: D.levelData['54_396'],
  speed: 96,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['rateC','rateD'],[100,40],[110,44],[120,48],[130,52],[140,56],[150,60],[162.5,65],[175,70],[187.5,75],[200,80],[210,84],[220,88],[230,92],[240,96],[250,100]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 5,
  ps: D.makeTable([['en'],[1],[1.1],[1.2],[1.3],[1.4],[1.5],[1.625],[1.75],[1.875],[2],[2.1],[2.2],[2.3],[2.4],[2.5]]),
  psSoul: 5,
  us: D.makeTable([
    ['rate','chance','adRate'],
    [36,12,18],
    [38.4,12.8,19.2],
    [40.8,13.6,20.4],
    [43.2,14.4,21.6],
    [45.6,15.2,22.8],
    [48,16,24],
    [51,17,25.5],
    [54,18,27],
    [57,19,28.5],
    [60,20,30],
    [62.4,20.8,31.2],
    [64.8,21.6,32.4],
    [67.2,22.4,33.6],
    [69.6,23.2,34.8],
    [72,24,36],
  ]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: ['释放','锁接','传冲'],
  attributes: [
    {bonusIce: 3.2}, {bonusIce: 3.2}, {bonusIce: 4.8}, {bonusIce: 4.8}, {bonusIce: 6.4},
    {criRate: 2.7}, {criRate: 4.0}, {defRate: 5.0}, {defRate: 7.5}, {defRate: 10.0},
  ],
  defaultJson: {
    weapon:'铭记于心的约定', name4: '密林卧雪的猎人', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusIce',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}, {value:'c_misha',text:'战技状态'}],
  ai: {
    na: ai.na_breaker('弱冰'),
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱冰","gt",0]},{t:"c_misha",v:["yes"]}],
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱冰","gt",0]},{t:"shield",v:["gt",1]}],
        [{t:"target",v:["selected","min","gt",0,"yes"]},{t:"sp",v:["gt",2]}],
        [{t:"target",v:["selected"]},{t:"c_misha",v:["yes"]}]
      ]
    },
    us:{
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱冰","gt",0]},{t:"c_ps_comm",v:["eq",10]}],
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱冰","gt",0]},{t:"mTurn",v:["s","ready"]}],
        [{t:"target",v:["selected"]},{t:"mTurn",v:["t","ready"]}]
      ]
    }
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'enRate',
      ball: 'bonusIce',
    },
    set2: '停转的萨尔索图'
  },
};

class BuffMisha extends Buff {
  static info() {
    return {
      name: '米沙',
      short: '米沙',
      source: '天赋',
      desc: '我方消耗战技点时增加米沙的攻击段数并为其恢复能量',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'SP_CHANGE', t:'members', f:(buff, unit, data)=>{
      if(data.sp > -1 || !m.team.state.inBattle)return;
      const count = -data.sp;
      m.addUsCount(count);
      m.addEn(m.skillData.ps.en * count);
    }})
  }
}

class BuffCriDmg extends Buff {
  static info() {
    return {
      name: '暴伤',
      short: '暴伤',
      source: '天赋',
      desc: '对冻结的敌方目标暴伤提高30%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  getAttributesT(target) {
    const buff = target.findBuff({tag: '冻结'});
    return buff? { criDamage: 30 }: {};
  }
}

class SrMisha extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffMisha),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {
        baseAttr:'atk', rate:this.skillData.us.adRate ,name: '冻结', source: '终结技',
      }),
    ];
    if(this.checkES('锁接')) {
      list.push(Buff.getListJson(this, BuffHit, [Buff.eventListener('C_ATK_E', 'self')], '', {
        hit: 60, name:'命中', source: '天赋', maxValue: 1, target:'self',
      }))
    }
    if(this.checkES('传冲')) list.push(Buff.getListJson(this, BuffCriDmg));
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()], '', {
        defDown: 16, name: '减防', source:'星魂', maxValue: 1, target:'enemy',
      }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffDamage, [Buff.eventListener('TURN_E', 'self')], '', {
        bonusAll: 30, name: '增伤', source:'星魂', maxValue:1, target:'self',
      }));
    }
    return list;
  }
  getStateExText() {
    return `层数:${this.state.usCount} ${this.state.nsSP==='yes'? '免豆':'减豆'}`;
  }
  getStateExData(key) {
    const data = {
      count: this.state.usCount,
      nsSP: this.state.nsSP? 'yes': 'no',
    }
    return key? data[key]: data;
  }
  resetState(isReborn){
    super.resetState(isReborn);
    this.state.usCount = 3;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others: [['天赋回能', this.skillData.ps.en]]}),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(),'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rateC','rateD','atk'), baseData.nsHits, baseData.nsHits);
    this.addUsCount(1);
    if(this.state.nsSP){
      this.changeSp(1);
      this.state.nsSP = false;
    }
  }
  castUS(target){
    super.castUS(target);
    let count = this.state.usCount;
    if(this.checkSoul(1)) {
      const addCount = this.team.getAliveUnits('enemies').length;
      count += Math.min(5, addCount);
    }
    this.actionAttack(cb=>{
      if(this.checkES('锁接'))this.addBuff(Buff.getKey(this.name, '天赋', '命中'), this, 1);
      if(this.checkSoul(6)) {
        this.addBuff(Buff.getKey(this.name, '星魂', '增伤'), this, 1);
        this.state.nsSP = true;
      }
      cb();
    },'US', target, 'random', 5/count, (idxT, idxH)=>{
      return { brkDmg: idxH===0? 1 : 0.5, raw: this.getBaseDmg('us')+(this.checkSoul(4)? 0.06: 0)}
    }, count, null, {hitAliveOnly:true});
    this.state.usCount = 3;
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() { this.addUsCount(2) }
  addUsCount(val) {
    this.state.usCount = Math.min(10, this.state.usCount + val);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e === 'C_HIT_S') {
      if(D.checkType(data.type, 'US')){
        if(this.checkSoul(2)) {
          this.addBuffRandom(Buff.getKey(this.name, '星魂', '减防'), data.target, 1, {count:3}, 0.24);
        }
        const hit = this.skillData.us.chance * 0.01 + (this.checkES('释放') && data.idxH===0? 0.8: 0);
        this.addBuffRandom(Buff.getKey(this.name, '终结技', '冻结'), data.target, 1, {count:1}, hit, 1, true);
      }
    } else if(e === 'BTL_S') {
      if(this.state.fieldActivated) this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const usRate = base * us.rate + (this.checkSoul(4)? 0.06: 0);
    const hitFix = (this.checkES('锁接') && !this.findBuff({key:Buff.getKey(this.name, '天赋', '命中')}))? 60: 0;
    const hit = C.calHitRate(us.chance * 0.01, this, enemy, 1, true, false, hitFix);
    const bonus = (this.checkSoul(6) && !this.findBuff({key:Buff.getKey(this.name, '星魂', '增伤')}))? 30: 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Ice', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg:brkDmg*2}, C.calDmg(base * ns.rateC, ['Ice', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg}, C.calDmg(base * ns.rateD, ['Ice', 'NS'], this, enemy)),
      Object.assign({
        type: 'damage', name:'终结技', hitRate: hit, tip:`首次削韧${brkDmg.toFixed(1)},后续削韧${(brkDmg/2).toFixed(1)},3~10段`
      }, C.calDmg(usRate, ['Ice', 'US'], this, enemy, null, {bonus})),
      Object.assign({ type: 'damage', name:'终结技[解冻]'}, C.calDmg(base * us.adRate, ['Ice', 'AD'], this, enemy)),
    ];
    if(this.checkES('释放')) {
      list.push({
        type:'hit', name: '终结技[冻结]', tip:'各段伤害的冻结概率', labels: ['首段攻击', '后续攻击'],
        hit0: C.calHitRate(us.chance * 0.01 + 0.8, this, enemy, 1, true, false, hitFix), hit1: hit
      })
    }
    if(this.checkSoul(2)) {
      list.push({
        type:'hit', name: '减防概率', tip:'来自星魂2', labels: ['触发概率'],
        hit0: C.calHitRate(0.24, this, enemy, 1, false, false, hitFix),
      })
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrMisha,
};