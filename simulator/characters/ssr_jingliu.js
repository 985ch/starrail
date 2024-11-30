'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffCriDamage } = require('../buff_simple');
const { DebuffFreeze } = require('../debuff_simple');

const baseData = {
  name: '镜流',
  image: 'jingliu.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Ice',
  hp: D.levelData['195_1435'],
  atk: D.levelData['92_679'],
  def: D.levelData['66_485'],
  speed: 96,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 140,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3, 0.7],
  naSoul: 5,
  ns: D.makeTable([
    ['rateS', 'rateC', 'rateD' ],
    [100, 125, 62],
    [110, 137, 68],
    [120, 150, 75],
    [130, 162, 81],
    [140, 175, 87],
    [150, 187, 93],
    [162, 203, 101],
    [175, 218, 109],
    [187, 234, 117],
    [200, 250, 125],
    [210, 262, 131],
    [220, 275, 137]
  ]),
  nsTarget: 'enemy',
  nsHits: [0.1, 0.1, 0.1, 0.2, 0.5],
  nsSoul: 5,
  ps: D.makeTable([['criRate', 'atkRateMax'],[40,90], [41,99], [42,108], [43,117], [44,126], [45,135], [46,146], [47,157], [48,168], [50,180],[51,189],[52,198]]),
  psSoul: 3,
  us: D.makeTable([
    ['rateC', 'rateD'],
    [180, 90],
    [192, 96],
    [204, 102],
    [216, 108],
    [228, 114],
    [240, 120],
    [255, 127],
    [270, 135],
    [285, 142],
    [300, 150],
    [312, 156],
    [324, 162],
  ]),
  usTarget: 'enemy',
  usHits: [1], 
  usSoul: 3,
  es: ['死境', '剑首', '霜魄'],
  attributes: [
    {criDamage: 5.3}, {criDamage: 5.3}, {criDamage: 8.0}, {criDamage: 8.0}, {criDamage: 10.7},
    {hpRate: 4.0}, {hpRate: 6.0}, {speed: 2.0}, {speed: 3.0}, {speed: 4.0},
  ],
  defaultJson: {
    weapon:'此身为剑', name4: '密林卧雪的猎人', name2: '繁星竞技场',
    body: 'criDamage', foot: 'speed', link:'atkRate', ball:'bonusIce',
    atkRate: [0, 3, 2],
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
};
const buffPsKey = Buff.getKey(baseData.name, '天赋', '转魄');
const buffPsKeyA = Buff.getKey(baseData.name, '天赋', '转魄[加攻]');
class BuffZP extends Buff {
  static info() {
    return {
      name: '转魄',
      short: '转魄',
      source: '天赋',
      desc: '暴击提高，抵抗提高，终结技对冻结目标伤害提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '暴击', '增伤', '抵抗'],
    }
  }
  init() {
    const m = this.member;
    const ms = m.state;
    const bs = this.state;
    this.listen({e:'C_ATK_S', t:'self', f:(buff, unit, data)=>{
      if(!D.checkType(data.type, ['NS','US'])) return;
      m.addBuff(buffPsKeyA, m, 1, { count:1, costed: m.countCostHp(true) })
      if(D.checkType(data.type, 'NS')){
        ms.nsCount--;
        if(m.checkSoul(2) && ms.hasNsBonus)m.addBuff(Buff.getKey(m.name, '星魂', '朔晕七星'), m, 1);
      }
    }})
    this.listen({e:'C_ATK_E', t:'self', f:(buff, unit, data)=> {
      if(!D.checkType(data.type, ['NS','US'])) return;
      ms.hasNsBonus = false;
    }})
    this.listen({e:'TURN_E', t:'self', f:()=> {
      if(ms.nsCount<=0)bs.count=0;
    }})
  }
  getDesc() {
    const {criRate, dodge, bonusUS, criDamage } = this.getData();
    let text = `暴击率提高${D.toPercent(criRate)}`;
    if(dodge) text+=',效果抵抗提高35%';
    if(bonusUS) text+=',终结技伤害提高20%';
    if(criDamage) text+=',暴击伤害提高50%';
    return text+'。';
  }
  getAttributes() {
    const {criRate, dodge, bonusUS, criDamage } = this.getData();
    return {criRate, dodge, bonusUS, criDamage };
  }
  getData() {
    const m = this.member;
    const {ps} = m.skillData;
    return {
      criRate: ps.criRate,
      dodge: m.checkES('死境')? 35: 0,
      bonusUS: m.checkES('霜魄')? 20: 0,
      criDamage: m.checkSoul(6)? 50: 0,
    }
  }
}
class BuffZPAtk extends Buff {
  static info() {
    return {
      name: '转魄[加攻]',
      short: '加攻',
      source: '天赋',
      desc: '消耗队友生命提高攻击',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '加攻'],
    }
  }
  getDesc() {
    const atk = this.getData();
    return `攻击力提高${Math.floor(atk)}`;
  }
  getAttributes() {
    return {atk: this.getData()};
  }
  getData() {
    const m = this.member;
    const hpCost = this.state.costed || m.countCostHp(false);
    return m.countHp2Atk(hpCost);
  }
}
class BuffBonusNS extends Buff {
  static info() {
    return {
      name: '朔晕七星',
      short: '战技+',
      source: '星魂',
      desc: '终结技后强化战技伤害提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusNS'],
    }
  }
  getDesc() {
    return '下一次强化战技伤害提高80%。'
  }
  getAttributes() {
    return { bonusNS: 80 };
  }
}

class SsrJingliu extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffZP),
      Buff.getListJson(this, BuffZPAtk, [Buff.eventListener('C_ATK_E', 'self')]),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {
        baseAttr:'atk', rate:80 ,name: '冻结', source: '秘技',
      }),
    ];
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffCriDamage, [Buff.simpleListener()],'',{
        criDamage: 24, name: '月犯天关', source: '星魂', maxValue: 1, //hide: true,
      }))
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffBonusNS, [Buff.eventListener('C_ATK_E', 'self')]))
    }
    return list;
  }
  getStateExText() {
    const buff = this.findBuff({key:buffPsKey});
    return `${buff?'转魄':'通常'}:${this.state.nsCount || 0}`;
  }
  getStateExData() {
    return this.state.nsCount || 0;
  }
  updateReport(enemy){
    const hasZP = this.findBuff({key:buffPsKey}) !== null;
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, hasZP),
        ...R.getEnergyReport(this, {ns: hasZP? 30: 20, others:[['秘技回能',15]]}),
        ...this.getActionReport(hasZP),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  checkDisableNA() { return super.checkDisableNA() || this.findBuff({key:buffPsKey}) !== null; }
  castNS(target) {
    const buff = this.findBuff({key:buffPsKey});
    if(!buff) {
      super.castNS(target);
      this.actionAttack(cb=>cb(), 'NS', target, 'single', 20, this.rawFunc(2, 'ns', 'rateS'), [1]);
      this.addNsCount(true);
      if(this.checkES('剑首')) this.changeWaitTime(-10);
    } else {
      this.actionAttack(cb=>cb(), 'NS', target, 'diff', 30, this.rawDiffFunc(2, 1, 'ns', 'rateC', 'rateD'), baseData.nsHits, baseData.nsHits);
    }
  }
  checkDisableNS() {
    const buff = this.findBuff({key:buffPsKey});
    return !this.canAction() || ( this.team.state.sp <= 0 && (!buff || this.state.nsCount <= 0))
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>cb(), 'US', target, 'diff', 5, this.rawDiffFunc(2, 2, 'us', 'rateC', 'rateD'), baseData.usHits, baseData.usHits);
    this.addNsCount(false);
    if(this.checkSoul(2))this.state.hasNsBonus = true;
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    this.state.nsCount = 1;
    this.addEn(15);
    this.team.getAliveUnits('enemies').forEach(t => this.addBuffRandom(Buff.getKey(this.name, '秘技', '冻结'), t, 1, {}, 1, 1, true));
  }
  addNsCount(isNs) {
    const s = this.state;
    s.nsCount = Math.min(this.checkSoul(6)? 4: 3, (s.nsCount || 0) + 1);
    if(s.nsCount !==2 ) return;
    const buff = this.findBuff({key: buffPsKey });
    if(buff) return;
    this.addBuff(buffPsKey, this, 1);
    this.changeWaitTime(-100, !(this.team.state.acted || isNs));
    if(this.checkSoul(6))s.nsCount++;
  }
  countCostHp(bChange) {
    let hpCost = 0;
    for(let i=0; i<4; i++) {
      const cur = this.team.members[i];
      if(!cur || this===cur || !cur.checkAlive())continue;
      const cost = Math.min(Math.max(0, cur.state.hp - 1), cur.getAttr('hp') * 0.04);
      if(bChange) cur.changeHp(-cost, this, 'cost');
      hpCost += cost;
    }
    return hpCost;
  }
  countHp2Atk(hpCost) {
    const plus = this.checkSoul(4);
    return Math.min(this.baseAtk * (this.skillData.ps.atkRateMax + (plus?30:0))*0.01, hpCost*(5.4+(plus? 0.9: 0)))
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.fieldActivated) this.onSP();
    } else if(e==='C_DMG_S') {
      if(this.checkSoul(1) && D.checkType(data.type, ['NS','US']) && data.atkType==='diff') {
        this.addBuff(Buff.getKey(this.name, '星魂', '月犯天关'), this, 1);
      }
    } else if(e==='C_HIT_E') {
      if(data.idxT===0) { this.state.curHitsCount = 0 }
      if(data.target.checkAlive()){
        this.state.curHitsCount++;
        this.state.lastHitTarget = data.target.name;
      }
      if(data.idxT===data.idxMT && !data.options.isAddDmg && this.state.curHitsCount===1 && D.checkType(data.type, ['NS','US'])) {
        A.newAddDmg(this, this, [this.team.getCharacter(this.state.lastHitTarget)], this.getAttr('atk')*data.rate , false, null, data.type, { isAddDmg: true });
        this.state.lastHitTarget = null;
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy, hasZP) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const buffAtk = this.findBuff({key:buffPsKeyA});
    const buff1 = this.findBuff({key:Buff.getKey(this.name, '星魂', '月犯天关')});
    const buff2 = this.findBuff({key:Buff.getKey(this.name, '星魂', '朔晕七星')});
    const criDmgFix = buff1? -24: 0;
    const criDmg = this.checkSoul(1) && !buff1? 24: 0;
    const atkBonus = 0.01*(buffAtk? buffAtk.getData() : this.countHp2Atk(this.countCostHp(false)));
    const atk = buffAtk? base - atkBonus: base;
    const atkPlus = hasZP && !buffAtk? base + atkBonus: base;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(atk * na.rate, ['Ice', 'NA'], this, enemy, null, { criDmg: criDmgFix }))
    ].concat(hasZP?
      [
        Object.assign({ type: 'damage', name:'战技[强化]', brkDmg: brkDmg*2}, C.calDmg(atkPlus * ns.rateC, [ 'Ice', 'NS' ], this, enemy, null, { criDmg })),
        Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(atkPlus * ns.rateD, [ 'Ice', 'NS' ], this, enemy, null, { criDmg })),
      ]:[Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2 }, C.calDmg(atk * ns.rateS, ['Ice', 'NS'], this, enemy, null, {
        criDmg: criDmgFix, bonus: buff2? -80: 0,
      }))]
    ).concat([
      Object.assign({ type: 'damage', name:'终结技[中心]', brkDmg: brkDmg*2 }, C.calDmg(atkPlus * us.rateC, [ 'Ice', 'US' ], this, enemy, null, { criDmg })),
      Object.assign({ type: 'damage', name:'终结技[扩散]', brkDmg: brkDmg*2 }, C.calDmg(atkPlus * us.rateD, [ 'Ice', 'US' ], this, enemy, null, { criDmg })),
    ]);
    if(this.checkSoul(1)) list.push(
      Object.assign({ type: 'damage', tip:'强化战技仅命中单个目标时', name:'额外伤害[战技]'}, C.calDmg(atkPlus * 100, [ 'Ice', 'NS' ], this, enemy, null, { criDmg })),
      Object.assign({ type: 'damage', tip:'终结技仅命中单个目标时', name:'额外伤害[终结技]'}, C.calDmg(atkPlus * 100, [ 'Ice', 'US' ], this, enemy, null, { criDmg })),
    );
    list.push(
      Object.assign({ type: 'damage', tip:'解冻伤害', name:'秘技'}, C.calDmg(atk * 80, ['Ice', 'AD'], this, enemy, null, { criDmg: criDmgFix })),
      R.getBreakReport(this, enemy),
    );
    return list;
  }
  getActionReport(hasZP) {
    const list = R.getActionReport(this);
    if(!hasZP && this.checkES('剑首')) {
      list.push({ type:'action', name:'战技后', wait: C.calActionTime(this.getAttr('speed'), 10) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrJingliu,
};