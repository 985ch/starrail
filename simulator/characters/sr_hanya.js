'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffAtkRate, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '寒鸦',
  image: 'hanya.jpg',
  rarity: 'SR',
  job: '同谐',
  type: 'Physical',
  damages: ['NA','NS'],
  hp: D.levelData['124_917'],
  atk: D.levelData['76_564'],
  def: D.levelData['48_352'],
  speed: 110,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 140,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['rate'],[120],[132],[144],[156],[168],[180],[195],[210],[225],[240],[252],[264],[276],[288],[300]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['bonusAll'],[15],[16.5],[18],[19.5],[21],[22.5],[24.38],[26.25],[28.13],[30],[31.5],[33],[34.5],[36],[37.5]]),
  psSoul: 5,
  us: D.makeTable([['speedR','atkRate'],[15,36],[15.5,38.4],[16,40.8],[16.5,43.2],[17,45.6],[17.5,48],[18.13,51],[18.75,54],[19.38,57],[20,60],[20.5,62.4],[21,64.8],[21.5,67.2],[22,69.6],[22.5,72]]),
  usTarget: 'member',
  usSoul: 5,
  es: [ '录事', '幽府', '还阳' ],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {hpRate: 4.0}, {hpRate: 6.0}, {speed: 2.0}, {speed: 3.0}, {speed: 4.0},
  ],
  defaultJson: {
    weapon:'记忆中的模样', name4: '骇域漫游的信使', name2: '不老者的仙舟',
    body: 'atkRate', foot: 'speed', link:'enRate', ball:'hpRate',
    hp:[1,0,0],atk:[1,0,0],def:[1,0,0]
  },
  aiConditions: [{value:'c_hanya',text:'承负剩余数'}],
  ai:{
    na: ai.na_buff_yesT("寒鸦$战技$承负."),
    ns: {
      disable:false,
      rules:[[{t:"target",v:["buff","key","寒鸦$战技$承负.","yes","no"]},{t:"buff",v:["t","key","寒鸦$战技$承负.","no",0]}]]
    },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[10, 0, 2500],
      def:[30, 0, 900],
      speed:[50, 0, 99999],
    },
    main: {
      foot: 'speed',
      link: 'enRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
    set2: '梦想之地匹诺康尼',
  },
};
const buffNsKey = Buff.getKey(baseData.name, '战技', '承负');
class DebuffSkillPoint extends Buff {
  static info() {
    return {
      name: '承负',
      short: '承负',
      source: '战技',
      desc: '我方对其施放普攻战技终结技时获得[罚恶]。每2次受击为我方恢复1战技点。',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['承负'],
    }
  }
  init() {
    this.state.count = 2;
    this.state.hitCount = 0;
    this.state.activated = 0;
    this.state.isTriggered = 0;

    const m = this.member;
    this.listen({e:'ACT_S', t:'members', f:(buff, unit, data)=>{
      this.state.isTriggered = 0;
      if(!D.checkType(data.type,['NA','NS','US']) || (data.target!==this.target && data.target!=='enemies')) return;
      if(buff.state.activated) m.addBuff(Buff.getKey(m.name, '天赋', '罚恶'), data.member, 1, { count: 2});
      this.state.isTriggered = 1;
      buff.state.activated = 1;
    }})
    this.listen({e:'B_DMG_S', t:'enemy', f:(buff, unit, data)=>{
      if(!D.checkType(data.type,['NA','NS','US']) || this.state.isTriggered) return;
      if(buff.state.activated) m.addBuff(Buff.getKey(m.name, '天赋', '罚恶'), data.member, 1, { count: 2});
      this.state.isTriggered = 1;
      buff.state.activated = 1;
    }})
    this.listen({e:'ACT_E', t:'members', f:(buff, unit, data)=>{
      if(!D.checkType(data.type, ['NA','NS','US'])) return;
      if(!this.state.isTriggered) return;
      buff.state.hitCount++;
      if(buff.state.hitCount < 2) return;
      buff.state.hitCount=0;
      buff.state.count--;
      this.addSkillPoint(data.member);
    }})
    if(m.checkES('幽府')) {
      this.listen({e:'B_KILL', t:'enemy', f:(buff, unit, data)=>{
        if(buff.state.count>0) this.addSkillPoint(data.member);
      }})
    }
  }
  stack(sameBuff) {
    if(sameBuff.target === this.target) {
      this.state.hitCount = sameBuff.state.hitCount;
      this.state.activated = sameBuff.state.activated;
    }
  }  
  getDesc() {
    return `我方对其施放普攻战技终结技时获得[罚恶]效果。每受到2次攻击为我方恢复1战技点。`;
  }
  addSkillPoint(member) {
    const m = this.member;
    member.changeSp(1);
    if(m.checkES('录事')) m.addBuff(Buff.getKey(m.name, '天赋', '录事'), member, 1);
    if(m.checkES('还阳')) m.addEn(2);
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}
class BuffSpeedAtk extends Buff {
  static info() {
    return {
      name: '十王敕令',
      short: '敕令',
      source: '终结技',
      desc: '速度提高，攻击力提高。',
      show: true,
      maxValue: 1,
      target:'member',
      tags: ['buff', '加速', '加攻'],
    }
  }
  init() {
    const m = this.member;
    if(!m.checkSoul(1))return;
    this.listen({e:'C_KILL', t:'member', f:(buff, unit, data)=>{
      if(data.target.faction!=='enemies') return;
      if(m.updateCD(1, 'soul1CD', false, true)) m.changeWaitTime(-15, true);
    }});
  }
  getDesc() {
    const { speed, atkRate } = this.getData();
    return `速度提高${Math.floor(speed)}，攻击力提高${D.toPercent(atkRate)}。`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const { us } = this.member.skillData;
    return {
      speed: this.member.getAttr('speed') * 0.01 * us.speedR,
      atkRate: us.atkRate,
    }
  }
}

class SrHanya extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffSkillPoint),
      Buff.getListJson(this, BuffSpeedAtk, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.skillData.ps.bonusAll + (this.checkSoul(6)? 10: 0),
        name: '罚恶', source:'天赋', maxValue: 1, target:'member',
      }),
    ];
    if(this.checkES('录事')){
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', {
        atkRate: 10, name: '录事', source: '天赋',  maxValue: 1, target: 'member',
      }));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 20, name: '加速', source: '星魂',  maxValue: 1,
      }));
    }
    return list;
  }
  getStateExText() {
    const count = this.getStateExData();
    if(!count) return '承负未启用';
    return '剩余:'+count;
  }
  getStateExData() {
    const buff = this.findBuff({key:buffNsKey}, null, false);
    if(!buff) return 0;
    return buff.state.count;
  }
  updateReport(enemy){
    const others = [];
    if(this.checkES('还阳')) others.push(['还阳', 2]);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others }),
        ...this.getActionReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      this.addBuff(buffNsKey, target, 1);
      cb();
    }, 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
    if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '加速'), this, 1);
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(Buff.getKey(this.name, '终结技', '十王敕令'), target, 1, { count: this.checkSoul(4)? 3: 2});
      this.addEn(5);
    });
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this);
      const target = D.sample(this.team.getAliveUnits('enemies'));
      this.addBuff(buffNsKey, target, 1);
    });
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Physical', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(base * ns.rate, ['Physical', 'NS'], this, enemy)),
      R.getBreakReport(this, enemy),
    ];
  }
  // 获取基础的行动数据报告
  getActionReport() {
    const list = R.getActionReport(this);
    if(this.checkSoul(1)) {
      list.push({ type:'action', name:'一魂拉条', wait: C.calActionTime(this.getAttr('speed'))*0.15 });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrHanya,
};