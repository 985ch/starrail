'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');

const baseData = {
  name: '开拓者(毁灭)',
  image: 'trailblazer_des.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Physical',
  hp: D.levelData['163_1203'],
  atk: D.levelData['84_620'],
  def: D.levelData['62_460'],
  speed: 100,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[62],[68],[75],[81],[87],[93],[101],[109],[117],[125],[131],[137]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 3,
  ps: D.makeTable([['atkRate'],[10], [11], [12], [13], [14], [15], [16], [17], [18], [20],[21],[22]]),
  psSoul: 3,
  us: D.makeTable([
    ['rateS','rateC', 'rateD'],
    [300, 180, 108],
    [315, 189, 113],
    [330, 198, 118],
    [345, 207, 124],
    [360, 216, 129],
    [375, 225, 135],
    [393, 236, 141],
    [412, 247, 148],
    [431, 258, 155],
    [450, 270, 162],
    [465, 279, 167],
    [480, 288, 172],
  ]),
  usTarget: 'enemy',
  usHits: [1], 
  usSoul: 5,
  es: ['蓄势', '坚韧', '斗志'],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    {defRate: 5.0}, {defRate: 7.5}, {hpRate: 4.0}, {hpRate: 6.0}, {hpRate: 8.0},
  ],
  defaultJson: {
    weapon:'记一位星神的陨落', name4: '街头出身的拳王', name2: '繁星竞技场',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusPhysical',
  },
  aiLabels: [['ns','战技'],['us','终结技'],['usA','终单'],['usB','终扩'],['na','普攻']],
  ai: {
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us: ai.us_always,
    usA:{
      disable:false,
      rules:[]
    },
    usB:{
      disable:false,
      rules:[[{t:"target",v:["selected"]},{t:"enCount",v:["gt",1]}]]
    }
  },
};

class BuffDZ extends Buff {
  static info() {
    return {
      name: '斗志',
      short: '增伤',
      source: '天赋',
      desc: '对指定目标伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  getAttributesT(target) {
    return target.name===this.member.state.lockTarget?  { bonusAll: 25 } : {};
  }
}
class BuffAtkRate extends Buff {
  static info() {
    return {
      name: '牵制盗垒',
      short: '攻防',
      source: '天赋',
      desc: '攻击和防御提升',
      show: true,
      maxValue: 2,
      target: 'self',
      tags: ['buff', '加攻', '加防']
    }
  }
  getDesc() {
    const {atkRate, defRate} = this.getData();
    return `攻击力提高${atkRate}%${defRate?`，防御力提高${defRate}%`:''}。`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const m = this.member;
    const data = { atkRate: m.skillData.ps.atkRate*this.value };
    if(m.checkES('坚韧')) data.defRate = 10*this.value;
    return data;
  }
}
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '弱点暴击',
      short: '暴击',
      source: '星魂',
      desc: '暴击',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: []
    }
  }
  getAttributesT(target) {
    return target.findBuff({tag:'破韧'})?  {criRate: 25} : {};
  }
}

class SsrTrailblazerDes extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [Buff.getListJson(this, BuffAtkRate)]
    if(this.checkES('斗志')) {
      list.push(Buff.getListJson(this, BuffDZ));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffCriRate))
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...this.getDefendReport(enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getBattleActions(isMyTurn) {
    if(this.checkBonusTurn()) {
      return [{
        text: '对单',
        key: 'usA',
        target: 'enemy',
        disable: false,
      },{
        text: '扩散',
        key: 'usB',
        target: 'enemy',
        disable: false,
      }]
    }
    return super.getBattleActions(isMyTurn);
  }
  onAction(data) {
    const t = data.target;
    switch(data.key) {
      case 'usA':
        this.actionAttack(cb=>cb(), 'US', t, 'single', 5, this.rawFunc(3, 'us','rateS'), this.base.naHits);
        this.endBonusTurn();
        break;
      case 'usB':{
        this.state.lockTarget = t.name;
        this.actionAttack(cb=>cb(), 'US', t, 'diff', 5, this.rawDiffFunc(2, 1, 'us', 'rateC', 'rateD'), this.base.nsHits, [1]);
        this.state.lockTarget = '';
        this.endBonusTurn();
        break;
      }
      default:
        break;
    }
    super.onAction(data);
  }
  castNS(target) {
    super.castNS(target);
    this.state.lockTarget = target.name;
    this.actionAttack(cb=>cb(), 'NS', target, 'diff', 30, this.rawDiffFunc(2, 1, 'ns'), this.base.nsHits,[1]);
    this.state.lockTarget = '';
  }
  castUS(target){
    super.castUS(target);
    this.startBonusTurn();
  }
  castSP() {
    this.changeSp(-1);
    this.team.members.forEach(m => {
      if(!m)return;
      const hpMax = m.getAttr('hp');
      m.state.hp = Math.min(hpMax, m.state.hp + hpMax*0.15);
    })
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    switch(e) {
      case 'C_BREAK':
        this.addBuff(Buff.getKey(this.name, '天赋', '牵制盗垒'), this, 1);
        break;
      case 'BTL_S':
        if(this.checkES('蓄势')) this.addEn(15);
        break;
      case 'C_KILL':
        if(this.checkSoul(1) && D.checkType(data.type, 'US') && !this.state.addedEn) {
          this.state.addedEn = true;
          this.addEn(10);
        }
        if(this.checkSoul(6)) {
          this.addBuff(Buff.getKey(this.name, '天赋', '牵制盗垒'), this, 1);
        }
        break;
      case 'C_ATK_E':
        if(this.checkSoul(2)) {
          data.targets.forEach(t => {
            if(t.findBuff({tag:'weakPhysical'})) this.triggerHeal([this], this.getAttr('atk')*0.05);
          })
        }
        this.state.addedEn = false;
        break;
      default:
        break;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const bonus = this.checkES('斗志')?25: 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Physical', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rate, [ 'Physical', 'NS'], this, enemy, null, {bonus})),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rate, [ 'Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[单体]', brkDmg: brkDmg*3 }, C.calDmg(base * us.rateS, [ 'Physical', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * us.rateC, [ 'Physical', 'US'], this, enemy, null, {bonus})),
      Object.assign({ type: 'damage', name:'终结技[扩散]', brkDmg }, C.calDmg(base * us.rateD, [ 'Physical', 'US'], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  getEnergyReport() {
    const others = this.checkES('蓄势')?[['进战回能', 15]]:null;
    const list = R.getEnergyReport(this, {others});
    if(this.checkSoul(1)) list.push({type:'energy', name:'终结技击杀', tip:'每次攻击触发一次', labels:['额外回能'], en0:C.calEnergy(10, this)});
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    if(enemy.findBuff({tag:'weakPhysical'})){
      list.push({ type:'heal', name:'攻击回血', labels: ['治疗量'], heal0: C.calHealData(this.getAttr('atk') * 0.05, this, this) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrTrailblazerDes,
};