'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffAtkRate } = require('../debuff_simple');
const { BuffAtkRate, BuffDamage } = require('../buff_simple');

const baseData = {
  name: '藿藿',
  image: 'huohuo.jpg',
  rarity: 'SSR',
  job: '丰饶',
  type: 'Wind',
  mainAttr: 'hp',
  damages: ['NA','NS'],
  hp: D.levelData['184_1358'],
  atk: D.levelData['81_601'],
  def: D.levelData['69_509'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 140,
  na: D.makeTable([['rate'],[25],[30],[35],[40],[45],[50],[55]]),
  naHits: [0.2,0.2,0.2,0.4],
  naSoul: 5,
  ns: D.makeTable([
    ['healCR','healC','healDR','healD'],
    [14.0, 140, 11.2, 112],
    [14.8, 224, 11.9, 179],
    [15.7, 287, 12.6, 229],
    [16.6, 350, 13.3, 280],
    [17.5, 392, 14.0, 313],
    [18.2, 434, 14.5, 347],
    [18.9, 465, 15.1, 372],
    [19.6, 497, 15.6, 397],
    [20.3, 528, 16.2, 422],
    [21.0, 560, 16.8, 448],
    [21.7, 591, 17.3, 473],
    [22.4, 623, 17.9, 498],
  ]),
  nsTarget: 'member',
  nsSoul: 5,
  ps: D.makeTable([['healR','heal'],[3.0, 30],[3.1, 48],[3.3, 61],[3.5, 75],[3.7, 84],[3.9, 93],[4.0, 99],[4.2, 106],[4.3, 113],[4.5, 120],[4.6, 126],[4.8, 133]]),
  psSoul: 3,
  us: D.makeTable([['enRate','atkRate'],[15.0, 24.0],[15.5, 25.6],[16.0, 27.2],[16.5, 28.8],[17.0, 30.4],[17.5, 32.0],[18.1, 34.0],[18.7, 36.0],[19.3, 38.0],[20.0, 40.0],[20.5, 41.6],[21.0, 43.2]]),
  usTarget: 'members',
  usSoul: 3,
  es: [ '不敢自专', '贞凶之命', '怯惧应激' ],
  attributes: [
    { hpRate: 4.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
    { speed: 2 }, { speed: 3 }, { dodge: 4.0 }, { dodge: 6.0 }, { dodge: 8.0 },
  ],
  defaultJson: {
    weapon:'惊魂夜', name4: '云无留迹的过客', name2: '不老者的仙舟',
    body: 'healRate', foot: 'speed', link:'enRate', ball:'hpRate',
  },
  aiConditions: [{value:'c_huohuoD',text:'净化次数'}, {value:'c_huohuoC', text:'攘命'}],
  ai:{
    na: ai.na_default,
    ns: {
      disable:false,
      rules:[[{t:"target",v:["hp","minp","gt",0]},{t:"hp",v:["t","percent","lt",40]}],[{t:"target",v:["member","藿藿"]},{t:"buff",v:["s","key","藿藿$天赋$攘命.","no",1]}]]
    },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[10, 4000, 99999],
      speed:[10, 0, 99999],
    },
    main: {
      body: 'healRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'hpRate',
    },
    set4: ['云无留迹的过客', null],
  },
};
const buffPsKey = Buff.getKey(baseData.name, '天赋', '攘命');
const buffSoul4Key = Buff.getKey(baseData.name, '星魂', '治疗加成');
class BuffRM extends Buff {
  static info() {
    return {
      name: '攘命',
      short: '攘命',
      source: '天赋',
      desc: '队友行动时为其恢复生命',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '治疗'],
    }
  }
  getDesc() {
    const m = this.member;
    const ps = m.skillData.ps;
    let text = `我方的回合开始或施放终结技时，为其恢复${Math.floor(m.getAttr('hp')*0.01*ps.healR+ps.heal)}生命，同时对生命值小于50%的队友各产生一次治疗。可以解除被治疗者一个负面状态，剩余${this.state.dispelCount}次。`
    if(m.checkSoul(1)) text+='我方全体速度提升12。';
    if(m.checkSoul(2)) text+=`我方目标可复活${2-(m.state.rebornCount || 0)}次。`;
    return text;
  }
  init() {
    this.state.dispelCount = 6;
    const m = this.member;
    this.listen({e:'TURN_S', t:'members', f:(buff, unit, data)=>{
      m.castPS(unit, buff);
    }})
    this.listen({e:'ACT_S', t:'members', f:(buff,unit, data)=>{
      if(D.checkType(data.type, 'US')) m.castPS(unit, buff);
    }})
    if(m.checkSoul(2)){
      this.listen({e:'BEFORE_DEATH', t:'members', f:(buff, unit, data)=>{
        if((m.state.hp>0 || m.state.rebornCount || 0)>=2) return;
        unit.state.hp = 0.01;
        m.triggerHeal([unit], unit.getAttr('hp')*0.5);
        buff.state.count--;
        m.state.rebornCount = (m.state.rebornCount || 0) + 1
      }})
    }
  }
  getAttributes() {
    return this.member.checkSoul(1)? {speedRate:12}:{};
  }
}
class BuffHealRate extends Buff {
  static info() {
    return {
      name: '治疗加成',
      short: '治疗+',
      source: '星魂',
      desc: '根据队友当前生命值获得治疗加成',
      show: false,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '治疗加成'],
    }
  }
  getAttributesT(t) {
    return { healRate: 80*(1-t.state.hp/t.getAttr('hp'))};
  }
}
class BuffEn extends Buff {
  static info() {
    return {
      name: '终结技回能',
      short: '回能',
      source: '光锥',
      desc: '回能',
      show:  false ,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  getReportData(target) {
    const m = this.member;
    if(target === m) return [];
    const en = target.base.enMax * m.skillData.us.enRate * 0.01; // 不吃充能
    return[{ type:'energy', name: '藿藿[终结技]', labels:[ '回复能量'], en0: en }];
  }
}

class SsrHuohuo extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('贞凶之命')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffEn),
      Buff.getListJson(this, BuffRM, [Buff.eventListener('TURN_S', 'self')]),
      Buff.getListJson(this, DebuffAtkRate, [Buff.simpleListener()], '', { atkRate: 25, name: '攻击力降低', source: '秘技', maxValue: 1 }),
      Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()],'', {
        atkRate: this.skillData.us.atkRate, name:'攻击力提升', source:'终结技', target:'member', maxValue: 1
      }),
    ];
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffHealRate));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: 50, name: '伤害提升', source:'星魂', target: 'member', maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getLiveReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...this.getEnergyReport(),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const { dispel, count } = this.getStateExData();
    return count>0?`剩余${dispel}次${count}回合`: '攘命未激活';
  }
  getStateExData(key) {
    const buff = this.findBuff({key:buffPsKey, target:'members'});
    const data = buff? { dispel: buff.state.dispelCount, count: buff.state.count }:{ dispel: 0, count: 0 };
    return key? data[key]: data;
  }
  castNA(target) { super.castNA(target, 'hp') }
  castNS(target) {
    super.castNS(target);
    this.actionHeal(cb=>{
      target.removeABuff('debuff');
      const buff = this.checkSoul(4)? this.addBuff(buffSoul4Key, this, 1): null;
      cb();
      if(buff)this.removeBuff(buff);
    }, 'NS', target, 'diff', this.getBaseHeal('ns','healC'), 30, this.getBaseHeal('ns','healD'));
    this.addBuff(buffPsKey, 'members', 1, { count: this.checkSoul(1)? 3: 2})
  }
  castUS(target){
    super.castUS(target);
    const members = this.team.getAliveUnits('members');
    A.actionBase({type:'US', member:this, target}, ()=>{
      members.forEach(m=>{
        if(m===this)return;
        this.addBuff(Buff.getKey(this.name, '终结技', '攻击力提升'), m, 1, {count:2});
        m.addEn(m.base.enMax * this.skillData.us.enRate * 0.01, true);
      });
      this.addEn(5);
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(Buff.getKey(this.name, '秘技', '攻击力降低'), e, 1, {count:1}, 1, 1));
  }
  castPS(target, buff) {
    const targets = [target].concat(this.team.members.filter(m=> m && m.checkAlive() && m.checkHp(50)));
    const buffHeal = this.checkSoul(4)? this.addBuff(buffSoul4Key, this, 1): null;
    for(let i=0; i<targets.length; i++) {
      const m = targets[i];
      if(buff.state.dispelCount>0){
        m.removeABuff('debuff');
        buff.state.dispelCount--;
      }
      this.triggerHeal([m], this.getBaseHeal('ps'));
      if(this.checkES('怯惧应激'))this.addEn(1);
    }
    if(buffHeal)this.removeBuff(buffHeal);
  }
  onEvent(e, unit, data) {
    if(unit!==this)return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
      if(this.checkES('不敢自专'))this.addBuff(buffPsKey, 'members', 1, {count:1});
    } else if(e==='C_HEAL_S') {
      if(this.checkSoul(6))this.addBuff(Buff.getKey(this.name, '星魂', '伤害提升'), data.targets[data.idx], 1, {count:2});
    }
    super.onEvent(e, unit, data);
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    const bonus = this.checkSoul(4)? 80*(1-this.state.hp/this.getAttr('hp')): 0;
    list.push({
      type:'heal', name:'战技[回复]', labels:['主目标', '相邻队友'],
      heal0: C.calHealData(this.getBaseHeal('ns','healC'), this, this, bonus),
      heal1: C.calHealData(this.getBaseHeal('ns','healD'), this, this, bonus),
    }, {
      type:'heal', name:'天赋[回复]', labels:['治疗量'],
      heal0: C.calHealData(this.getBaseHeal('ps','heal'), this, this, bonus),
    });
    if(this.checkES('贞凶之命')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35.0) });
    }
    return list;
  }
  getEnergyReport(){
    const list = R.getEnergyReport(this, { ns:30, us:5 });
    if(this.checkES('怯惧应激')) {
      list.push({ type: 'energy', name: '触发天赋[回能]', labels: ['治疗回能'], en0: C.calEnergy(1, this)});
    }
    return list;
  }
  getDamageReport(enemy){
    return [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(this.getBaseDmg('na','rate','hp'), ['Wind', 'NA'], this, enemy)),
      R.getBreakReport(this,enemy),
    ];
  }
}

module.exports = {
  data: baseData,
  character: SsrHuohuo,
};