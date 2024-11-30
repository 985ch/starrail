'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { DebuffDot, DebuffWeakType } = require('../debuff_simple');
const { BuffBonus } = require('../buff_simple');

const baseData = {
  name: '卡芙卡',
  image: 'kafka.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Thunder',
  damages: ['DOT','NS'],
  hp: D.levelData['147_1086'],
  atk: D.levelData['92_679'],
  def: D.levelData['66_485'],
  speed: 100,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.5, 0.5],
  naSoul: 3,
  ns: D.makeTable([
    ['rateC', 'rateD', 'percent'],
    [80, 30, 60],
    [88, 33, 61],
    [96, 36, 63],
    [104, 39, 64],
    [112, 42, 66],
    [120, 45, 67],
    [130, 48, 69],
    [140, 52, 71],
    [150, 56, 73],
    [160, 60, 75],
    [168, 63, 76],
    [176, 66, 78],
  ]),
  nsHitsC: [0.2, 0.3, 0.5],
  nsHitsD: [0, 0, 1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[42],[51],[61],[71],[81],[91],[103],[115],[127],[140],[149],[159]]),
  psHits: [0.15,0.15,0.15,0.15,0.15,0.25],
  psSoul: 5,
  us: D.makeTable([
    ['rate', 'percent', 'dotRate'],
    [48, 80, 115],
    [51, 82, 126],
    [54, 84, 137],
    [57, 86, 148],
    [60, 88, 159],
    [64, 90, 175],
    [68, 92, 197],
    [72, 95, 224],
    [76, 97, 257],
    [80, 100, 290],
    [83, 102, 304],
    [86, 104, 318],
  ]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '折磨', '掠夺', '荆棘' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 8.0 },
  ],
  defaultJson: {
    weapon:'只需等待', name4: '幽锁深牢的系囚', name2: '苍穹战线格拉默',
    body: 'atkRate', foot: 'speed', link:'atkRate', ball:'bonusThunder',
  },
  equipSetting: {
    rule: 'dmgDOT',
    main: {
      body: 'atkRate',
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusThunder',
    },
    set4: ['幽锁深牢的系囚', '幽锁深牢的系囚'],
    set2: '苍穹战线格拉默'
  },
};
class BuffKafka extends Buff {
  static info() {
    return {
      name: '卡芙卡天赋',
      short: '特殊',
      source: '天赋',
      desc: '卡芙卡',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'C_DMG_E', t:'members', f:(buff, unit, data)=>{
      if(D.checkType(data.type, 'NA') && unit!==m) m.castPS(data.targets[0]);
    }});
    if(m.checkES('掠夺'))this.listen({e:'B_KILL', t:'enemies', f:(buff, unit, data)=>{
      if(unit.findBuff({tag:'触电'})) m.addEn(5);
    }});
    if(m.checkSoul(4))this.listen({e:'B_HIT_E', t:'enemies', f:(buff, unit, data)=>{
      if(D.checkType(data.type,'DOT') && data.attrType==='Thunder' && data.member === m) {
        if(data.options && !data.options.noAuto)m.addEn(2); // 不确定主动触发的算不算，先加着先
      }
    }});
  }
}

class SsrKafka extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const rate = this.skillData.us.dotRate + (this.checkSoul(6)? 156: 0);
    const count = this.checkSoul(6)?3:2;
    const list = [
      Buff.getListJson(this, BuffKafka),
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate, count, baseAttr:'atk', type:'Thunder', name:'触电', source:'终结技'
      }),
    ];
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, DebuffWeakType, [Buff.simpleListener()], '', {
        type:'DOT', weakDOT: 30, name:'持续伤害易伤', source:'星魂', maxValue:1, 
      }));
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffBonus, [], 'bonus', {
        type:'DOT', bonusDOT: 25, name: '持续伤害提高', source: '星魂', maxValue: 1, hide: true, target: 'members',
      }));
    }
    return list;
  }
  getStateExText() {
    return this.state.psActivated?'已追击':'可追击';
  }
  updateReport(enemy){
    const others = [];
    if(this.checkES('掠夺'))others.push(['触电击杀', 5]);
    if(this.checkSoul(4))others.push(['触电回能', 2]);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, {others}),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      cb();
      this.triggerDotDamage(target, true, this.skillData.ns.percent);
    }, 'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rateC','rateD','atk'), baseData.nsHitsC, baseData.nsHitsD);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      const allDot = this.checkES('折磨');
      this.team.getAliveUnits('enemies').forEach(e => {
        this.addUSDot(e, 1);
        this.triggerDotDamage(e, allDot, this.skillData.us.percent);
      })
    }, 'US', target, 'all', 5, this.rawFunc(2,'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this, 2, this.rawFuncRate(0, 50));
      this.team.getAliveUnits('enemies').forEach(e => this.addUSDot(e, 1));
    });
  }
  castPS(target) {
    if(this.state.psActivated) return;
    this.castAdditionAttack(target, 'single', 10, this.rawFunc(1, 'ps'), baseData.psHits, null, { kafkaAA:true });
    this.state.psActivated = true;
  }
  triggerDotDamage(target, allDot, percent) {
    const buffs = target.filterBuffs({tag: allDot? 'dot' : '触电'});
    buffs.forEach(buff => buff.triggerDot('DOT', percent*0.01, { noCrit:true, noAuto:true}));
  }
  addUSDot(target, hitCount) {
    const hit = this.checkES('荆棘')? 1.3: 1;
    const count = this.checkSoul(6)? 3: 2;
    this.addBuffRandom(Buff.getKey(baseData.name, '终结技', '触电'), target, 1, {count}, hit, hitCount, false, true);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_ATK_E') {
      if(data.options && data.options.kafkaAA) {
        this.addUSDot(data.target, 6);
        if(this.checkSoul(1))this.addBuffRandom(Buff.getKey(this.name, '星魂', '持续伤害易伤'), data.target, 1, {count:2}, 1, 6, false, true);
      }
    }
    if(e==='TURN_E') {
      this.state.psActivated = false;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const dotBuffs = enemy.filterBuffs({tag: 'dot'});
    const dotBuffsT = this.checkES('折磨')? dotBuffs : enemy.filterBuffs({tag:'触电'}, dotBuffs);
    const usDotDmg = C.calDmg(base*(us.dotRate + (this.checkSoul(6)? 156: 0)), [ 'Thunder', 'DOT' ], this, enemy, {simpleMode:true});
    const count = this.checkSoul(6)? 3: 2;
    const hit = this.checkES('荆棘')? 1.3: 1;
    const dotDamage = this.countDotDamage(dotBuffs, ns.percent);
    const dotDamageT = this.countDotDamage(dotBuffsT, us.percent);
    const hitRate = C.calHitRate(hit, this, enemy, 1, false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Thunder', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[目标]', brkDmg: brkDmg*2}, C.calDmg(base * ns.rateC, [ 'Thunder', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, [ 'Thunder', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate}, C.calDmg(base * us.rate, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'追击', brkDmg, hitRate: C.calHitRate(hit, this, enemy, 6, false, true)}, C.calDmg(base * ps.rate, [ 'Thunder', 'AA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'秘技', brkDmg: 2, hitRate}, C.calDmg(base * 50, [ 'Thunder', 'SP'], this, enemy)),
      { type:'dot', name:'终结技[触电]', damage: usDotDmg, turn: count, totalDamage: usDotDmg*count, hitRate },
      { type:'damage', name:'战技[引爆]', damage: dotDamage, expDamage:dotDamage },
      { type:'damage', name:'终结技[引爆]', damage: dotDamageT, expDamage:dotDamageT },
      R.getBreakReport(this, enemy)
    ];
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
  character: SsrKafka,
};