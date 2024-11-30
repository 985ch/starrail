'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '乱破',
  image: 'rappa.jpg',
  rarity: 'SSR',
  job: '智识',
  type: 'Void',
  damages: ['NA','NS'],
  hp: D.levelData['147_1086'],
  atk: D.levelData['97_717'],
  def: D.levelData['62_460'],
  speed: 96,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 140,
  na: D.makeTable([
    ['rate', 'rateC', 'rateD', 'rateA'],
    [50, 60, 30, 60],
    [60, 68, 34, 68],
    [70, 76, 38, 76],
    [80, 84, 42, 84],
    [90, 92, 46, 92],
    [100, 100, 50, 100],
    [110, 108, 54, 108],
    [120, 116, 58, 116],
    [130, 124, 62, 124]
  ]),
  naHits: [1],
  naHitsC: [1],
  naHitsD: [1],
  naHitsA: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[60],[66],[72],[78],[84],[90],[97.5],[105],[112.5],[120],[126],[132],[138],[144],[150]]),
  nsHits: [1],
  nsTarget: 'enemies',
  nsSoul: 3,
  ps: D.makeTable([['breakDmg','dmgBonus'],[30,25],[33,27.5],[36,30],[39,32.5],[42,35],[45,37.5],[48.75,40.63],[52.5,43.75],[56.25,46.88],[60,50],[63,52.5],[66,55],[69,57.5],[72,60],[75,62.5]]),
  psSoul: 3,
  us: D.makeTable([['breakRate'],[10],[12],[14],[16],[18],[20],[22.5],[25],[27.5],[30],[32],[34],[36],[38],[40]]),
  usTarget: 'self',
  usSoul: 5,
  es: [ '忍法帖•魔天', '忍法帖•海鸣', '忍法帖•枯叶' ],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {breakRate: 5.3}, {breakRate: 8}, {speed: 2}, {speed: 3}, {speed: 4},
  ],
  defaultJson: {
    weapon:'忍法帖•缭乱破魔', name4: '荡除蠹灾的铁骑', name2: '盗贼公国塔利亚',
    body: 'atkRate', foot: 'speed', link:'breakRate', ball:'atkRate',
    atkRate: [0, 3, 2],
  },
  equipSetting: {
    rule: 'dmgBRK',
    main: {
      foot: 'speed',
      link: 'breakRate',
      ball: 'atkRate',
    },
    set2: '盗贼公国塔利亚'
  },
};
const buffUsKey = Buff.getKey(baseData.name, '终结技', '结印');
const buffPsKey = Buff.getKey(baseData.name, '天赋', '充能')
class BuffRappa extends Buff {
  static info(data) {
    return {
      name: '忍•科学•堪忍袋',
      short: '堪忍袋',
      source: '天赋',
      desc: '监听乱破的天赋',
      show: false,
      maxValue: 0,
      target:'self',
      tags: [],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'B_BREAK', t:'enemy', f:(buff, unit)=>{
      const value = (unit.isElite() && m.checkES('忍法帖•魔天'))? 2: 1;
      m.addBuff(buffPsKey, m, value);
      if(value==2) m.addEn(10);
      if(m.checkES('忍法帖•枯叶')) {
        m.addBuff(Buff.getKey(baseData.name, '天赋', '枯叶'), unit, 1, { count: 2 })
      }
    }})
  }
}
class BuffUS extends Buff {
  static info() {
    return {
      name: '结印',
      short: '结印',
      source: '终结技',
      desc: '击破效率和击破特攻提高。',
      show: true,
      maxValue: 1,
      target:'self',
      tags: ['buff'],
    }
  }
  getDesc() {
    const m = this.member;
    const hmText = m.checkES('忍法帖•海鸣')? '可额外触发超击破伤害。': '';
    const soul1Text = m.checkSoul(1)? '获得15%防御穿透。': '';
    return `击破效率提高50%，击破提高${D.toPercent(m.skillData.us.breakRate)}。${hmText}${soul1Text}}`;
  }
  init(){
    if(this.member.checkES('忍法帖•海鸣')) this.listen({e:'B_DMG_E', t:'enemies', f:(buff, unit, data)=>{
      if(!unit.checkAlive() || unit.state.shield>0 || !data.options['降魔花弁']) return;
      const tInfo = data[unit.name];
      if(tInfo.brkDmgEx) data.member.castSuperBrkDmg(unit, tInfo.brkDmgEx, 60);
    }})
  }
  getAttributes() {
    return {
      breakBonus: 50,
      breakRate: this.member.skillData.us.breakRate,
      defThrough: this.member.checkSoul(1)? 15: 0,
    }
  }
}
class BuffKY extends Buff {
  static info() {
    return {
      name: '忍法帖•枯叶',
      short: '枯叶',
      source: '天赋',
      desc: '受到的击破伤害提高。',
      show: true,
      maxValue: 1,
      target:'enemy',
      tags: ['debuff'],
    }
  }
  getDesc() {
    return `受到的击破伤害提高${D.toPercent(this.getData())}。`
  }
  getAttributesT() {
    return { weakBRK: this.getData() }
  }
  getData() {
    const bonus = Math.max(0, Math.floor((this.member.getAttr('atk')-2400)/100));
    return Math.min(8, 2 + bonus);
  }
}
class BuffPS extends Buff {
  static info(data) {
    return {
      name: '充能',
      short: '充能',
      source: '天赋',
      desc: '强化普攻最后一击伤害提高。',
      show: true,
      maxValue: data.maxValue,
      target:'self',
      tags: [],
    }
  }
  getDesc(target, enemy) {
    if(!enemy) return super.getDesc();
    const {damage, brkDmg } = target.getBonusBrkDmg(enemy, this.value);
    return `强化普攻最后一击额外对敌方全体造成${Math.floor(damage)}点击破伤害，并无视弱点属性削韧${brkDmg.toFixed(2)}。`
  }
  init() {
    const m = this.member;
    this.listen({e:'B_DMG_E', t:'enemies', f:(buff, unit, data)=>{
      if(data.options['降魔花弁']!==2) return; 
      if(unit.checkAlive()) {
        m.triggerBonusBrkDmg(unit, this.value);
      }
      this.state.count = 0;
    }})
  }
}

class SsrRappa extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffRappa),
      Buff.getListJson(this, BuffUS),
      Buff.getListJson(this, BuffPS, [], '', { maxValue: this.checkSoul(6)? 15: 10 })
    ];
    if(this.checkES('忍法帖•枯叶')) list.push(Buff.getListJson(this, BuffKY));
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffSpeedRate, [],'', {
        speedRate: 12, name: '结印·加速', source: '星魂',  maxValue: 1, target: 'members'
      }));
    }
    return list;
  }
  getStateExText() {
    const data = this.getStateExData();
    return `充能:${data.count}/${data.max}`;
  }
  getStateExData() {
    const buff = this.findBuff({key: buffPsKey});
    return {
      count: buff? buff.value: 0,
      max: this.checkSoul(6)? 15: 10
    }
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getBattleActions(isMyTurn) {
    if(this.checkBonusTurn()) {
      return [{
        text: '强化普攻',
        key: 'naPlus',
        target: 'enemy',
        disable: false,
      }]
    }
    return super.getBattleActions(isMyTurn);
  }
  onAction(data) {
    if( data.key === 'naPlus') {
      this.castNaPlus(data.target);
    } else {
      super.onAction(data);
    }
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'all', 30, this.rawFunc(1, 'ns'), baseData.nsHits);
  }
  checkDisableUS() {
    return  super.checkDisableUS() || this.state.plusCount > 0;
  };
  castUS(target) {
    super.castUS(target);
    A.actionBase({type:'US', member:this, target: this}, ()=>{
      this.startBonusTurn();
      this.state.usAction = 0;
      this.state.plusCount = 3;
      this.state.plusHit = 0;
      this.addBuff(buffUsKey, this, 1);
      if(this.checkSoul(4))this.addBuff(Buff.getKey(this.name, '星魂', '结印·加速'), this, 1);
    });
    this.addEn(5);
  }
  castNaPlus(target) {
    this.state.plusHit++;
    if(this.state.plusHit < 3) {
      A.triggerAttack({
        type: 'NA', member: this, target, atkType:'diff', attrType:'Void', en:5, hits: baseData.naHitsC, diffHits: baseData.naHitsD,
        rawDmg: this.rawDiffFunc(this.checkSoul(2)? 1.5: 1, 0.5, 'na', 'rateC', 'rateD'), options: { '降魔花弁':1, forceBreak: 0.5 }
      });
    } else {
      A.triggerAttack({
        type: 'NA', member: this, target, atkType:'all', attrType:'Void', en:5, hits: baseData.naHitsA,
        rawDmg: this.rawFunc(0.5, 'na', 'rateA'), options: { '降魔花弁':2, forceBreak: 0.5 }
      });
      if(this.checkSoul(6))this.addBuff(buffPsKey, this, 5);

      this.state.plusCount--;
      this.state.plusHit = 0;
      if(this.state.plusCount<=0) {
        this.removeBuff(this.findBuff({ key: buffUsKey }));
        if(this.checkSoul(1)) this.addEn(20, true);
        if(this.checkSoul(4)) {
          this.removeBuff(this.findBuff({ key: Buff.getKey(this.name, '星魂', '结印·加速') }));
        }
      }
      this.endBonusTurn();
    }
  }
  getBonusBrkDmg(target, psCount) {
    const dmgInfo = this.getBreakDamage(target);
    const { ps } = this.skillData;
    const damage = dmgInfo.damage * (ps.breakDmg + ps.dmgBonus * psCount) * 0.01 / 0.9;
    const brkDmg = (2 + psCount)/30;
    return { damage, brkDmg };
  }
  triggerBonusBrkDmg(target, psCount) {
    const { damage, brkDmg } = this.getBonusBrkDmg(target, psCount);
    const dmgData = {
      type: 'BRK', attrType: baseData.type, member: this, attacker:this, target, 
      raw: damage, brkDmg, expDamage: damage, isCri: 0, damage, rate: 1,
      idx: 0, idxMax: 0,
    };
    A.triggerHit(this, this, target, dmgData, true);
  }
  castSP() {
    super.castSP(()=>{
      const targets = this.team.getAliveUnits('enemies');
      const base = this.getAttr('atk');
      A.triggerDmg({type: ['SP','BRK'], member:this, target:'enemies', atkType:'all', attrType:'Void', hits: [1], en:0, options:{ forceBreak:1 }, rawDmg: (idxT, idxH)=>{
        if(targets.length === 1) return { brkDmg:1, raw: base * 2 }
        if(idxT === 0 || idxT === targets.length - 1) return { brkDmg:3, raw: base * 3.8 }
        return { brkDmg:1, raw: base * 5.6 }
      }})
      this.addEn(10, true);
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkSoul(6))this.addBuff(buffPsKey, this, 5);
    } else if(e==='TURN_S') {
      if(this.state.plusCount>0) {
        this.team.state.acted = true;
        this.startBonusTurn();
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const usBuff = this.findBuff({ key: buffUsKey})
    const fixed = { breakRate: usBuff? 0: us.breakRate, breakBonus: usBuff? 0: 50 }
    const dmgInfo = this.getBreakDamage(enemy);
    const brkInfo1 = this.getBonusBrkDmg(enemy, 1, fixed);
    const psMax = this.checkSoul(6)? 15: 10;
    const brkInfoMax = this.getBonusBrkDmg(enemy, psMax, fixed);
    const psBuff = this.findBuff({ key: buffPsKey});
    const psCount = psBuff? psBuff.value: 0;
    const brkInfoCur = psBuff? this.getBonusBrkDmg(enemy, psCount, fixed): null;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Void', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg }, C.calDmg(base * ns.rate, [ 'Void', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[目标]', brkDmg: brkDmg }, C.calDmg(base * na.rateC, [ 'Void', 'NA' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'强化普攻[扩散]', brkDmg: brkDmg*0.5}, C.calDmg(base * na.rateD, [ 'Void', 'NA' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'强化普攻[全体]', brkDmg: brkDmg*0.5}, C.calDmg(base * na.rateA, [ 'Void', 'NA' ], this, enemy, null, fixed)),
      { type: 'breakDamage', name:'天赋追加[1]', brkDmg: brkInfo1.brkDmg, tip: '削韧'+brkInfo1.brkDmg.toFixed(2)+'。', damage: brkInfo1.damage },
    ]
    if(psCount && psCount!=1 && psCount!=psMax) {
      list.push({
        type: 'breakDamage', name:'天赋追加['+psCount+']', brkDmg: brkInfoCur.brkDmg, tip: '削韧'+brkInfoCur.brkDmg.toFixed(2)+'。', damage: brkInfoCur.damage
      });
    }
    list.push({
        type: 'breakDamage', name:'天赋追加['+psMax+']', brkDmg: brkInfoMax.brkDmg, tip: '削韧'+brkInfoMax.brkDmg.toFixed(2)+'。', damage: brkInfoMax.damage,
      },
      R.getBreakReport(this, enemy),
      R.getSuperBrkDmgReport(this, enemy, 60, 0, [1,2,3], '乱破'),
      { type: 'breakDamage', name:'秘技[中心]', brkDmg: 1, damage: dmgInfo.damage*2, tip: '削韧3。'},
      { type: 'breakDamage', name:'秘技[扩散]', brkDmg: 1, damage:dmgInfo.damage*1.8, tip: '削韧3。'},
    );
    return list;
  }
  // 获取基本的能量数据报告
  getEnergyReport() {
    const others = [['秘技进战', 10]];
    if(this.checkES('忍法帖•魔天')) others.push(['精英破盾', C.calEnergy(10, this)]);
    if(this.checkSoul(1)) others.push(['退出结印', 20]);
    const list = R.getEnergyReport(this, { others });
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrRappa,
};