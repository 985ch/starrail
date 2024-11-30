'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffTaunt } = require('../debuff_simple');
const { BuffShield, BuffBlock, BuffAtkRate, BuffDefRate } = require('../buff_simple');

const baseData = {
  name: '开拓者(存护)',
  image: 'trailblazer_pre.jpg',
  rarity: 'SSR',
  job: '存护',
  type: 'Fire',
  damages: ['NA','US'],
  hp: D.levelData['168_1241'],
  atk: D.levelData['81_601'],
  def: D.levelData['82_606'],
  speed: 95,
  criRate: 5,
  criDamage: 50,
  hate: 150,
  enMax: 120,
  na: D.makeTable([
    ['rate','ratePlus','rateDiff'],
    [50, 90, 36],
    [60, 99, 39],
    [70, 108, 43],
    [80, 117, 46],
    [90, 126, 50],
    [100, 135, 54],
    [110, 146, 58],
  ]),
  naHits: [1],
  naHitsD: [0.5, 0.5],
  naSoul: 5,
  ns: D.makeTable([['block'],[40],[41],[42],[43],[44],[45],[46],[47],[48],[50],[51],[52]]),
  nsTarget: 'self',
  nsSoul: 3,
  ps: D.makeTable([['shieldR','shield'],[4.0, 20], [4.2, 32], [4.5, 41],[4.7, 50], [5.0, 56], [5.2, 62], [5.4, 66],[5.6, 71], [5.8, 75],[6.0, 80],[6.2, 84],[6.4, 89]]),
  psSoul: 3,
  us: D.makeTable([['rateA','rateD'],[50,75],[55,82], [60,90],[65,97],[70,105],[75,112],[81,121],[87,131], [93,140],[100,150],[105,157],[110,165]]),
  usTarget: 'enemies',
  usHits: [1], 
  usSoul: 5,
  es: ['强援弱', '生先死', '行胜思'],
  attributes: [
    {defRate: 5.0}, {defRate: 5.0}, {defRate: 7.5}, {defRate: 7.5}, {defRate: 10.0},
    {hpRate: 4.0}, {hpRate: 6.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 8.0},
  ],
  defaultJson: {
    weapon:'记忆的质料', name4: '戍卫风雪的铁卫', name2: '筑城者的贝洛伯格',
    body: 'defRate', foot: 'defRate', link:'defRate', ball:'defRate',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai: {
    na: ai.na_default,
    ns: ai.ns_sp_gt(2),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'alive',
    main: {
      foot: 'speed',
      link: 'enRate',
    },
    set4:['戍卫风雪的铁卫', '戍卫风雪的铁卫']
  },
};

class SsrTrailblazerPre extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { shieldR, shield } = this.getPsShield();
    const list = [
      Buff.getListJson(this, DebuffTaunt, [Buff.simpleListener()],'',{ name: '嘲讽', source:'战技' }),
      Buff.getListJson(this, BuffBlock, [Buff.simpleListener()], '', {
        damageRate: this.skillData.ns.block, name: '不灭的琥珀', source:'战技', maxValue: 1,
      }),
      Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: 30, shield: 384, baseAttr: 'def', name: '守护者召令', source:'秘技', maxValue: 1,
      }),
      Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR, shield, baseAttr: 'def', name: '筑城者遗宝', source:'天赋', maxValue: 1, target:'member',
      }),
    ];
    if(this.checkES('强援弱')){
      list.push(Buff.getListJson(this, BuffBlock, [Buff.simpleListener()], '', {
        damageRate: 15, name: '强援弱', source:'天赋', target: 'member', maxValue: 1,
      }));
    }
    if(this.checkES('行胜思')){
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.eventListener('TURN_E', 'self')], '', {
        atkRate: 15, name: '行胜思', source:'天赋', maxValue: 1,
      }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffDefRate, [], '', { defRate: 10, name: '防御增加', source:'星魂', maxValue: 3 }));
    }
    return list;
  }
  getStateExText() {
    const {bonusCount, bonusNA} = this.state;
    return `${(bonusCount>=4 || bonusNA)?'已':'未'}强化(${bonusCount || 0})`;
  }
  getStateExData() {
    return this.state.bonusCount || 0;
  }
  updateReport(enemy){
    const options = this.checkES('行胜思')? {others:[['天赋回能', 5]]}: {};
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getDefendReport(enemy),
        ...R.getEnergyReport(this, options),
        ...R.getActionReport(this),
        
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    if(!this.state.bonusNA && (this.state.bonusCount || 0)<4 ) {
      this.addBonusCount(1);
      return super.castNA(target);
    }
    const hits = this.base.naHitsD;
    this.actionAttack(cb=>cb(), 'NA', target, 'diff', 20, this.rawDiffFunc(2, 1, 'na', 'ratePlus', 'rateDiff'), hits, hits);
    if(this.state.bonusNA) {
      this.state.bonusNA = false;
    } else {
      this.state.bonusCount -= 4;
    }
    if(this.checkES('生先死')) this.triggerHeal([this], this.getAttr('hp') * 0.05);
    if(this.checkSoul(6)) this.addBuff(Buff.getKey(this.name, '星魂', '防御增加'), this, 1);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(Buff.getKey(this.name, '战技', '不灭的琥珀'), this, 1, { count: 3 });
      this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(Buff.getKey(this.name, '战技', '嘲讽'), e, 1, {count:1}, 1));
      if(this.checkES('强援弱')) {
        this.team.getAliveUnits('members').forEach(m => this.addBuff(Buff.getKey(this.name, '天赋', '强援弱'), m, 1));
      }
    });
    this.addEn(30);
    this.addBonusCount(1);
  }
  castUS(target){
    super.castUS(target);
    const { rateA, rateD } = this.skillData.us;
    this.actionAttack(cb=>cb(), 'US', target, 'all', 5, ()=>{
      return { brkDmg:2, raw: (this.getAttr('atk') * rateA + this.getAttr('def') * rateD) * 0.01 }
    }, baseData.usHits);
    if(this.checkSoul(6)) this.addBuff(Buff.getKey(this.name, '星魂', '防御增加'), this, 1);
    this.state.bonusNA = true;
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '守护者召令'), this, 1, { count: 1 });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    switch(e) {
     case 'TURN_S':
      if(this.checkES('行胜思') && this.findBuff({tag:'shield'})) {
        this.addBuff(Buff.getKey(this.name, '天赋', '行胜思'), this, 1);
        this.addEn(5);
      }
      break;
    case 'ACT_E':
      if(D.checkType(data.type,['NA','NS','US'])){
        this.team.getAliveUnits('members').forEach(m =>{
          this.addBuff(Buff.getKey(this.name, '天赋', '筑城者遗宝'), m, 1, { count: 2 });
        });
      }
      break;
    case 'B_DMG_E':
      this.addBonusCount(1);
      break;
    case 'C_DMG_E':
      if(this.checkSoul(1) && D.checkType(data.type, 'NA')) {
        A.newAddDmg(this, this, data.targets, this.getAttr('def')*(data.atkType==='single'? 0.25: 0.5));
      }
      break;
    case 'BTL_S':
      if(this.state.spActivated) this.onSP();
      if(this.checkSoul(4)) this.state.bonusCount = 4;
      break;
    default:
      break;
    }
    super.onEvent(e, unit, data);
  }
  getPsShield() {
    const b = this.checkSoul(2);
    const ps = this.skillData.ps;
    return { shieldR: ps.shieldR + (b? 2: 0), shield: ps.shield + (b? 27:0) };
  }
  addBonusCount(n) {
    this.state.bonusCount = Math.min(8, (this.state.bonusCount || 0) + n);
  }
  getDamageReport(enemy) {
    const atk = this.getAttr('atk')*0.01;
    const def = this.getAttr('def')*0.01;
    const { na, us } = this.skillData;
    const soul1 = this.checkSoul(1);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(atk * na.rate + (soul1? def*25: 0), [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[中心]', brkDmg: brkDmg*2}, C.calDmg(atk * na.ratePlus + (soul1? def*50: 0), [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[扩散]', brkDmg}, C.calDmg(atk * na.rateDiff + (soul1? def*50: 0), [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg * 2}, C.calDmg(atk * us.rateA + def * us.rateD, [ 'Fire', 'US' ], this, enemy)),
      Object.assign({ type:'hit', name: '战技命中率', labels:['嘲讽命中率'], hit0: C.calHitRate(1, this, enemy)}),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getDefendReport(enemy) {
    const def = this.getAttr('def')*0.01;
    const ps = this.skillData.ps;
    const soul2 = this.checkSoul(2);
    const list = R.getDefendReport(this, enemy).concat([
      { type:'shield', name: '天赋[护盾]', shield: C.calShieldData(def * (ps.shieldR + (soul2? 2: 0)) + ps.shield + (soul2? 27: 0), this, this)},
    ])
    if(this.checkES('生先死'))list.push({type:'heal', name:'强化普攻[回复]', labels: ['治疗量'], heal0: C.calHealData(this.getAttr('hp') * 0.05, this, this)});
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrTrailblazerPre,
};