'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage } = require('../buff_simple');
const { DebuffWeakType, DebuffDefendAll } = require('../debuff_simple');

const baseData = {
  name: '黄泉',
  image: 'acheron.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Thunder',
  hp: D.levelData['153_1125'],
  atk: D.levelData['95_698'],
  def: D.levelData['59_436'],
  speed: 101,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 0,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([
    ['rateC','rateD'],
    [80,30],
    [88,33],
    [96,36],
    [104,39],
    [112,42],
    [120,45],
    [130,48.75],
    [140,52.5],
    [150,56.25],
    [160,60],
    [168,63],
    [176,66],
    [184,69],
    [192,72],
    [200,75],
  ]),
  nsHits: [0.1,0.1,0.1,0.7],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['defendAll'],[10],[11],[12],[13],[14],[15],[16.25],[17.5],[18.75],[20],[21],[22],[23],[24],[25]]),
  psSoul: 3,
  us: D.makeTable([
    ['rateC','rateAi','rateAx','rateAll'],
    [14.4, 9, 36, 72],
    [15.36, 9.6, 38.4, 76.8],
    [16.32, 10.2, 40.8, 81.6],
    [17.28, 10.8, 43.2, 86.4],
    [18.24, 11.4, 45.6, 91.2],
    [19.2, 12, 48, 96],
    [20.4, 12.75, 51, 102],
    [21.6, 13.5, 54, 108],
    [22.8, 14.25, 57, 114],
    [24, 15, 60, 120],
    [24.96, 15.6, 62.4, 124.8],
    [25.92, 16.2, 64.8, 129.6],
    [26.88, 16.8, 67.2, 134.4],
    [27.84, 17.4, 69.6, 139.2],
    [28.8, 18, 72, 144]
  ]),
  usTarget: 'enemy',
  usSoul: 5,
  es: [ '赤鬼', '奈落', '雷心' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { bonusThunder: 3.2 }, { bonusThunder: 4.8 }, { criDamage: 5.3 }, { criDamage: 8.0 }, { criDamage: 10.7 },
  ],
  defaultJson: {
    weapon:'行于流逝的岸', name4: '死水深潜的先驱', name2: '出云显世与高天神国',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusThunder',
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusThunder',
    },
    set4: ['死水深潜的先驱', '死水深潜的先驱'],
    set2: '出云显世与高天神国',
  },
  aiLabels: [['ns','战技'],['us','终结技'],['usA','三连'],['usB','尾刀'],['na','普攻']],
  aiConditions: [{value:'c_acheronA',text:'残梦数量'}, {value:'c_acheronB', text:'四相断我层数'}],
  ai: {
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us: ai.us_always,
    usA:{
      disable:false,
      rules:[
        [{t:"target",v:["buff","key","黄泉$天赋$集真赤.","yes",3]}],
        [{t:"target",v:["buff","key","黄泉$天赋$集真赤.","yes",2]}],
        [{t:"target",v:["buff","key","黄泉$天赋$集真赤.","yes",1]}],
      ]
    },
    usB:{
      disable:false,
      rules:[]
    }
  },
};
const buffJZC = Buff.getKey(baseData.name, '天赋', '集真赤');
const buffSXDW = Buff.getKey(baseData.name, '天赋', '四相断我');

class BuffJZC extends Buff {
  static info() {
    return {
      name: '集真赤',
      short: '集真赤',
      source: '天赋',
      desc:'黄泉终结技命中时，消去赤真集并造成额外伤害和全体伤害',
      show: true,
      maxValue: 9,
      target: 'enemy',
      tags: [],
    };
  }
  init() {
    this.listen({e:'ACT_E', t:'members', f:(buff, unit, data)=>{
      if(data.member===this.member && data.options && data.options['黄泉终结技']) this.state.count = 0;
    }})
  }
}
class BuffSXDW extends Buff {
  static info(data) {
    return {
      name: '四相断我',
      short: '四相断我',
      source: '天赋',
      desc:'黄泉终结技结束后，获得残梦并为随机敌方单体添加集真赤',
      show: true,
      maxValue: data.maxValue,
      target: 'self',
      tags: [],
    };
  }
}
class BuffAcheron extends Buff {
  static info() {
    return {
      name: '黄泉',
      short: '黄泉',
      source: '天赋',
      desc:'黄泉监控事件处理用buff',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    const ms = m.state;
    ms.psTarget = null;
    ms.psTargetCount = 0;
    this.listen({e:'ACT_S', t:'all', f:(buff, unit, data)=>{
      ms.psTarget = null;
      ms.psTargetCount = 0;
    }})
    this.listen({e:'ACT_E', t:'all', f:(buff, unit, data)=>{
      if(!ms.psTarget || (data.options && data.options['黄泉终结技'])) return;
      const tar = m.team.getCharacter(ms.psTarget);
      m.castPS((tar && tar.checkAlive())? tar: null);
    }})
    this.listen({e:'B_BUFF_E', t:'enemies', f:(buff, unit, data)=>{
      if(!data.buff || !data.buff.checkTag('debuff')) return;
      const jzc = unit.findBuff({key: buffJZC});
      const value = jzc? jzc.value : 0;
      if(!ms.psTarget || value>ms.psTargetCount) {
        ms.psTarget = unit.name;
        ms.psTargetCount = value;
      }
    }});
    this.listen({e:'BEFORE_DEATH', t:'enemies', f:(buff, unit, data)=>{
      const jzc = unit.findBuff({key: buffJZC});
      if(!jzc) return;
      let enemy = null;
      let count = 0;
      const enemies = m.team.getAliveUnits('enemies').filter(cur => cur!==unit);
      if(enemies.length===0) return;
      enemies.forEach(cur => {
        const jzcBuff = cur.findBuff({key: buffJZC});
        if(jzcBuff && jzcBuff.value>count) {
          enemy = cur;
          count = jzcBuff.value;
        }
      })
      if(!enemy) enemy = D.sample(enemies);
      m.addBuff(buffJZC, enemy, jzc.value);
    }})
    if(m.checkSoul(4)) {
      this.listen({e:['BTL_S','REBORN'], t:'enemies', f:(buff, unit, data)=>{
        m.addBuff(Buff.getKey(m.name, '星魂', '终结技易伤'), unit, 1);
      }});
    }
  }
}
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '暴击提高',
      short: '暴击',
      source: '星魂',
      desc:'对处于负面状态的目标造成伤害时暴击提高18%',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    return this.isActivated(target)? {criRate: 18}:{}
  }
  isActivated(target) {
    return (target && target.findBuff({tag:'debuff'}))? true: false;
  }
 }


class SsrAcheron extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffAcheron),
      Buff.getListJson(this, BuffJZC),
      Buff.getListJson(this, BuffSXDW, [], '', { maxValue: this.checkES('赤鬼')? 3: 1}),
      Buff.getListJson(this, DebuffDefendAll, [Buff.eventListener('ACT_E', 'self')], '', {
        defendAll: this.skillData.ps.defendAll, name: '全抗性降低', source:'天赋', target: 'enemies', maxValue: 1,
      }),
    ];
    if(this.checkES('雷心')){
      list.push(Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: 30, name: '雷心', source: '天赋', target: 'self', maxValue: 3,
      }))
    }
    if(this.checkSoul(1)) list.push(Buff.getListJson(this, BuffCriRate));
    if(this.checkSoul(4)) list.push(Buff.getListJson(this, DebuffWeakType, [], '', {
      type:'US', weakUS: 8, name:'终结技易伤', source:'星魂', maxValue:1, target: 'enemy' 
    }));
    return list;
  }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkSoul(6)) list.push({ throughUS:20 });
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return `残梦:${this.state['残梦']}/9`;
  }
  getStateExData(key) {
    if(key==='残梦') return this.state['残梦'];
    const buff = this.findBuff(buffSXDW);
    return buff? buff.value: 0;
  }
  resetState(isReborn) {
    super.resetState(isReborn);
    this.state['残梦'] = 0;
  }
  // 覆盖数据更新方法
  updateData() {
    super.updateData();
    if(this.checkES('奈落')) {
      const count = this.team.members.reduce((count, m)=>m && m.base.job==='虚无'?count+1:count, 0);
      this.bonusRate = count >= (this.checkSoul(2)?2:3)? 1.6:(count>=2? 1.15: 1);
    } else {
      this.bonusRate = 1;
    }
  }
  // 覆盖character类的基础伤害方法
  getBaseDmg(key1, key2 = 'rate', attr='atk') {
    return this.getAttr(attr)*this.bonusRate * this.skillData[key1][key2]*0.01;
  }
  castNA(target) {
    const soul6 = this.checkSoul(6);
    this.actionAttack(cb=>cb(), soul6? ['NA','US']: 'NA', target, 'single', 20, this.rawFunc(1, 'na', 'rate', 'atk'), this.base.naHits, null, {forceBreak: soul6? 1: 0});
    this.changeSp(1);
  }
  castNS(target) {
    const soul6 = this.checkSoul(6);
    super.castNS(target);
    this.actionAttack(cb=>{
      this.castPS(target);
      cb();
    }, soul6? ['NS','US']: 'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rateC','rateD'), this.base.nsHits, this.base.nsHits, {forceBreak: soul6? 1: 0});
  }
  getBattleActions(isMyTurn) {
    if(this.checkBonusTurn()) {
      return this.state.usAction<3? [{
        text: '啼泽雨斩',
        key: 'usA',
        target: 'enemy',
        disable: false,
      }]: [{
        text: '黄泉返渡',
        key: 'usB',
        target: 'enemies',
        disable: false,
      }]
    }
    return super.getBattleActions(isMyTurn);
  }
  onAction(data) {
    switch(data.key) {
      case 'usA':
        this.castUS_A(data.target);
        break;
      case 'usB':{
        this.castUS_B();
        break;
      }
      default:
        break;
    }
    super.onAction(data);
  }
  castUS() {
    this.triggerEvent('ACT_S', {type:'US', member:this, target:'enemies', options:{['黄泉终结技']: true}});
    this.startBonusTurn();
    this.state.usAction = 0;
    this.team.getAliveUnits('enemies').forEach(t => this.addBuff(Buff.getKey(this.name, '天赋', '全抗性降低'), t, 1));
    this.state['残梦'] = 0;
  }
  castUS_A(target) {
    const buff = target.findBuff({key: buffJZC});
    const count = buff? Math.min(3, buff.value): 0;
    const hitsInfo = [[0.5, 0.5], [0.3, 0.3, 0.4], [1]];
    const hits = hitsInfo[this.state.usAction];
    const hitCount = hits.length + (count > 0? 1: 0);
    const us = this.skillData.us;
    if(count>0) {
      buff.value -= count;
      if(buff.value <= 0) target.removeBuff(buff);
      if(this.checkES('雷心')) this.addBuff(Buff.getKey(this.name, '天赋', '雷心'), this, 1, { count: 3 });
    }
    A.triggerAttack({ type: 'US', member: this, target, atkType:'all', attrType:'Thunder', en:0, count: hitCount,
      rawDmg:(idxM, idxH)=>{
        const rate = hits[idxH]? us.rateC * hits[idxH]: us.rateAi * (count + 1);
        return {
          brkDmg: 0.5,
          raw: this.getAttr('atk') * this.bonusRate * 0.01 * rate,
        }
      },options:{
        getHitInfo(i, targets){
          if(i < hits.length) return [{t: target, r: 1}];
          const list = targets.filter(t=>t.checkAlive()).map(t => ({t, r: 1}));
          return list.length>0? list: [{t: target, r: 1}];
        },
        forceBreak: 1
      }
    });
    this.state.usAction ++;
  }
  castUS_B() {
    // 计算最后一击伤害
    const us = this.skillData.us;
    const count = this.checkES('雷心')? 8: 2;
    const hits = [0.1, 0.9];
    A.triggerAttack({ type: 'US', member: this, target:'enemies', atkType:'all', attrType:'Thunder', en:0, count,
      rawDmg:(idxM, idxH)=>{
        const rate = idxH<2? us.rateAll * hits[idxH]: 25;
        return {
          brkDmg: idxH===0? 0.5: 0,
          raw: this.getAttr('atk') * this.bonusRate * 0.01 * rate,
        }
      },options:{
        getHitInfo(i, targets){
          if(i < hits.length) return targets.map(t=>({t, r: hits[i]}));
          const list = targets.filter(t=>t.checkAlive());
          return [{ t: D.sample(list) || targets[0], r: 1 }];
        },
        forceBreak: 1
      }
    });
    // 完成终结技动作并结算
    this.triggerEvent('ACT_E', {type:'US', member:this, target: 'enemies', options:{['黄泉终结技']: true}});
    const sxdw = this.findBuff({key: buffSXDW});
    if(sxdw) {
      this.castPS(null, sxdw.value);
      this.removeBuff(sxdw);
    }
    this.endBonusTurn();
  }
  checkDisableUS() {
    return  !this.checkAlive() || this.state['残梦'] < 9 || this.findBuff({tag:'freeze'})
  };
  castSP() {
    this.state.spActivated = true;
    this.team.enterBattle(this, true);
  }
  _onSP() {
    A.startBattleDmg(this, 2, this.rawFuncRate(0, 200), 'all', 'enemies', this.base.type, 0, { forceBreak: 1 });
    this.addBuff(buffSXDW, this, 1);
  }
  castPS(target, count = 1) {
    this.state['残梦'] += count;
    if(this.state['残梦'] > 9) {
      if(this.checkES('赤鬼')) {
        this.addBuff(buffSXDW, this, this.state['残梦'] - 9)
      }
      this.state['残梦'] = 9;
    }
    target = target || D.sample(this.team.getAliveUnits('enemies'));
    if(target && target.checkAlive()) this.addBuff(buffJZC, target, count);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('赤鬼')) this.castPS(null, 5);
    } else if(e==='WAVE_S') {
      if(this.state.spActivated) this.onSP();
    } else if(e==='TURN_S') {
      if(this.checkSoul(2)) {
        let target = null;
        let tCount = 0;
        const enemies = this.team.getAliveUnits('enemies');
        enemies.forEach(t => {
          const buff = t.findBuff({key: buffJZC});
          if(buff && buff.value>tCount) {
            target = t;
            tCount = buff.value;
          } 
        });
        target = target || D.sample(enemies);
        this.castPS(target);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*this.bonusRate*0.01;
    const { na, ns, us } = this.skillData;
    const soul6 = this.checkSoul(6);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, soul6? ['Thunder','NA','US']: ['Thunder','NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rateC, soul6? ['Thunder','NS','US']: ['Thunder','NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, soul6? ['Thunder','NS','US']: ['Thunder','NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[单体]', brkDmg: brkDmg/2 }, C.calDmg(base * us.rateC, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[3层]', brkDmg: brkDmg/2}, C.calDmg(base * us.rateAi*4, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[2层]', brkDmg: brkDmg/2}, C.calDmg(base * us.rateAi*3, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[1层]', brkDmg: brkDmg/2}, C.calDmg(base * us.rateAi*2, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[尾刀]', brkDmg: brkDmg/2}, C.calDmg(base * us.rateAll, [ 'Thunder', 'US' ], this, enemy)),
    ];
    if(this.checkES('雷心')) list.push(Object.assign({ type: 'damage', name:'终结技[追加]', tip:'单体弹射6次'}, C.calDmg(base * 25, [ 'Thunder', 'US' ], this, enemy)));
    list.push(Object.assign({ type: 'damage', name:'秘技', brkDmg:brkDmg*2, tip:'每波次触发'}, C.calDmg(base * us.rateAll, [ 'Thunder', 'PS' ], this, enemy)),)
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrAcheron,
};