'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDot, DebuffWeakAll } = require('../debuff_simple');
const { BuffDamage, BuffAtkRate } = require('../buff_simple');

const baseData = {
  name: '卢卡',
  image: 'luka.jpg',
  rarity: 'SR',
  job: '虚无',
  type: 'Physical',
  damages: ['DOT','US'],
  hp: D.levelData['124_917'],
  atk: D.levelData['79_582'],
  def: D.levelData['66_485'],
  speed: 103,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 130,
  na: D.makeTable([
    ['rate','rateA','rateB'],
    [50, 10, 40],
    [60, 12, 48],
    [70, 14, 56],
    [80, 16, 64],
    [90, 18, 72],
    [100, 20, 80],
    [110, 22, 88],
  ]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate','limit'],[60,130],[66,143],[72,156],[78,169],[84,182],[90,201],[97,227],[105,260],[112,299],[120,338],[126,354],[132,371]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['percent'],[68],[69],[71],[73],[74],[76],[78],[80],[82],[85],[86],[88]]),
  psSoul: 3,
  us: D.makeTable([['weakAll','rate'],[12,198],[12.8,211],[13.6,224],[14.4,237],[15.2,250],[16,264],[17,280],[18,297],[19,313],[20,330],[20.8,343],[21.6,356]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: ['动能过载','循环制动','粉碎斗志'],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 8.0 },
  ],
  defaultJson: {
    weapon:'决心如汗珠般闪耀', name4: '街头出身的拳王', name2: '繁星竞技场',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusPhysical',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai:{
    na: ai.na_default,
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["selected"]},{t:"buff",v:["t","key","卢卡$战技$裂伤.","no",0]}],
        [{t:"target",v:["buff","key","卢卡$战技$裂伤.","no","yes"]},{t:"buff",v:["t","key","卢卡$战技$裂伤.","no",0]},{t:"sp",v:["gt",2]}]
      ]
    },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgDOT',
    attrs: {
      hit:[1000, 0, 50],
    },
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusPhysical',
    },
    set4: ['幽锁深牢的系囚', '幽锁深牢的系囚'],
  },
};
class SrLuka extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { ns, us } = this.skillData;
    const list = [
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate: ns.limit, count: 3, hpRate: 24, baseAttr:'atk', type:'Physical', name:'裂伤', source:'战技'
      }),
      Buff.getListJson(this, DebuffWeakAll, [Buff.simpleListener()],'',{
        weakAll: us.weakAll, name:'易伤', source:'终结技', maxValue:1,
      }),
    ];
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: 15, name:'争斗不休', source:'星魂', maxValue:1,
      }));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffAtkRate, [], '', {
        atkRate: 5, name:'百折不回', source:'星魂', maxValue:4,
      }));
    }
    return list;
  }
  getStateExText() {
    const count = this.state.bonusCount || 0;
    return `${(count>=2)?'已':'未'}强化(${count})`;
  }
  getStateExData() {
    return this.state.bonusCount || 0;
  }
  updateReport(enemy){
    const options = this.checkES('循环制动')? {others:[['获得斗志', 3]]}: {};
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, options),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    if((this.state.bonusCount || 0)<2 ) {
      this.changeBonusCount(1);
      return super.castNA(target);
    }
    this.changeBonusCount(-2);
    const na = this.skillData.na;
    const hits = [1, 1, 1, 4];
    if(this.checkES('粉碎斗志')) {
      for(let i=0; i<3; i++) {
        if(Math.random()<0.5) hits.unshift(1);
      }
    }
    this.actionAttack(cb=>cb(), 'NA', target, 'single', 20/7, (idxT, idxH)=>{
      if(idxH === hits.length - 1) return { brkDmg:1, raw: this.getAttr('atk')*0.01*na.rateB}
      return { brkDmg: 1/3, raw: this.getAttr('atk')*0.01*na.rateA }
    }, hits, null, { naPlus: true });
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    if(this.checkES('动能过载'))target.removeABuff('buff');
    this.actionAttack(cb=>{
      const bonusCount = (this.checkSoul(2) && target.findBuff({tag:'weakPhysical'}))? 2 : 1;
      this.changeBonusCount(bonusCount);
      cb();
      this.addBuffRandom(Buff.getKey(this.name, '战技', '裂伤'), target, 1, {}, 1, 1, false, true);
    }, 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb => {
      this.changeBonusCount(2);
      this.addBuffRandom(Buff.getKey(this.name, '终结技', '易伤'), target, 1, {count: 3}, 1);
      cb();
    },'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      const target = D.sample(this.team.getAliveUnits('enemies'));
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 50), 'single', target);
      this.addBuffRandom(Buff.getKey(this.name, '战技', '裂伤'), target, 1, {}, 1, 1, false, true);
      this.changeBonusCount(1);
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_HIT_E') {
      if(D.checkType(data.type,'NA') && data.options && data.options.naPlus && data.idxH===data.idxMH) {
        this.triggerDotDamage(data.target, data.idxH);
      }
    } else if(e==='ACT_S') {
      if(this.checkSoul(1) && data.target.findBuff({tag:'裂伤'})){
        this.addBuff(Buff.getKey(baseData.name, '星魂', '争斗不休'), this, 1, {count:2});
      }
    }
    super.onEvent(e, unit, data);
  }
  changeBonusCount(change) {
    const count = this.state.bonusCount || 0;
    change = change>0? Math.min(change, 4-count): Math.max(change, -count);
    if(change>0 && this.checkES('循环制动')) this.addEn(3*change);
    if(change>0 && this.checkSoul(4)) this.addBuff(Buff.getKey(baseData.name, '星魂', '百折不回'), this, 1);
    this.state.bonusCount = count + change;
  }
  triggerDotDamage(enemy, hitCount) {
    const buffs = enemy.filterBuffs({tag:'裂伤'});
    if(buffs.length<=0)return;
    const bonusCount = this.checkSoul(6)? hitCount-1: 0;
    buffs.forEach(buff => {
      buff.triggerDot('DOT', this.skillData.ps.percent*0.01, { noCrit:true, noAuto:true});
      for(let i=0; i<bonusCount; i++) {
        buff.triggerDot('DOT', 0.08, { noCrit:true, noAuto:true});
      }
    });
  }
  getDamageReport(enemy) {
    const atk = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const naTypes = ['Physical', 'NA'];
    const dotBuffs = enemy.filterBuffs({tag: '裂伤'});
    const dotDamage = this.countDotDamage(dotBuffs, ps.percent);
    const nsDotDmg = C.calDmg( Math.min(atk * ns.limit, enemy.getAttr('hp') * 0.24 ), ['Physical', 'DOT'], this, enemy, {simpleMode:true});
    const tip = this.checkES('粉碎斗志')?'3/6(12.5%),4/5(37.5%)段': '共3段';
    const hitRate = C.calHitRate(1, this, enemy, 1, false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(atk * na.rate, naTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[小]', brkDmg:brkDmg/3, tip}, C.calDmg(atk * na.rateA, naTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[大]', brkDmg}, C.calDmg(atk * na.rateB, naTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(atk * ns.rate, ['Physical', 'NS'], this, enemy)),
      { type:'dot', name:'战技[裂伤]', damage: nsDotDmg, turn: 3, totalDamage: nsDotDmg*3, hitRate },
      Object.assign({
        type: 'damage', name:'终结技', brkDmg: brkDmg*3, hitRate:C.calHitRate(1, this, enemy)
      }, C.calDmg(atk * us.rate,['Physical', 'US'], this, enemy, { isUS:true })),
      Object.assign({ type: 'damage', name:'秘技', brkDmg }, C.calDmg(atk * 50, ['Physical', 'SP'], this, enemy)),
      { type:'damage', name:'天赋[引爆]', damage: dotDamage, expDamage:dotDamage },
    ];
    if(this.checkSoul(6)) {
      const dotDamageP = this.countDotDamage(dotBuffs, 8);
      list.push({ type:'damage', name:'星魂6[引爆]', tip:'强化普攻引爆3~6次', damage: dotDamageP, expDamage:dotDamageP });
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  countDotDamage(buffs, percent) {
    return buffs.reduce( (total, buff) =>{
      let dmg = buff.getData();
      return total + ((typeof dmg === 'number')? dmg: dmg.damage);
    }, 0) * percent * 0.01;
  }
}

module.exports = {
  data: baseData,
  character: SrLuka,
};