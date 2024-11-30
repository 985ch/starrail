'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');

const baseData = {
  name: '椒丘',
  image: 'jiaoqiu.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Fire',
  damages: ['DOT','US'],
  needAttrs: [{raw:'hit', tar:['atkRate'], range:[80,140]}],
  hp: D.levelData['184_1358'],
  atk: D.levelData['81_601'],
  def: D.levelData['69_509'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 100,
  na: D.makeTable([["rate"],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([["rateC","rateD"],[75,45],[82.5,49.5],[90,54],[97.5,58.5],[105,63],[112.5,67.5],[121.88,73.12],[131.25,78.75],[140.62,84.38],[150,90],[157.5,94.5],[165,99],[172.5,103.5],[180,108],[187.5,112.5]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([
    ["weakAll","weakAllP","rate"],
    [7.5,2.5,90],
    [8.25,2.75,99],
    [9,3,108],
    [9.75,3.25,117],
    [10.5,3.5,126],
    [11.25,3.75,135],
    [12.19,4.06,146.25],
    [13.13,4.37,157.5],
    [14.06,4.69,168.75],
    [15,5,180],
    [15.75,5.25,189],
    [16.5,5.5,198],
    [17.25,5.75,207],
    [18,6,216],
    [18.75,6.25,225],
  ]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([
    ["rate","chance","weakUS"],
    [60,50,9],
    [64,51,9.6],
    [68,52,10.2],
    [72,53,10.8],
    [76,54,11.4],
    [80,55,12],
    [85,56.25,12.75],
    [90,57.5,13.5],
    [95,58.75,14.25],
    [100,60,15],
    [104,61,15.6],
    [108,62,16.2],
    [112,63,16.8],
    [116,64,17.4],
    [120,65,18],
  ]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '爟火', '举炊', '炙香' ],
  attributes: [
    { hit: 4.0 }, { hit: 4.0 }, { hit: 6.0 }, { hit: 6.0 }, { hit: 8.0 },
    { bonusFire: 3.2 }, { bonusFire: 4.8 }, { bonusFire: 6.4 }, { speed: 2.0 }, { speed: 3.0 },
  ],
  defaultJson: {
    weapon:'那无数个春天', name4: '死水深潜的先驱', name2: '泛银河商业公司',
    body: 'hit', foot: 'speed', link:'enRate', ball:'bonusFire',
  },
  equipSetting: {
    rule: 'dmgDOT',
    attrs: {
      hit:[1000, 0, 120],
    },
    main: {
      body: 'hit',
      foot: 'atkRate',
      link: 'enRate',
      ball: 'bonusFire',
    },
    set4: ['死水深潜的先驱', '死水深潜的先驱'],
    set2: '泛银河商业公司',
  },
};
const buffPSKey = Buff.getKey(baseData.name, '天赋', '烬煨');
const buffUSKey = Buff.getKey(baseData.name, '终结技', '结界')

class BuffJW extends Buff {
  static info(data) {
    return {
      name: '烬煨',
      short: '烬煨',
      source: '天赋',
      desc:'每回合受到持续伤害，且受到的伤害提高',
      show: true,
      maxValue: data.maxValue,
      target: 'enemy',
      tags: ['debuff', 'dot', '灼烧'],
    };
  }
  getDesc() {
    const { damage, weakAll, bonusAll, defendAll } = this.getData();
    const bonusText = bonusAll?`;我方目标对其造成伤害提高${D.toPercent(bonusAll)}`:''
    const defendText = defendAll?`，全抗性降低${D.toPercent(defendAll)}`:'';
    return `受到灼烧，回合开始时受到${Math.floor(damage)}点火属性伤害；受到的伤害提高${D.toPercent(weakAll)}${bonusText}${defendText}}。`
  }
  init() {
    const m = this.member;
    if(m.checkSoul(6)) this.listen({e:['BEFORE_DEATH'], t:'enemy', f:(buff)=>{
      let min = 9999;
      let tar = null;
      const enemies = m.team.getAliveUnits('enemies')
      for(let e of enemies) {
        const debuff = e.findBuff({ key: buffPSKey });
        if(!debuff) {
          min = 0;
          tar = e;
          break;
        } else if(debuff.value < min) {
          min = debuff.value;
          tar = e;
        }
      };
      m.addBuff(buffPSKey, tar, this.value, {count: 2});
    }});
  }
  getAttributes() {
    const { weakAll, defendAll } = this.getData();
    return {
      weakAll,
      defendAll: -defendAll,
    }
  }
  getData() {
    const m = this.member;
    // 计算伤害
    const { ps } = m.skillData;
    const rate = ps.rate + (m.checkSoul(2)? 300: 0);
    const { damage } = C.calDmg(m.getAttr('atk') * rate * 0.01, ['Fire', 'DOT'], m, this.target);
    // 计算易伤
    const weakAll = ps.weakAll + (this.value-1) * ps.weakAllP;
    const bonusAll = m.checkSoul(1)? 40: 0;
    const defendAll = m.checkSoul(6)? this.value * 3: 0;
    return {
      damage,
      weakAll,
      bonusAll,
      defendAll,
    }
  }
}

class BuffJWBonus extends Buff {
  static info() {
    return {
      name: '烬煨（增伤）',
      short: '烬煨',
      source: '星魂',
      desc:'对处于烬煨状态下的目标增伤',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    };
  }
  getAttributesT(enemy) {
    const debuff = enemy.findBuff({ key: buffPSKey });
    if(debuff) {
      return { bonusAll: 40 };
    }
    return {};
  }
}

class BuffUS extends Buff {
  static info(data) {
    return {
      name: '结界',
      short: '结界',
      source: '终结技',
      desc:'受到终结技伤害提高，行动时有概率被施加【烬煨】',
      show: true,
      maxValue: 1,
      target: 'enemies',
      tags: ['debuff'],
    };
  }
  getDesc(target) {
    const m = this.member;
    const { us } = m.skillData;
    const hit = C.calHitRate(us.chance*0.01, m, target);
    const newText = m.checkES('炙香')?'敌人进入战斗时会被施加【烬煨】；':'';
    const atkText = m.checkSoul(4)?'攻击力降低15%；':'';
    return `受到的终结技伤害提高${D.toPercent(us.weakUS)}'；${atkText}${newText}行动时有${D.toPercent(hit)}概率被施加【烬煨】,剩余${this.state.jwCount}次。`
  }
  init() {
    const m = this.member;
    this.state.jwCount = 6;
    this.listen({e:'ACT_S', t:'enemies', f:(buff, unit)=>{
      if(this.state.jwCount<=0 || !unit.updateCD(1, '椒丘结界', false, false)) return false;
      if(m.addBuffRandom(buffPSKey, unit, 1, {count: 2}, m.skillData.us.chance*0.01 )) {
        this.state.jwCount--;
        unit.updateCD(1, '椒丘结界', false, true);
      };
    }})
    if(m.checkES('炙香')) this.listen({e:'BTL_S', t:'REBORN', f:(buff, unit)=>{
      let maxValue = 1;
      const enemies = m.team.getAliveUnits('enemies');
      for(let e of enemies) {
        const debuff = e.findBuff({ key: buffPSKey });
        if(debuff) maxValue = Math.max(maxValue, debuff.value);
      }
      unit.addBuff(buffPSKey, unit, maxValue, {count: 2});
    }})
  }
  getAttributes() {
    const m = this.member;
    return {
      weakUS: m.skillData.us.weakUS,
      atkRate: m.checkSoul(4)? -15: 0,
    }
  }
}

class BuffJiaoQiu extends Buff {
  static info() {
    return {
      name: '举炊',
      short: '加攻',
      source: '天赋',
      desc: '基于效果命中提高自身攻击',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const hit = this.member.attr.data.hit;
    const atkRate = Math.min(240, Math.max(0, Math.floor((hit-80)/15)* 60));
    return `攻击提高${D.toPercent(atkRate)}。`
  }
  getTransAttr() {
    return {
      atkRate: { raw:'hit', min:80, step:15, rate:4, max: 240 }
    };
  }
}

class SsrJiaoQiu extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffJiaoQiu),
      Buff.getListJson(this, BuffJW, [Buff.dotListener()], '', {maxValue: this.checkSoul(6)? 9: 5 }),
      Buff.getListJson(this, BuffUS, [Buff.eventListener('TURN_S', 'self')]),
    ];
    if(this.checkSoul(1))list.push(Buff.getListJson(this, BuffJWBonus));
    return list;
  }
  updateReport(enemy){
    const others = this.checkES('爟火')? [['进战回能',15]]: [];
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
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      cb();
      this.addBuffRandom(buffPSKey, target, 1, {count: 2}, 1);
    },'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rateC','rateD'), baseData.nsHits, baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      let buffs = [];
      let enemies = this.team.getAliveUnits('enemies');
      let maxValue = 0;
      for(let e of enemies) {
        const debuff = e.findBuff({ key: buffPSKey });
        if(debuff) {
          maxValue = Math.max(debuff.value, maxValue);
          buffs.push(debuff);
        }
      }
      for(let buff of buffs) {
        buff.value = maxValue;
        buff.markTargets();
      }
      this.addBuff(buffUSKey, this, 1, {count: 3});
      cb();
    }, 'US', target, 'all', 5, this.rawFunc(2,'us','rate'), baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    A.startBattleDmg(this, 0, this.rawFuncRate(0, 100));
    this.team.getAliveUnits('enemies').forEach(e => {
      this.addBuffRandom(buffPSKey, e, 1, {count: 2}, 1);
    })
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.fieldActivated) this.onSP();
      if(this.checkES('爟火')) this.addEn(15);
    } else if(e==='C_HIT_S') {
      if(D.checkType(data.type, ['NA','NS','US'])) {
        this.addBuffRandom(buffPSKey, data.target, this.checkSoul(1)? 2: 1 , {count: 2}, 1)
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const hitRate = C.calHitRate(1, this, enemy);
    const dotDmg = C.calDmg(base*(ps.rate + (this.checkSoul(2)? 300: 0)), ['Fire', 'DOT'], this, enemy, {simpleMode:true});

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg * 2, hitRate}, C.calDmg(base * ns.rateC, ['Fire', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, ['Fire', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rate, ['Fire', 'US'], this, enemy)),
      Object.assign({ type: 'dot', name:'烬煨', damage: dotDmg, turn:2 , totalDamage: dotDmg * 2, hitRate }),
      {
        type:'hit', name: '烬煨命中率', labels:['战技', '天赋', '终结技'],
        hit0: hitRate,
        hit1: hitRate,
        hit2: C.calHitRate(us.chance*0.01, this, enemy),
      },
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrJiaoQiu,
};