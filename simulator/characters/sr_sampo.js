'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDot, DebuffWeakType } = require('../debuff_simple');

const baseData = {
  name: '桑博',
  image: 'sampo.jpg',
  rarity: 'SR',
  job: '虚无',
  type: 'Wind',
  hp: D.levelData['139_1023'],
  atk: D.levelData['84_617'],
  def: D.levelData['54_396'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3,0.3,0.4],
  naSoul: 3,
  ns: D.makeTable([['rate'],[28],[30],[33],[36],[39],[42],[45],[49],[52],[56],[58],[61]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[20],[22],[24],[26],[28],[31],[35],[40],[46],[52],[54],[57]]),
  psSoul: 5,
  us: D.makeTable([['rate','weakDOT'],[96,20],[102,21],[108,22],[115,23],[121,24],[128,25],[136,26],[144,27],[152,28],[160,30],[166,31],[172,32]]),
  usTarget: 'enemies',
  usHits: [0.25,0.25,0.25,0.25],
  usSoul: 5,
  es: ['圈套','后手','加料'],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { dodge: 4.0 }, { dodge: 6.0 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 8.0 },
  ],
  defaultJson: {
    weapon:'猎物的视线', name4: '幽锁深牢的系囚', name2: '苍穹战线格拉默',
    body: 'atkRate', foot: 'speed', link:'atkRate', ball:'bonusWind',
  },
  ai: {
    na: ai.na_default,
    ns: ai.ns_sp_gt(1),
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
      ball: 'bonusWind',
    },
    set4: ['幽锁深牢的系囚', '幽锁深牢的系囚'],
  },
};
const dotKey = Buff.getKey(baseData.name, '天赋', '风化');
class DebuffJL extends Buff {
  static info() {
    return {
      name: '加料',
      short: '虚弱',
      source: '天赋',
      desc: '风化时对桑博伤害降低',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  getAttributesT(target, self) {
    if(self.findBuff({tag:'风化'}) && target===this.member) {
      return { bonusAll: -15}
    }
    return {};
  }
}
class DotCaster extends Buff {
  static info() {
    return {
      name: '热情会传染',
      short: '监听',
      source: '星魂',
      desc: '监听击杀事件',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  init() {
    this.listen({e:'B_KILL',t:'enemies',f:(buff,unit,data)=>{
      if(!unit.findBuff({tag:'风化'}))return;
      unit.team.getAliveUnits('enemies').forEach(e => {
        if(e!==unit)this.member.addBuffRandom(dotKey, e, 1, {}, 1);
      })
    }})
  }
}

class SrSampo extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { us, ps } = this.skillData;
    const count = this.checkES('圈套')? 4: 3;
    const rate = ps.rate + (this.checkSoul(6)? 15: 0);
    const list = [
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate, count, baseAttr:'atk', type:'Wind', name:'风化', source:'天赋', maxValue:5,
      }),
      Buff.getListJson(this, DebuffWeakType, [Buff.simpleListener()], '', {
        type:'DOT', weakDOT: us.weakDOT, name:'持续伤害易伤', source:'终结技', maxValue:1, 
      })
    ];
    if(this.checkES('加料')) list.push(Buff.getListJson(this, DebuffJL));
    if(this.checkSoul(2)) list.push(Buff.getListJson(this, DotCaster));
    return list;
  }
  updateReport(enemy){
    const options = {
      ns: this.checkSoul(1)? 36: 30,
      us: 5+(this.checkES('后手')? 10: 0),
    }
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
  castNS(target) {
    super.castNS(target);
    const count = this.checkSoul(1)? 6: 5;
    this.actionAttack(cb=>cb(),'NS', target, 'random', 6, this.rawRandFunc(1, 0.5, 'ns'), count, null, {hitAliveOnly: true});
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      this.team.getAliveUnits('enemies').forEach(e => {
        this.addBuffRandom(Buff.getKey(this.name, '终结技', '持续伤害易伤'), e, 1, { count:2 }, 1);
      })
    },'US', target, 'all', 5, this.rawFunc(2,'us'), baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('enemies').forEach(e => e.changeWaitTime(25));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
    } else if(e==='C_HIT_S') {
      if(D.checkType(data.type, ['NA','NS','US','AA'])) {
        this.addBuffRandom(dotKey, data.target, 1, {}, 0.65);
      }
      if(this.checkSoul(4) && D.checkType(data.type, 'NS')) {
        this.triggetWindDamage(data.target);
      }
    }
    super.onEvent(e, unit, data);
  }
  triggetWindDamage(target) {
    const buffs = target.filterBuffs({tag:'风化'});
    if(!this.checkWind5(buffs))return;
    buffs.forEach(buff => buff.triggerDot('DOT', 0.08, { noCrit:true, noAuto:true}));
  }
  checkWind5(buffs) {
    for(let i=0; i<buffs.length; i++) {
      if(buffs[i].value >= 5) return true;
    }
    return false;
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const dotBuffs = enemy.filterBuffs({tag: '风化'});
    const canBreak = this.checkWind5(dotBuffs);
    const dotDamage = canBreak? this.countDotDamage(dotBuffs): 0;
    const dotDmg = C.calDmg(base*(ps.rate + (this.checkSoul(6)? 15: 0)), ['Wind', 'DOT'], this, enemy, {simpleMode:true});
    const turn = this.checkES('圈套')? 4: 3;
    const hitRate = C.calHitRate(0.65, this, enemy, 1, false, true);

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Wind', 'NA'], this, enemy)),
      Object.assign({
        type: 'damage', name:'战技', tip:`首发削韧${brkDmg.toFixed(1)},后续削韧${(brkDmg/2).toFixed(1)}。共${this.checkSoul(1)? 6: 5}次`,
      }, C.calDmg(base * ns.rate, ['Wind', 'NS'], this, enemy)),
      Object.assign({
        type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate: C.calHitRate(1, this, enemy, 1),
      }, C.calDmg(base * us.rate, ['Wind', 'US'], this, enemy)),
      { type:'dot', name:'天赋[风化(1)]', tip:'击中时触发', damage: dotDmg, turn, totalDamage: dotDmg * turn, hitRate },
      { type:'dot', name:'天赋[风化(5)]', tip:'击中时触发', damage: dotDmg*5, turn, totalDamage: dotDmg * turn * 5, hitRate },
    ];
    if(this.checkSoul(1)){
      list.push({
        type:'hit', name: '风化[命中]', labels:['命中率'], tip:'风化敌人被击倒时触发',
        hit0: C.calHitRate(1, this, enemy, 1, false, true),
      });
    }
    if(this.checkSoul(4)) {
      list.push({ type:'damage', name:'风化[引爆]', damage: dotDamage, expDamage:dotDamage });
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  countDotDamage(buffs) {
    return buffs.reduce( (total, buff) =>{
      let dmg = buff.getData();
      return total + ((typeof dmg === 'number')? dmg: dmg.damage);
    }, 0) * 0.08;
  }
}

module.exports = {
  data: baseData,
  character: SrSampo,
};