'use strict';

const { SummonUnit, Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffWeakType } = require('../debuff_simple');
const { BuffBreakRate } = require('../buff_simple');

const baseData = {
  name: '灵砂',
  image: 'lingsha.jpg',
  rarity: 'SSR',
  job: '丰饶',
  type: 'Fire',
  damages: ['NS','AA'],
  hp: D.levelData['184_1358'],
  atk: D.levelData['92_679'],
  def: D.levelData['59_436'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([
    ["rate","healR","heal"],
    [40,10,105],
    [44,10.5,168],
    [48,11,215.25],
    [52,11.5,262.5],
    [56,12,294],
    [60,12.4,325.5],
    [65,12.8,349.125],
    [70,13.2,372.75],
    [75,13.6,396.375],
    [80,14,420],
    [84,14.4,443.625],
    [88,14.8,467.25],
    [92,15.2,490.875],
    [96,15.6,514.5],
    [100,16,538.125],
  ]),
  nsTarget: 'enemies',
  nsHits:[1],
  nsSoul: 5,
  ps: D.makeTable([
    ["rate","healR","heal"],
    [37.5,8,90],
    [41.25,8.5,144],
    [45,9,184.5],
    [48.75,9.5,225],
    [52.5,10,252],
    [56.25,10.4,279],
    [60.94,10.8,299.25],
    [65.62,11.2,319.5],
    [70.31,11.6,339.75],
    [75,12,360],
    [78.75,12.4,380.25],
    [82.5,12.8,400.5],
    [86.25,13.2,420.75],
    [90,13.6,441],
    [93.75,14,461.25],
  ]),
  psSoul: 3,
  us: D.makeTable([
    ["rate","healR","heal","weakBRK"],
    [90,8,90,15],
    [96,8.5,144,16],
    [102,9,184.5,17],
    [108,9.5,225,18],
    [114,10,252,19],
    [120,10.4,279,20],
    [127.5,10.8,299.25,21.25],
    [135,11.2,319.5,22.5],
    [142.5,11.6,339.75,23.75],
    [150,12,360,25],
    [156,12.4,380.25,26],
    [162,12.8,400.5,27],
    [168,13.2,420.75,28],
    [174,13.6,441,29],
    [180,14,461.25,30],
  ]),
  usHits: [1],
  usTarget: 'enemies',
  usSoul: 3,
  es: [ '朱燎', '兰烟', '遗爇' ],
  attributes: [
    { breakRate: 5.3 }, { breakRate: 5.3 }, { breakRate: 8.0 }, { breakRate: 8.0 }, { breakRate: 10.7 },
    { atkRate: 4.0 }, { atkRate: 6.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'唯有香如故', name4: '荡除蠹灾的铁骑', name2: '沉陆海域露莎卡',
    body: 'healRate', foot: 'speed', link:'enRate', ball:'atkRate',
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_always,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      atk:[10, 0, 3500],
      speed:[10, 0, 99999],
    },
    main: {
      body: 'healRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'atkRate',
    },
    set4: ['荡除蠹灾的铁骑', null],
  },
};

const buffRabbitKey = Buff.getKey(baseData.name, '天赋', '浮元');

class BuffRabbit extends Buff {
  static info() {
    return {
      name: '浮元',
      short: '浮元',
      source: '天赋',
      desc:'浮元未被召唤',
      show: true,
      maxValue: 5,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `浮元尚可行动${this.value}次`
  }
  init() {
    const m = this.member
    m.rabbit.summon()
    if(m.checkES('遗爇')) this.listen({e:'HP_CHANGE', t:'members', f:(buff, unit, data)=>{
      if(data.change>=0 || !m.rabbit.canActionSp()) return;
      const members = this.member.team.members
      for(let member of members) {
        if(member.checkAlive() && member.checkHp(60, false)) {
          m.pushAction({type:'LingshaAA'})
          return
        }
      }
    }})
  }
  beforeRemove() {
    this.member.rabbit.dismiss();
  }
}
class DebuffRabbit extends Buff {
  static info() {
    return {
      name: '减抗',
      short: '减抗',
      source: '星魂',
      desc:'浮元在场时，全属性减抗20%。',
      show: true,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  getDesc() {
    return this.isActivated()? '全属性减抗20%。': '浮元不在场，无效果。';
  }
  isActivated() {
    return this.member.rabbit.checkAlive();
  }
  getAttributes() {
    return this.isActivated()? { defendAll: -20 }: {};
  }
}
class BuffLingsha extends Buff {
  static info() {
    return {
      name: '朱燎',
      short: '朱燎',
      source: '天赋',
      desc:'根据击破提升攻击力及治疗量',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const breakRate = this.member.attr.data.breakRate;
    return `攻击力提高${D.toPercent(Math.min(50, breakRate * 0.25))}，治疗量提高${D.toPercent(Math.min(20, breakRate * 0.1))}。`
  }
  getTransAttr() {
    return {
      atkRate: { raw:'breakRate', rate:0.25, max: 50 },
      healRate: { raw:'breakRate', rate:0.1, max: 20 }
    };
  }
}
class DebuffDefRate extends Buff {
  static info() {
    return {
      name: '减防',
      short: '减防',
      source: '星魂',
      desc:'弱点击破情况下防御力降低20%',
      show: true,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  getDesc(target) {
    return target.findBuff({tag:'破韧'})? '防御力降低20%。': '弱点未击破，无效果。';
  }
  isActivated(target) {
    return target.findBuff({tag:'破韧'})? true: false;
  }
  getAttributes(target) {
    return target.findBuff({tag:'破韧'})? { defRate: -20 }: {};
  }
}

class Rabbit extends SummonUnit {
  constructor(owner, name) {
    super(owner, name);
    this.actCD = 0;
  }
  getBase() {
    return { image:'rabbit.jpg', rarity:'SSR'}
  }
  calActionTime() {
    return C.calActionTime(90, 0);
  }
  checkAlive() {
    const buff = this.owner.findBuff({key:buffRabbitKey}, null, false)
    return (buff && super.checkAlive())? true: false;
  }
  canActionSp() {
    return this.actCD === 0 && this.checkAlive()
  }
  getActions() {
    if(!this.team.state.inBattle || !this.checkAlive() || !this.checkMyTurn(true) || !this.canAction()) return []
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
      this.owner.rabbitAttack()
      this.team.state.acted = true
    }
    super.onAction(data);
  }
  enter() {
    this.actCD = 0;
    this.state.wait = 10000/90;
    this.team.updateActionUnit(this);
  }
}

class SsrLingsha extends Character {
  constructor(team, index, json) {
    super(team, index, json);
    this.rabbit = new Rabbit(this, '浮元');
  }
  getSummonList(){
    return [this.rabbit];
  }
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkSoul(1)) list.push({ breakBonus:50 });
    return list;
  }
  getCharacterBuffList(){
    const { us } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffRabbit),
      Buff.getListJson(this, DebuffWeakType, [Buff.simpleListener()], '', {
        type:'BRK', weakBRK: us.weakBRK, name:'醇醉', source:'终结技', maxValue:1, 
      })
    ];
    if(this.checkES('朱燎')) {
      list.push(Buff.getListJson(this, BuffLingsha));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, DebuffDefRate));
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffBreakRate, [Buff.simpleListener()], '', {
        breakRate: 40, name: '击破', source: '星魂',  maxValue: 1,
      }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, DebuffRabbit));
    }
    return list;
  }
  updateReport(enemy){
    const options = {
      na: this.checkES('兰烟')? 30: 20,
    }
    const report = {
      reportList: [
        ...this.getLiveReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, options),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const buff = this.findBuff({key:buffRabbitKey});
    return `浮元${buff? buff.value: 0}`;
  }
  getStateExData() {
    const buff = this.findBuff({key:buffRabbitKey});
    return buff? buff.value: 0;
  }
  castNA(target) {
    const en = this.checkES('兰烟')? 30: 20;
    this.actionAttack(cb=>cb(), 'NA', target, 'single', en, this.rawFunc(1, 'na', 'rate'), this.base.naHits);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      cb()
      this.healAll('ns')
      const buff = this.findBuff({key: buffRabbitKey});
      this.addBuff(buffRabbitKey, this, 3, { count:1 })
      if(!buff) this.rabbit.enter()
      if(this.rabbit.checkAlive()) this.rabbit.changeWaitTime(-20, true)
    }, 'NS', target, 'all', 30, this.rawFunc(1, 'ns'), baseData.nsHits)
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.team.getAliveUnits('enemies').forEach(enemy => {
        this.addBuff(Buff.getKey(this.name, '终结技', '醇醉'), enemy, 1, { count:2 })
      })
      cb()
      this.healAll('us');
      if(this.rabbit.checkAlive()) this.rabbit.changeWaitTime(-100, true)
    }, 'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits)
  }
  castSP() {
    this.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(buffRabbitKey, this, 3, { count:1 })
    this.rabbit.enter()
    this.team.getAliveUnits('enemies').forEach(enemy => {
      this.addBuff(Buff.getKey(this.name, '终结技', '醇醉'), enemy, 1, { count:2 })
    })
  }
  castAction(data) {
    if(data.type==='LingshaAA') {
      this.team.logger.startAction(this.rabbit, {text:'追击', key: 'na', target: 'enemies'});
      this.rabbitAttack(true)
    } else {
      super.castAction(data)
    }
  }
  onEvent(e, unit, data) {
    if(unit===this && e==='BTL_S' && this.state.spActivated) {
      this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  healAll(key) {
    this.triggerHeal( this.team.getAliveUnits('members'), this.getBaseHeal(key, 'heal', 'atk'));
  }
  rabbitAttack(isBonus) {
    const ps = this.skillData.ps;
    const count = this.checkSoul(6)? 6: 2;
    const getHitInfo = (i, targets) => {
      const list = targets.filter(t=>t.checkAlive())
      if(i===0) return list.map(t => ({t, r: 1}))
      const tar = this.randomTarget(list)
      if(!tar) return []
      return [{t: tar, r: 1}]
    }
    A.actionBase({type:'AA', member:this, target: 'enemies' }, ()=>{
      A.triggerAttack({
        member: this, target:'enemies', atkType:'all', count,
        attrType:'Fire', en: 0, options:{ getHitInfo },
        rawDmg:(i)=>{ return {
          brkDmg: i<=1? 0.5 : 1/6,
          raw: this.getAttr('atk')*0.01*(i<=1? ps.rate : 50),
        }}
      })
      this.healAll('ps')
      const members = this.team.getAliveUnits('members')
      members.forEach(m => m.removeABuff('debuff'))

      if(this.checkSoul(4)) {
        let member = this
        for(let cur of members) {
          if(cur.state.hp < member.state.hp) member = cur
        }
        this.triggerHeal([member], this.getAttr('atk') * 0.4);
      }
    });
    if(isBonus) {
      this.rabbit.actCD = 2
    } else {
      if(this.rabbit.actCD) this.rabbit.actCD -= 1
      const buff = this.findBuff({key:buffRabbitKey})
      buff.value -= 1
      if(buff.value===0) this.removeBuff(buff)
      this.team.updateActionUnit(this.rabbit)
    }
  }
  randomTarget(list) {
    const newList = list.filter(e => !e.findBuff({tag:'破韧'}) && e.findBuff({tag:'weakFire'}))
    if(newList.length>0) return D.sample(newList)
    return D.sample(list)
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    list.push({
      type:'heal', name:'战技[回复]', labels:['全体回复'],
      heal0: C.calHealData(this.getBaseHeal('ns','heal','atk'), this, this),
    }, {
      type:'heal', name:'终结技[回复]', labels:['全体回复'],
      heal0: C.calHealData(this.getBaseHeal('us','heal','atk'), this, this),
    });
    const psReport = {
      type:'heal', name:'天赋[回复]', labels:['全体回复'],
      heal0: C.calHealData(this.getBaseHeal('ps','heal','atk'), this, this),
    }
    if(this.checkSoul(4)) {
      psReport.labels.push('额外回复')
      psReport.heal1 = C.calHealData(this.getAttr('atk')*0.4, this, this);
    }
    list.push(psReport)
    return list;
  }
  getDamageReport(enemy){
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg}, C.calDmg(base * ns.rate, ['Fire', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2}, C.calDmg(base * us.rate, ['Fire', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'浮元[全体]', brkDmg: brkDmg/2}, C.calDmg(base * ps.rate, ['Fire', 'AA'], this, enemy, null)),
      Object.assign({ type: 'damage', name:'浮元[额外]', brkDmg: brkDmg/2}, C.calDmg(base * ps.rate, ['Fire', 'AA'], this, enemy, null))
    ];
    if(this.checkSoul(6)) {
      list.push(Object.assign({ type: 'damage', name:'浮元[6魂追加]', tip:'单次', brkDmg: brkDmg/6}, C.calDmg(base * 50, ['Fire', 'AA'], this, enemy, null)))
    }
    list.push(R.getBreakReport(this, enemy))
    return list
  }
}

module.exports = {
  data: baseData,
  character: SsrLingsha,
};