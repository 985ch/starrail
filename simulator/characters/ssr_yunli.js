'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffTaunt } = require('../debuff_simple');
const { BuffAtkRate, BuffDodge } = require('../buff_simple');
const { getDiffTargets } = require('../action');

const baseData = {
  name: '云璃',
  image: 'yunli.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Physical',
  damages: ['NS','AA'],
  hp: D.levelData['184_1358'],
  atk: D.levelData['92_679'],
  def: D.levelData['62_460'],
  speed: 94,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 240,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['rateC','rateD','healRate','heal'],
    [ 60, 30, 20, 50],
    [ 66, 33, 21.25, 80],
    [ 72, 36, 22.5, 102.5],
    [ 78, 39, 23.75, 125],
    [ 84, 42, 25, 140],
    [ 90, 45, 26, 155],
    [ 97.5, 48.75, 27, 166.25],
    [ 105, 52.5, 28, 177.5],
    [ 112.5, 56.25, 29, 188.75],
    [ 120, 60, 30, 200],
    [ 126, 63, 31, 211.25],
    [ 132, 66, 32, 222.5],
    [ 138, 69, 33, 233.75],
    [ 144, 72, 34, 245],
    [ 150, 75, 35, 256.25],
  ]),
  nsTarget: 'enemy',
  nsHits: [0.25, 0.25, 0.25, 0.25],
  nsSoul: 5,
  ps: D.makeTable([['rateC','rateD'],[60,30],[66,33],[72,36],[78,39],[84,42],[90,45],[97.5,48.75],[105,52.5],[112.5,56.25],[120,60],[126,63],[132, 66],[138,69],[144,72],[150,75]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([
    ['rateC', 'rateD', 'rateA', 'criDamage'],
    [132, 66, 43.2, 60],
    [140.8, 70.4, 46.08, 64],
    [149.6, 74.8, 48.96, 68],
    [158.4, 79.2, 51.84, 72],
    [167.2, 83.6, 54.72, 76],
    [176, 88, 57.6, 80],
    [187, 93.5, 61.2, 85],
    [198, 99, 64.8, 90],
    [209, 104.5, 68.4, 99],
    [220, 110, 72, 100],
    [228.8, 114.4, 74.88, 104],
    [237.6, 118.8, 77.76, 108],
    [246.4, 123.2, 80.64, 112],
    [255.2, 127.6, 83.52, 116],
    [264, 132, 86.4, 120],
  ]),
  usTarget: 'self',
  usHits: [1],
  usSoul: 3,
  es: ['灼毂', '却邪', '真刚'],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {criRate: 2.7}, {criRate: 4.0}, {hpRate: 4.0}, {hpRate: 6.0}, {hpRate: 8.0}
  ],
  defaultJson: {
    weapon:'落日时起舞', name4: '街头出身的拳王', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusPhysical',
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
const buffUsKey = Buff.getKey(baseData.name, '终结技', '格挡');
class BuffBlock extends Buff {
  static info() {
    return {
      name: '格挡',
      short: '格挡',
      source: '终结技',
      desc:'进入格挡状态并随时准备反击',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.state.skip = m.team.getActionUnit(m).name;
    this.listen({e:'TURN_E', t:'members', f:(buff, unit, data)=>{
      if(this.state.skip === unit.name) {
        this.state.skip = null;
      } else {
        m.castCounter(null, false);
        this.state.count = 0;
      }
    }});
    this.listen({e:'TURN_E', t:'enemies', f:(buff, unit, data)=>{
      if(this.state.skip === unit.name) {
        this.state.skip = null;
      } else {
        m.castCounter(null, false);
        this.state.count = 0;
      }
    }});
    if(m.checkSoul(6)) this.listen({e:'ACT_E', t:'enemies', f:(buff, unit, data)=>{
      m.castCounter(unit, true);
      this.state.count = 0;
    }});
  }
  blockDebuff(member, target, info) {
    return this.member.checkES('却邪') && info.tags.includes('控制'); 
  }
  getAttributes() {
    return this.member.checkES('却邪')?{ damageRate: 0.8 }: null;
  }
}
class SsrYunli extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffBlock),
      Buff.getListJson(this, DebuffTaunt, [Buff.simpleListener(true,'members'),Buff.simpleListener(true,'enemies')],'',{ name: '嘲讽', source:'终结技' }),
    ];
    if(this.checkES('真刚')){
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()],'', {
        atkRate: 30, name: '真刚', source:'天赋', maxValue: 1
      }));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffDodge, [Buff.simpleListener()],'', {
        dodge: 50, name: '大匠击橐', source:'星魂', maxValue:1,
      }))
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
    return val===2? '强化格挡': (val===1? '格挡': '-');
  }
  getStateExData() {
    const buff = this.findBuff({key: buffUsKey});
    return { counterPlus: buff? (this.state.counterPlus? 2: 1): 0 };
  }
  updateReport(enemy){
    const others = [['受击', 15]];
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others }),
        ...R.getActionReport(this),
        ...this.getDefendReport(enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    const ns = this.skillData.ns;
    this.actionAttack(cb=>{
      this.triggerHeal([this], this.getAttr('atk') * 0.01 * ns.healRate + ns.heal);
      cb();
    }, 'NS', target, 'diff', 30, this.rawDiffFunc(2, 1, 'ns', 'rateC', 'rateD'), baseData.nsHits, baseData.nsHits);
  }
  checkDisableUS() {
    return  !this.checkAlive() || this.state.en < 120 || this.findBuff({tag:'freeze'})
  }
  castUS(target){
    this.state.en -= 120;
    A.actionBase({type:'US', member:this, target: this}, ()=>{
      this.team.getAliveUnits('enemies').forEach(tar => this.addBuff(Buff.getKey(this.name, '终结技', '嘲讽'), tar, 1, { count: 1 }));
      this.addBuff(buffUsKey, this, 1, { count: 1 });
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.castCounter(null, true, true);
  }
  castCounter(target, isPlus = false, isSp = false) {
    if(this.state.activatedAA) return;
    this.state.activatedAA = true;

    const buff = this.findBuff({key: buffUsKey});
    isPlus = isPlus || this.state.counterPlus;
    const func = cb => {
      if(this.checkES('真刚')) this.addBuff(Buff.getKey(this.name, '天赋','真刚'), this, 1, { count: 1 });
      cb();
      if(this.checkSoul(4) && (buff || isSp)) this.addBuff(Buff.getKey(this.name, '星魂', '大匠击橐'), this, 1, { count: 1});
      this.state.activatedAA = false;
      this.addEn(5);
    }
    const fixed = this.getCounterFixed(buff, isSp);
    if(!buff && !isSp) {
      this.castAdditionAttack(target, 'diff', 0, this.rawDiffFunc(1, 0.5, 'ps', 'rateC', 'rateD', 'atk'), baseData.psHits, baseData.psHits, { fixed }, func);
    } else {
      if(!isPlus) {
        if(this.checkES('灼毂')) this.state.counterPlus = 1;
      } else {
        this.state.counterPlus = 0;
      }
      this.castCounterPlus(target, isPlus, fixed, func);
    }
    if(buff) this.removeBuff(buff);
  }
  castCounterPlus(target, isPlus, fixed, func) {
    const { us } = this.skillData;
    const count = isPlus? (this.checkSoul(1)? 10: 7): 1;
    let lastTarget = target;
    const getHitInfo = (i, targets) => {
      if(i===0) {
        const hitTargets = getDiffTargets(targets, target).map((t)=>({t: t, r: 1}));
        lastTarget = hitTargets[0] || lastTarget;
        return hitTargets;
      }
      lastTarget = D.sample(this.team.getAliveUnits('enemies')) || lastTarget;
      return [{t: lastTarget, r: 1}];
    }
    target = target || D.sample(this.team.getAliveUnits('enemies'));
    const data = {
      type: isPlus? 'YunliAA': 'AA',
      atkType: 'diff', en: 0, func,
      target, count, options: { fixed, getHitInfo },
      rawDmg: (idxM, idxH) => {
        const base = this.getAttr('atk') * 0.01;
        if(idxH===0) {
          return {
            brkDmg: idxM===0? 1: 0.5,
            raw: base * (idxM===0?us.rateC:us.rateD),
          }
        }
        return { brkDmg: 0.5, raw: base * us.rateA}
      }
    }
    this.pushAction(data);
  }
  castAction(data) {
    let target = data.target;
    if(data.type==='YunliAA') {
      data.type = ['US', 'AA'];
      data.member = this;
      if(!target.checkAlive()) target = D.sample(this.team.getAliveUnits('enemies'));
      data.target = target;
      this.team.logger.startAction(this, {text:'追击', key: null, target});
      A.actionBase({type:'AA', member:this, target }, ()=> {
        data.func(()=> A.triggerAttack(data, ()=>A.simpleDmg(this.base.type, data.en, data.rawDmg)))
      });
      return;
    }
    return super.castAction(data);
  }
  getCounterFixed(hasUsBuff, isSp) {
    const defDown = this.checkSoul(2)? 20: 0;
    if(!hasUsBuff && !isSp) return { defDown };
    return {
      defDown,
      criDmg: this.skillData.us.criDamage,
      bonus: (this.checkSoul(1)? 20: 0) + (isSp? 80: 0),
      crit: this.checkSoul(6)? 15: 0,
      defend: this.checkSoul(6)? -20: 0,
    };
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated)this.onSP();
    } else if(e==='B_DMG_E') {
      this.addEn(15);
      this.castCounter(data.member, true, false);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const fixedN = this.getCounterFixed(false, false);
    const fixedP = this.getCounterFixed(true, false);
    const fixedS = this.getCounterFixed(false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Physical', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg * 2 }, C.calDmg(base * ns.rateC, ['Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, ['Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'反击[中心]', brkDmg }, C.calDmg(base * ps.rateC, ['Physical', 'AA'], this, enemy, null, fixedN)),
      Object.assign({ type: 'damage', name:'反击[扩散]', brkDmg: brkDmg*0.5 }, C.calDmg(base * ps.rateD, ['Physical', 'AA'], this, enemy, null, fixedN)),
      Object.assign({ type: 'damage', name:'强化反击[中心]', brkDmg}, C.calDmg(base * us.rateC,  ['Physical', 'AA', 'US'], this, enemy, null, fixedP)),
      Object.assign({ type: 'damage', name:'强化反击[扩散]', brkDmg: brkDmg*0.5}, C.calDmg(base * us.rateD,  ['Physical', 'AA', 'US'], this, enemy, null, fixedP)),
      Object.assign({ type: 'damage', name:'强化反击[追加]', brkDmg: brkDmg*0.5}, C.calDmg(base * us.rateA,  ['Physical', 'AA', 'US'], this, enemy, null, fixedP)),
      Object.assign({ type: 'damage', name:'秘技[中心]', brkDmg}, C.calDmg(base * us.rateC,  ['Physical', 'SP', 'US'], this, enemy, null, fixedS)),
      Object.assign({ type: 'damage', name:'秘技[扩散]', brkDmg: brkDmg*0.5}, C.calDmg(base * us.rateD,  ['Physical', 'SP', 'US'], this, enemy, null, fixedS)),
      Object.assign({ type: 'damage', name:'秘技[追加]', brkDmg: brkDmg*0.5}, C.calDmg(base * us.rateA,  ['Physical', 'SP', 'US'], this, enemy, null, fixedS)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    const ns = this.skillData.ns;
    list.push({ type:'heal', name:'战技回血', labels: ['治疗量'], heal0: C.calHealData(this.getAttr('atk') * 0.01 * ns.healRate + ns.heal, this, this) });
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrYunli,
};