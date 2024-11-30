'use strict';

const { SummonUnit, Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffCriDamage } = require('../buff_simple');

const baseData = {
  name: '托帕&账账',
  image: 'topaz.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Fire',
  damages: ['AA','NS'],
  hp: D.levelData['126_931'],
  atk: D.levelData['84_620'],
  def: D.levelData['56_412'],
  speed: 110,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 130,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['weakAA','rate'],[25,75],[27.5,82],[30,90],[32.5,97],[35,105],[37.5,112],[40,121],[43,131],[46,140],[50,150],[52,157],[55,165]]),
  nsTarget: 'enemy',
  nsHits: [1/7,1/7,1/7,1/7,1/7,1/7,1/7],
  nsSoul: 3,
  ps: D.makeTable([['rate'],[75],[82],[90],[97],[105],[112],[121],[131],[140],[150],[157],[165]]),
  psHits: [1/7,1/7,1/7,1/7,1/7,1/7,1/7],
  psSoul: 5,
  us: D.makeTable([['rateBonus','criDamage'],[75,12],[82,13],[90,15],[97,16],[105,17],[112,18],[121,20],[131,21],[140,23],[150,25],[157,26],[165,27]]),
  usHits: [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.3],
  usTarget: 'self',
  usSoul: 5,
  es: [ '透支', '金融动荡', '技术性调整' ],
  attributes: [
    { bonusFire: 3.2 }, { bonusFire: 3.2 }, { bonusFire: 4.8 }, { bonusFire: 4.8 }, { bonusFire: 6.4 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { criRate: 2.7 }, { criRate: 4.0 }, { criRate: 5.3 },
  ],
  defaultJson: {
    weapon:'烦恼着，幸福着', name4: '毁烬焚骨的大公', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'enRate', ball:'bonusFire',
  },
  aiConditions: [{value:'c_topaz',text:'涨幅惊人'}],
  ai:{
    na: ai.na_buff_yesT("托帕&账账$战技$负债证明."),
    ns: ai.ns_always,
    us: {
      disable:false,
      rules:[[{t:"c_topaz",v:["eq",0]}]]
    }
  },
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusFire',
    },
    set4: ['毁烬焚骨的大公', '毁烬焚骨的大公'],
    set2: '停转的萨尔索图'
  },
};

const buffUsKey = Buff.getKey(baseData.name, '终结技', '涨幅惊人');
const buffNsKey = Buff.getKey(baseData.name, '战技', '负债证明');

class DebuffFZZM extends Buff {
  static info() {
    return {
      name: '负债证明',
      short: '标记',
      source: '战技',
      desc: '受到的追击伤害增加',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', 'weakAA', '弱追击'],
    }
  }
  init() {
    const { member, target} = this;
    this.listen({e:'B_DMG_S', t:'enemy', f:(buff, unit, data)=>{
      const types = member.findBuff({ key: buffUsKey })?['NA','NS','US','AA']:['AA'];
      if(!member.pig.state.attacking && D.checkType(data.type, types)) {
        member.pig.changeWaitTime(-50, true);
      }
      if(member.checkSoul(1) && D.checkType(data.type, 'AA')) {
        member.addBuff(Buff.getKey(member.name, '星魂', '被执行'), target, 1)
      }
    }})
  }
  getDesc() {
    let text = `受到追加攻击伤害提升${this.member.skillData.ns.weakAA}%`;
    if(this.member.checkSoul(1)) text+='，受到追加攻击时陷入【被执行】状态'
    return text + '。';
  }
  getAttributes() {
    return { weakAA: this.member.skillData.ns.weakAA }
  }
  beforeRemove(newBuff) {
    if(!newBuff || newBuff.target !== this.target) {
      const buff = this.target.findBuff({tag:'被执行'});
      if(buff)this.target.removeBuff(buff, true);
    }
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}
class DebuffBZX extends Buff {
  static info() {
    return {
      name: '被执行',
      short: '被执行',
      source: '星魂',
      desc: '受到追加攻击的暴伤提高',
      show: true,
      maxValue: 2,
      target: 'enemy',
      tags: ['debuff', '被执行'],
    }
  }
  getDesc() {
    return `受到追加攻击的暴击伤害增加${this.value*25}%。`;
  }
  init() {
    const { member, target} = this;
    this.listen({e:'B_HIT_S', f:(buff, unit, data)=>{
      if(D.checkType(data.type, 'AA')) {
        member.addBuff(Buff.getKey(member.name, '星魂', '执行'), data.member, this.value);
      }
    }})
  }
}
class BuffZFJR extends Buff {
  static info() {
    return {
      name: '涨幅惊人',
      short: '暴涨',
      source: '终结技',
      desc: '账账攻击倍率提高，暴伤提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '涨幅惊人'],
    }
  }
  getDesc() {
    const us=this.member.skillData.us;
    return `账账的伤害倍率提高${us.rateBonus}%，暴击伤害提高${us.criDamage}%。`;
  }
}
class BuffJRDD extends Buff {
  static info() {
    return {
      name: '金融动荡',
      short: '增伤',
      source: '天赋',
      desc: '对弱火敌人伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  getAttributesT(target) {
    return target.findBuff({ tag:'weakFire' })?  { bonusAll: 15 } : {};
  }
}
class BuffRandomMark extends Buff {
  static info() {
    return {
      name: '随机标记',
      short: '随机标记',
      source: '天赋',
      desc: '随机给敌人上标记',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    }
  }
  init() {
    this.listen({e:'C_DMG_S', t:'members', f:()=>{
      this.member.randomMark();
    }})
    this.listen({e:'TURN_S', t:'members', f:()=>{
      this.member.randomMark();
    }})
  }
}

class Pig extends SummonUnit {
  getBase() {
    return { image:'zhangzhang.jpg', rarity:'SSR'}
  }
  calActionTime() {
    return C.calActionTime(80, 0);
  }
  getActions() {
    if(!this.team.state.inBattle || !this.checkAlive() || !this.checkMyTurn(true) || !this.canAction()) return [];
    return [{
      text: '追击',
      key: 'na',
      target: 'enemies',
      tarRaw: 'dmg',
      noRecord: true,
      disable: false,
    }]
  }
  onAction(data) {
    let { key } = data;
    if(key === 'na') {
      const m = this.owner;
      A.actionBase({type:'AA', member:m, target:'enemies' }, ()=>{
        const nsBuff = m.randomMark();
        const target = nsBuff? nsBuff.target : null;
        if(!target) return;

        const buff = m.findBuff({key:buffUsKey});
        const en = (m.state.enBonus?60:0) + m.getEnBonus(buff);
        m.state.enBonus = false;
        this.state.attacking = true;
        m.pigAttack(target, ['AA'], m.skillData.ps.rate, 1, en, buff);
      });
      this.state.attacking = false;
      this.team.state.acted = true
    }
    super.onAction(data);
  }
  onEvent(e, unit, data) {
    if(e === 'TURN_S' && unit === this && this.owner.checkSoul(4)) {
      this.owner.changeWaitTime(-20, true);
    }
    super.onEvent(e, unit, data);
  }
}

class SsrTopaz extends Character {
  constructor(team, index, json) {
    super(team, index, json);
    this.pig = new Pig(this, '账账')
  }
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffRandomMark),
      Buff.getListJson(this, DebuffFZZM),
      Buff.getListJson(this, BuffZFJR, [Buff.eventListener('TOPAZ_PIGATK', 'self')]),
    ];
    if(this.checkES('金融动荡')){
      list.push(Buff.getListJson(this, BuffJRDD))
    }
    if(this.checkSoul(1)){
      list.push(
        Buff.getListJson(this, DebuffBZX),
        Buff.getListJson(this, BuffCriDamage, [Buff.eventListener('C_HIT_E', 'self')],'',{
          criDamage: 25, name:'执行', source:'星魂', hide: true, maxValue: 2,
        }));
    }
    return list;
  }
  getSummonList(){
    return [this.pig];
  }
  updateReport(enemy){
    const buff = this.findBuff({key:buffUsKey});
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, buff),
        ...this.getActionReport(),
        ...this.getEnergyReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return '涨幅惊人：'+this.getStateExData();
  }
  getStateExData() {
    const buff = this.findBuff({key:buffUsKey});
    return (buff? buff.state.count : 0);
  }
  castNA(target) {
    const type = this.checkES('透支')?['NA','AA']:'NA';
    this.actionAttack(cb=>cb(), type, target, 'single', 20, this.rawFunc(1, 'na'), baseData.naHits);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', target, member:this }, ()=>{
      this.addBuff(buffNsKey, target, 1);
      const buff = this.findBuff({key:buffUsKey});
      this.pigAttack(target, ['NS', 'AA'], this.skillData.ns.rate, 2, 30, buff);
    });
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', target, member:this }, ()=>{
      this.addBuff(buffUsKey, this, 1, { count: this.checkSoul(6)? 3 : 2});
    });
    this.addEn(5);
  }
  castSP() {
    this.changeSp(-1);
    this.state.enBonus = true;
  }
  randomMark() {
    const buff = this.findBuff({key:buffNsKey}, null, false);
    if(buff)return buff;
    const enemies = this.team.getAliveUnits('enemies');
    if(enemies.length===0)return null;
    const target = enemies[Math.floor(Math.random()*enemies.length)];
    return this.addBuff(buffNsKey, target, 1);
  }
  pigAttack(target, types, rate, brkDmg, en, buff) {
    const rawDmg = () => {
      return { raw: this.getAttr('atk') * (rate + (buff? this.skillData.us.rateBonus : 0)) * 0.01, brkDmg };
    };
    const hits = buff? baseData.usHits : baseData.nsHits;
    A.triggerAttack({type: types, member: this, target, atkType:'single', attrType:'Fire', en, hits, rawDmg }, null, (dmg, data, typeList, info)=>{
      return this.calPigDamage(dmg, typeList, info.t, buff);
    })
    this.triggerEvent('TOPAZ_PIGATK', {});
  }
  getDamageReport(enemy, buff) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const naTypes = this.checkES('透支')?['Fire','NA','AA']:['Fire','NA'];
    const bonusRate = buff? us.rateBonus : 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, naTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, this.calPigDamage(base * (ns.rate + bonusRate), ['Fire', 'NS', 'AA'], enemy, buff)),
      Object.assign({ type: 'damage', name:'账账追击', brkDmg}, this.calPigDamage(base * (ps.rate + bonusRate), ['Fire', 'AA'], enemy, buff)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getActionReport() {
    const list = R.getActionReport(this);
    if(this.checkSoul(4)) {
      const wait = 0.2 * C.calActionTime(this.getAttr('speed'));
      list.push({ type:'action', name:'拉条[托帕]', wait });
    }
    const pigWait = C.calActionTime(80);
    list.push({ type:'action', name:'行动间隔[账账]', wait: pigWait});
    list.push({ type:'action', name:'拉条[账账]', wait: 0.5 * pigWait})
    return list;
  }
  getEnergyReport(buff) {
    const list = R.getEnergyReport(this);
    const en = 10 + this.getEnBonus(buff);
    list.push({ type:'energy', name:'账账[回能]', labels:['秘技', '攻击回能'], en0: C.calEnergy(60 - 10 + en, this), en1: C.calEnergy(en, this)})
    return list;
  }
  getEnBonus(buff){
    return (this.checkSoul(2)?5:0) + ((buff && this.checkES('技术性调整'))?10 : 0)
  }
  calPigDamage(damage, types, enemy, buff) {
    const defendFix = (buff && this.checkSoul(6))? -10: 0;
    return C.calDmg(damage, types, this, enemy, null, {
      criDmg: buff? this.skillData.us.criDamage : 0,
      defend: defendFix,
    });
  }
}

module.exports = {
  data: baseData,
  character: SsrTopaz,
};