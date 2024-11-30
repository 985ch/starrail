'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBreakRate } = require('../buff_simple');

const baseData = {
  name: '阮•梅',
  image: 'ruanmei.jpg',
  rarity: 'SSR',
  job: '同谐',
  type: 'Ice',
  damages: ['NA','NS'],
  hp: D.levelData['147_1086'],
  atk: D.levelData['89_659'],
  def: D.levelData['66_485'],
  speed: 104,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 130,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['bonusAll','breakBonus'],[16,50],[17.6,50],[19.2,50],[20.8,50],[22.4,50],[24,50],[26,50],[28,50],[30,50],[32,50],[33.6,50],[35.2,50],[36.8,50],[38.4,50],[40,50]]),
  nsTarget: 'members',
  nsSoul: 5,
  ps: D.makeTable([['speedRate','rate'],[8,60],[8.2,66],[8.4,72],[8.6,78],[8.8,84],[9,90],[9.25,97.5],[9.5,105],[9.75,112.5],[10,120],[10.2,126],[10.4,132],[10.6,138],[10.8,144],[11,150]]),
  psSoul: 3,
  us: D.makeTable([['throughAll','rate'],[15,30],[16,32],[17,34],[18,36],[19,38],[20,40],[21.25,42.5],[22.5,45],[23.75,47.5],[25,50],[26,52],[27,54],[28,56],[29,58],[30,60]]),
  usTarget: 'members',
  usSoul: 3,
  es: [ '物体呼吸中', '日消遐思长', '落烛照水燃' ],
  attributes: [
    {breakRate: 5.3}, {breakRate: 5.3}, {breakRate: 8.0}, {breakRate: 8.0}, {breakRate: 10.7},
    {speed: 2.0 }, {speed: 3.0 }, {defRate: 5.0 }, {defRate: 7.5 }, {defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'镜中故我', name4: '骇域漫游的信使', name2: '盗贼公国塔利亚',
    body: 'hpRate', foot: 'hpRate', link:'breakRate', ball:'hpRate',
    def:[0,0,1], atk:[0,0,1],
  },
  aiConditions: [{value:'c_ruanmeiN',text:'弦外音'}, {value:'c_ruanmeiU', text:'结界回合'}],
  ai:{
    na: ai.na_breaker('弱冰'),
    ns: ai.ns_buff_noS("阮•梅$战技$弦外音."),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      breakRate:[100, 0, 180],
      speed:[10, 0, 99999],
    },
    main: {
      foot: 'speed',
      link: 'breakRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
  },
};

const buffNsKey = Buff.getKey(baseData.name, '战技', '弦外音');
const buffUsKey = Buff.getKey(baseData.name, '终结技', '阮梅结界')
const buffCMZKey = Buff.getKey(baseData.name, '终结技', '残梅绽'); 
class BuffNS extends Buff {
  static info() {
    return {
      name: '弦外音',
      short: '弦外音',
      source: '战技',
      desc: '伤害及弱点击破效率提高',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff','增伤','bonusAll','击破'],
    };
  }
  getDesc() {
    const { bonusAll, breakBonus } = this.getData();
    return `伤害提高${D.toPercent(bonusAll)}，击破效率提高${D.toPercent(breakBonus)}。`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const m = this.member;
    const ns = m.skillData.ns;
    const plus = m.checkES('落烛照水燃')? Math.min(36, Math.max(0, Math.floor((m.attr.data.breakRate-120)/10)*6)) : 0;
    return {
      bonusAll: ns.bonusAll + plus,
      breakBonus: ns.breakBonus,
    }
  }
}
class BuffUS extends Buff {
  static info() {
    return {
      name: '阮梅结界',
      short: '结界',
      source: '终结技',
      desc: '全抗性穿透，我方可给敌人附加[残梅绽]',
      show: true,
      maxValue: 1,
      target:'members',
      tags: ['buff','全抗性穿透','throughAll'],
    }
  }
  getDesc() {
    const us = this.member.skillData.us;
    return `全抗性穿透提高${D.toPercent(us.throughAll)}${this.member.checkSoul(1)? '，防御穿透提高20%': ''}，我方攻击时可给敌人附加[残梅绽]。`;
  }
  init() {
    const m = this.member;
    this.listen({e:'C_DMG_E', t:'members', f:(buff, unit, data)=>{
      data.targets.forEach(t => {
        if(!t.findBuff({key:buffCMZKey})) m.addBuff(buffCMZKey, t);
      })
    }});
  }
  getAttributes() {
    const us = this.member.skillData.us;
    return {
      throughAll: us.throughAll,
      defThrough: this.member.checkSoul(1)? 20 : 0,
    }
  }
}
class BuffCMZ extends Buff {
  static info() {
    return {
      name: '残梅绽',
      short: '残梅绽',
      source: '终结技',
      desc: '击破状态延长并额外受到击破伤害',
      show: true,
      maxValue: 1,
      target:'enemy',
      tags: ['debuff'],
    }
  }
  init() {
    const m = this.member;
    this.state.activated = false;
    this.listen({e:'SHIELD_RES', t:'enemy', f:(buff, unit, data) => {
      if(this.state.activated) {
        this.state.count--;
        return;
      };
      // 触发残梅绽效果
      unit.addBuff(Buff.getKey(unit.name, '击破', '破韧'), unit, 1);
      unit.team.state.acted = true;
      unit.state.shield = 0;
      unit.setNextWaitTime(m.attr.data.breakRate * 0.2 + 10);
      m.triggerBonusBreak(unit, m.skillData.us.rate);
      this.state.activated = true;
    }})
  }
  getDesc() {
    const damage = this.getData();
    return `从弱点击破状态恢复时延长弱点击破状态，受到${Math.floor(damage)}点击破伤害，且行动延后${D.toPercent(this.member.attr.data.breakRate * 0.2 + 10)}。`;
  }
  getData() {
    const m = this.member;
    const { damage } = m.getBreakDamage(this.target);
    return damage * m.skillData.us.rate * 0.01;
  }
}
class BuffPS extends Buff {
  static info() {
    return {
      name: '分型的螺旋',
      short: '螺旋',
      source: '天赋',
      desc: '速度提高，我方击破时附加额外的击破伤害',
      show: false,
      maxValue: 0,
      target:'members',
      tags: ['buff','加速'],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'C_BREAK', t:'members', f:(buff, unit, data)=>{
      m.triggerBonusBreak(data.target, m.skillData.ps.rate + (m.checkSoul(6)? 200 : 0));
      if(m.checkSoul(4))m.addBuff(Buff.getKey(m.name, '星魂', '击破特攻'), m, 1, { count: 3});
    }});
  }
  getAttributes(target) {
    const m = this.member;
    const ps = m.skillData.ps;
    return {
      speedRate: target===m? 0: ps.speedRate,
      breakRate: m.checkES('物体呼吸中')? 20 : 0,
    }
  }
  getAttributesT(target) {
    if(this.member.checkSoul(2) && target.findBuff({tag:'破韧'})) return { atkRate: 40 };
    return {};
  }
}

class SsrRuanmei extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffNS, [Buff.eventListener('TURN_S','self')]),
      Buff.getListJson(this, BuffUS, [Buff.eventListener('TURN_S', 'self')]),
      Buff.getListJson(this, BuffCMZ),
      Buff.getListJson(this, BuffPS),
    ];
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffBreakRate, [Buff.simpleListener()], '', {
        breakRate: 100, name: '击破特攻', source: '星魂',  maxValue: 1,
      }));
    }
    return list;
  }
  getStateExText() {
    const { ns, us } = this.getStateExData();
    return `战技${ns}结界${us}`;
  }
  getStateExData(key) {
    const buffNs = this.findBuff({key:buffNsKey, target:'members'});
    const buffUs = this.findBuff({key:buffUsKey, target:'members'});
    const data = {
      ns: buffNs? buffNs.state.count: 0,
      us: buffUs? buffUs.state.count: 0,
    };
    return key? data[key]: data;
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
  castNS(target, isSp = false) {
    if(!isSp)super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffNsKey, target, 1, { count: 3 });
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(buffUsKey, target, 1, { count: this.checkSoul(6)? 3 : 2 });
    });
    this.addEn(5);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  castAction(data) {
    if(data.type==='NS') {
      const action = { text:'战技', key: 'ns', target:'members', noRecord: true}
      this.team.logger.startAction(this, action);
      this.castNS(this, true);
      return;
    }
    super.castAction(data);
  }
  triggerBonusBreak(target, rate) {
    const dmgInfo = this.getBreakDamage(target);
    const damage = dmgInfo.damage * rate * 0.01 / 0.9;
    A.newAddDmg(this, this, [target], damage, false, this.base.type, 'BRK', {}, ()=>{
      return { damage, expDamage: damage };
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='TURN_S' && this.checkES('日消遐思长')) {
      this.addEn(5);
    } else if(e==='BTL_S' && this.state.spActivated) {
      this.pushAction({type:'NS'});
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, us, ps } = this.skillData;
    const { damage } = this.getBreakDamage(enemy);
    const usDmg = damage*us.rate*0.01;
    const psDmg = damage*(ps.rate + (this.checkSoul(6)? 200 : 0))*0.01/0.9;

    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(base * na.rate, ['Ice', 'NA'], this, enemy)),
      { type: 'damage', name:'终结技追伤', damage: usDmg, expDamage: usDmg},
      { type: 'damage', name:'天赋追伤', damage: psDmg, expDamage: psDmg},
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getEnergyReport() {
    const list = R.getEnergyReport(this);
    if(this.checkES('日消遐思长')) {
      list.push({ type:'energy', name:'日消遐思长[回能]', labels:['每回合'], en0: C.calEnergy(5, this)});
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrRuanmei,
};