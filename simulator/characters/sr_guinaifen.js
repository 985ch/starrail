'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffWeakAll, DebuffDodge } = require('../debuff_simple');

const baseData = {
  name: '桂乃芬',
  image: 'guinaifen.jpg',
  rarity: 'SR',
  job: '虚无',
  type: 'Fire',
  damages: ['DOT','NS'],
  hp: D.levelData['120_882'],
  atk: D.levelData['79_582'],
  def: D.levelData['60_441'],
  speed: 106,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['rateC', 'rateD', 'dotRate'],
    [62, 20, 83],
    [66, 22, 92],
    [72, 24, 100],
    [78, 26, 109],
    [84, 28, 117],
    [90, 30, 130],
    [97, 32, 146],
    [105, 35, 167],
    [112, 37, 193],
    [120, 40, 218],
    [126, 42, 229],
    [132, 44, 240],
  ]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['weakAll'],[4.0],[4.3],[4.6],[4.9],[5.2],[5.5],[5.8],[6.2],[6.6],[7.0],[7.3],[7.6]]),
  psSoul: 5,
  us: D.makeTable([
    ['rate', 'percent'],
    [72.0, 72],
    [76.8, 74],
    [81.6, 76],
    [86.4, 78],
    [91.2, 80],
    [96.0, 82],
    [102.0, 84],
    [108.0, 87],
    [114.0, 89],
    [120.0, 92],
    [124.8, 94],
    [129.6, 96],
  ]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '缘竿', '投狭', '逾锋' ],
  attributes: [
    { bonusFire: 3.2 }, { bonusFire: 3.2 }, { bonusFire: 4.8 }, { bonusFire: 4.8 }, { bonusFire: 6.4 },
    { hit: 4.0 }, { hit: 6.0 }, { breakRate: 5.3 }, { breakRate: 8.0 }, { breakRate: 10.7 },
  ],
  defaultJson: {
    weapon:'决心如汗珠般闪耀', name4: '幽锁深牢的系囚', name2: '太空封印站',
    body: 'hit', foot: 'speed', link:'atkRate', ball:'bonusFire',
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_buff_noT("桂乃芬$战技$灼烧."),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgDOT',
    attrs: {
      hit:[1000, 0, 30],
    },
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusFire',
    },
    set4: ['幽锁深牢的系囚', '幽锁深牢的系囚'],
  },
};

class BuffGuinaifen extends Buff {
  static info() {
    return {
      name: '桂乃芬天赋',
      short: '特殊',
      source: '天赋',
      desc: '桂乃芬',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    if(m.checkSoul(4))this.listen({e:'B_HIT_E', t:'enemies', f:(buff, unit, data)=>{
      if(D.checkType(data.type,'DOT') && data.attrType==='Fire') {
        m.addBuffRandom(Buff.getKey(baseData.name, '天赋', '吞火'), unit, 1, {count:3}, 1);
        if(data.member === m && data.options && !data.options.noAuto)m.addEn(2);
      }
    }});
  }
  getAttributesT(target) {
    const m = this.member;
    if(!m.checkES('逾锋')) return {};
    const isBurning = target.findBuff({ tag: '灼烧' }) !== null;
    return isBurning? {bonusAll:20}: {};
  }
}
class DotFire extends Buff {
  static info() {
    return {
      name: '灼烧',
      short: '灼烧',
      source: '战技',
      desc: '每回合受到火属性伤害',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['dot','debuff','removable','灼烧'],
    }
  }
  init() {
    this.data = {type:'Fire'}
  }
  getDesc() {
    return `每回合受到${Math.floor(this.getData())}点火属性伤害。`;
  }
  getData() {
    const m = this.member;
    const bonus = m.checkSoul(2) && this.target.findBuff({ tag: '灼烧' })? 40: 0;
    const base = m.getAttr('atk') * (m.skillData.ns.dotRate + bonus) * 0.01;
    const damage = m.getAdditionDamage(base, this.target, 'Fire', true);
    return damage.damage;
  }
}

class SrGuinaifen extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffGuinaifen),
      Buff.getListJson(this, DotFire, [Buff.dotListener()]),
      Buff.getListJson(this, DebuffWeakAll, [Buff.simpleListener()], '', {
        weakAll: this.skillData.ps.weakAll, name: '吞火', source: '天赋', maxValue: this.checkSoul(6)? 4: 3,
      })
    ];
    if(this.checkSoul(1)){
      list.push(Buff.getListJson(this, DebuffDodge, [Buff.simpleListener()], '', {
        dodge: 10, name: '抵抗降低', source: '星魂',  maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const others = [];
    if(this.checkSoul(4))others.push(['灼烧回能', 2]);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others}),
        ...this.getActionReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    super.castNA(target, 'atk', cb=>{
      cb();
      if(this.checkES('缘竿'))this.addBuffRandom(Buff.getKey(this.name, '战技', '灼烧'),target,1,{count:2}, 0.8, 1, false, true);
    });
  }
  castNS(target) {
    super.castNS(target);
    const targets = A.getTargets(this, 'diff', target);
    const hits = baseData.nsHits;
    this.actionAttack(cb=>{
      if(this.checkSoul(1)) {
        const debuffKey = Buff.getKey(this.name, '星魂', '抵抗降低');
        targets.forEach(e => this.addBuffRandom(debuffKey, e, 1, { count: 2 }, 1));
      }
      cb();
      const dotKey = Buff.getKey(this.name, '战技', '灼烧');
      targets.forEach(e => e.checkAlive() && this.addBuffRandom(dotKey, e, 1, { count: 2 }, 1, 1, false, true));
    },'NS', target, 'diff', 30, this.rawDiffFunc(2, 1, 'ns', 'rateC', 'rateD'), hits, hits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      this.team.getAliveUnits('enemies').forEach(e => {
        const buffs = e.filterBuffs({tag:'灼烧'});
        if(buffs.length<=0)return;
        buffs.forEach(buff => buff.triggerDot('DOT', this.skillData.us.percent*0.01, { noCrit:true, noAuto:true}));
      })
    },'US', target, 'all', 5, this.rawFunc(2,'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      const targets = this.team.getAliveUnits('enemies');
      const debuffKey = Buff.getKey(this.name, '天赋', '吞火');
      const getHitInfo = ()=>[{t:D.sample(this.team.getAliveUnits('enemies')) || targets[0], r:1}];
      A.triggerDmg({type: 'SP', member:this, target:'enemies', attrType:'Fire', count: 4, en:0, options:{getHitInfo}, rawDmg: (idxT, idxH, hitInfo)=>{
        this.addBuffRandom(debuffKey, hitInfo.t, 1, { count:3 }, 1)
        return { brkDmg: 1, raw: this.getAttr('atk') * 0.5}
      }})
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('投狭'))this.changeWaitTime(-25);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const isBurning = enemy.findBuff({ tag: '灼烧' })!== null;
    const dotBuffs = enemy.filterBuffs({tag: '灼烧'});
    const dotDamage = this.countDotDamage(dotBuffs, us.percent);
    const nsDotDmg = C.calDmg(base*(ns.dotRate + ((isBurning && this.checkSoul(2))? 40: 0)), ['Fire', 'DOT'], this, enemy, {simpleMode:true});
    const hitRate = C.calHitRate(1, this, enemy, 1, false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({
        type: 'damage', name:'普攻', brkDmg, hitRate: this.checkES('缘竿')? C.calHitRate(0.8, this, enemy, 1, false, true): 0
      }, C.calDmg(base * na.rate, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[目标]', brkDmg: brkDmg*2, hitRate}, C.calDmg(base * ns.rateC, ['Fire','NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg, hitRate}, C.calDmg(base * ns.rateD, ['Fire','NS'], this, enemy)),
      { type:'dot', name:'战技[灼烧]', damage: nsDotDmg, turn: 2, totalDamage: nsDotDmg*2, hitRate },
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate}, C.calDmg(base * us.rate, ['Fire','US'], this, enemy)),
      { type:'damage', name:'终结技[引爆]', damage: dotDamage, expDamage:dotDamage },
      Object.assign({ type: 'damage', name:'秘技', brkDmg:1, hitRate, tip:'随机攻击4次'}, C.calDmg(base * 50, ['Fire','SP'], this, enemy)),
      R.getBreakReport(this, enemy),
      { type:'hit', name: '吞火[命中]', labels:['命中率'], hit0: hitRate }
    ];
  }
  getActionReport() {
    const list = R.getActionReport(this);
    list.push({ type:'action', name:'首次行动', wait: this.calActionTime()*0.75 })
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
  character: SrGuinaifen,
};