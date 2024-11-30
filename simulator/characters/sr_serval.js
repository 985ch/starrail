'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffAtkRate } = require('../buff_simple');
const { DebuffDot } = require('../debuff_simple');

const baseData = {
  name: '希露瓦',
  image: 'serval.jpg',
  rarity: 'SR',
  job: '智识',
  type: 'Thunder',
  hp: D.levelData['124_917'],
  atk: D.levelData['88_652'],
  def: D.levelData['51_374'],
  speed: 104,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['rateC', 'rateD', 'dotRate'],
    [ 70, 30, 40],
    [ 77, 33, 44],
    [ 84, 36, 48],
    [ 91, 39, 52],
    [ 98, 42, 56],
    [ 105, 45, 62],
    [ 113, 48, 70],
    [ 122, 52, 80],
    [ 131, 56, 92],
    [ 140, 60, 104],
    [ 147, 63, 109],
    [ 154, 66, 114],
  ]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[36], [39], [43], [46], [50], [54], [58], [63], [67], [72], [75], [79]]),
  psSoul: 5,
  us: D.makeTable([['rate'],[108], [115], [122], [129], [136], [144], [153], [162], [171],[180], [187], [194]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '摇滚', '电音', '狂热' ],
  attributes: [
    {criRate: 2.7}, {criRate: 2.7}, {criRate: 4.0}, {criRate: 4.0}, {criRate: 5.3},
    { dodge: 4.0 }, { dodge: 6.0 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 8.0 },
  ],
  defaultJson: {
    weapon:'别让世界静下来', name4: '激奏雷电的乐队', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'speed', link:'enRate', ball:'bonusThunder',
  },
  ai: {
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusThunder',
    },
    attrs: {
      hit: [100, 0, 50],
    },
    set2: '停转的萨尔索图'
  },
};
const buffNSKey = Buff.getKey(baseData.name, '战技', '触电');
class BuffDamage extends Buff {
  static info() {
    return {
      name: '触电增伤',
      short: '增伤',
      source: '星魂',
      desc: '伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(enemy) {
    return enemy.findBuff({ tag:'触电' })?  { bonusAll: 30 } : {};
  }
}
class SrServal extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { ns } = this.skillData;
    const list = [
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate: 50, count: 3, baseAttr:'atk', type:'Thunder', name:'触电', source:'秘技', maxValue:1,
      }),
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate: ns.dotRate, count: 2, baseAttr:'atk', type:'Thunder', name:'触电', source:'战技', maxValue:1,
      }),
    ];
    if(this.checkES('狂热')){
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: 20, name: '狂热', source: '天赋',  maxValue: 1,
      }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffDamage));
    }
    return list;
  }
  updateReport(enemy){
    const others = [];
    if(this.checkES('电音')) others.push(['战斗开始', 15]);
    if(this.checkSoul(2)) others.push(['触发天赋', 4]);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others }),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    if(!this.checkSoul(1)) {
      return super.castNA(target);
    }
    
    const targets = A.getTargets(this, 'adj', target);
    if(targets.length===0) {
      return super.castNA(target);
    }
    const idxT = Math.floor(Math.random()*targets.length);
    this.actionAttack(cb=>cb(), 'NA', target, 'diff', 20, (i)=>{
      const brkDmg = i===0? 1: 0;
      const rate = i===0? 1.0:(i===idxT? 0.6: 0);
      return { brkDmg, raw: this.getBaseDmg('na', 'atk', 'rate') * rate }
    }, this.base.naHits);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'diff', 30, this.rawDiffFunc(2, 1, 'ns', 'rateC', 'rateD'), baseData.nsHits, baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      const enemies = this.team.getAliveUnits('enemies');
      const soul4 = this.checkSoul(4);
      enemies.forEach(e => {
        const buff = e.findBuff({ tag:'触电' });
        if(buff) {
          buff.state.count +=2;
        } else if(soul4){
          this.addBuffRandom(buffNSKey, e, 1, { count: 2 }, 1, 1, false, true);
        }
      })
      cb();
    },'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
  }
  castPS() {
    const list = this.team.enemies.filter(e => e && e.checkAlive() && e.findBuff({ tag:'触电' })? true: false );
    if(list.length===0) return;
    A.newAddDmg(this, this, list, this.getBaseDmg('ps'));
    if(this.checkSoul(2)) this.addEn(4 * list.length);
  }
  castSP() {
    super.castSP(()=>{
      const enemies = this.team.getAliveUnits('enemies');
      const dotKey = Buff.getKey(this.name, '秘技', '触电');
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 50), 'single', D.sample(enemies));
      enemies.forEach(e => this.addBuffRandom(dotKey, e, 1, { count:3 }, 1, 1, false, true));
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('电音'))this.addEn(15);
    } else if(e==='C_KILL') {
      if(this.checkES('狂热'))this.addBuff(Buff.getKey(this.name, '天赋', '狂热'), this, 1, { count: 2});
    } else if(e==='C_DMG_E') {
      if(D.checkType(data.type, 'NS')) {
        data.targets.forEach(e => this.addBuffRandom(buffNSKey, e, 1, { count: 2 }, this.checkES('摇滚')? 1: 0.8, 1, false, true));
      }
      this.castPS();
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const bonus = this.checkSoul(6) && !enemy.findBuff({ tag:'触电' })? 30: 0;
    const dotDmg = C.calDmg(base*ns.dotRate, [ 'Thunder', 'DOT' ], this, enemy, {simpleMode:true}, {bonus});
    const dotDmgX = C.calDmg(base*50, [ 'Thunder', 'DOT' ], this, enemy, {simpleMode:true}, {bonus});
    const hitRate = C.calHitRate(this.checkES('摇滚')? 1: 0.8, this, enemy, 1, false, true);
    const hitRateX = this.checkES('摇滚')? hitRate: C.calHitRate(1, this, enemy, 1, false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Thunder', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rateC, [ 'Thunder', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, [ 'Thunder', 'NS' ], this, enemy)),
      { type:'dot', name:'战技[触电]', damage: dotDmg, turn: 2, totalDamage: dotDmg*2, hitRate},
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate: this.checkSoul(4)? hitRateX: 0 }, C.calDmg(base * us.rate, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'天赋[追伤]'}, C.calDmg(base * ps.rate, [ 'Thunder', 'AD' ], this, enemy, null, { bonus })),
      Object.assign({ type: 'damage', name:'秘技[直伤]', brkDmg: 1 }, C.calDmg(base * 50, [ 'Thunder', 'SP' ], this, enemy)),
      { type:'dot', name:'秘技[触电]', damage: dotDmgX, turn: 3, totalDamage: dotDmgX*3, hitRate: hitRateX},
      R.getBreakReport(this, enemy)
    ];
  }
}

module.exports = {
  data: baseData,
  character: SrServal,
};