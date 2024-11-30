'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');

const baseData = {
  name: '花火',
  image: 'sparkle.jpg',
  rarity: 'SSR',
  job: '同谐',
  type: 'Quantum',
  damages: ['NA','NS'],
  hp: D.levelData['190_1397'],
  atk: D.levelData['71_523'],
  def: D.levelData['66_485'],
  speed: 101,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['criDmgT','criDamage'],[12,27],[13.2,28.8],[14.4,30.6],[15.6,32.4],[16.8,34.2],[18,36],[19.5,38.25],[21,40.5],[22.5,42.75],[24,45],[25.2,46.8],[26.4,48.6],[27.6,50.4],[28.8,52.2],[30,54]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['bonusAll'],[3],[3.3],[3.6],[3.9],[4.2],[4.5],[4.88],[5.25],[5.63],[6],[6.3],[6.6],[6.9],[7.2],[7.5]]),
  psSoul: 5,
  us: D.makeTable([['bonusAll'],[6],[6.4],[6.8],[7.2],[7.6],[8],[8.5],[9],[9.5],[10],[10.4],[10.8],[11.2],[11.6],[12]]),
  usTarget: 'members',
  usSoul: 5,
  es: [ '岁时记', '人造花', '夜想曲' ],
  attributes: [
    {hpRate: 4.0}, {hpRate: 4.0}, {hpRate: 6.0}, {hpRate: 6.0}, {hpRate: 8.0},
    {dodge: 4.0 }, {dodge: 6.0 }, {criDamage: 5.3 }, {criDamage: 8.0 }, {criDamage: 10.7 },
  ],
  defaultJson: {
    weapon:'游戏尘寰', name4: '骇域漫游的信使', name2: '梦想之地匹诺康尼',
    body: 'criDamage', foot: 'speed', link:'enRate', ball:'hpRate',
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_sp_gt(1),
    us: ai.us_buff_noT("花火$终结技$谜诡."),
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      speed:[10, 0, 99999],
      criDamage:[5, 0, 99999],
    },
    main: {
      body: 'criDamage',
      foot: 'speed',
      link: 'enRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
    set2: '生命的翁瓦克',
  },
};
const buffNSKey = Buff.getKey(baseData.name, '战技', '梦游鱼');
const buffUSKey = Buff.getKey(baseData.name, '终结技', '谜诡');
class BuffNS extends Buff {
  static info() {
    return {
      name: '梦游鱼',
      short: '暴伤',
      source: '战技',
      desc: '暴伤提高',
      show: true,
      maxValue: 1,
      target:'member',
      tags: ['buff','暴伤'],
    }
  }
  init() {
    const m = this.member;
    this.state.endNextTurn = 0;
    this.listen({e:'TURN_E', t:'member', f:(buff)=>{
      if(m.checkES('人造花')) {
        buff.state.endNextTurn = 1;
      } else {
        buff.state.count--;
      }
    }})
    this.listen({e:'TURN_S', t:'member', f:(buff)=>{
      if(buff.state.endNextTurn) buff.state.count--;
    }})
  }
  getDesc(target) {
    return `暴伤提高${D.toPercent(this.member.getNsCriDamage(false))}。`;
  }
  getAttributes(target) {
    return target===this.member? null : { criDamage: this.member.getNsCriDamage(false) };
  }
  getTransAttr(target) {
    return target===this.member? { criDamage: this.member.getNsCriDamage(true) }: null;
  }
}
class BuffUS extends Buff {
  static info(data, member) {
    const tags = ['buff', '增伤'];
    let desc = '花火被动增伤效果额外提高';
    if(member.checkSoul(1)){
      tags.push('加攻');
      desc += '。攻击提高'
    }
    return {
      name: '谜诡',
      short: '谜诡',
      source: '终结技',
      desc,
      show: true,
      maxValue: 1,
      target:'member',
      tags,
    }
  }
  getDesc() {
    const m = this.member;
    let desc = `花火每层天赋效果额外增伤${D.toPercent(m.skillData.us.bonusAll)}。`;
    if(m.checkSoul(1)){ desc += `攻击提高40%。` }
    return desc;
  }
  getAttributes() {
    return this.member.checkSoul(1)? {atkRate: 40} : {}
  }
}
class BuffPS extends Buff {
  static info(data, member) {
    const tags = ['buff', '增伤'];
    let desc = '伤害增加';
    if(member.checkSoul(2)){
      tags.push('破防');
      desc += '，防御穿透'
    }
    return {
      name: '叙述性诡计',
      short: '增伤',
      source: '天赋',
      desc,
      show: true,
      maxValue: 3,
      target:'member',
      tags,
    }
  }
  getDesc(target) {
    const data = this.getData(target)
    let desc = `伤害提高${D.toPercent(data.bonusAll)}。`;
    if(this.member.checkSoul(2)){ desc += `防御穿透${D.toPercent(data.defThrough)}。` }
    return desc;
  }
  getAttributesT(target) { return this.getData(target) }
  getData(target) {
    const m = this.member;
    const usBuff = target.findBuff({key:buffUSKey});
    return {
      bonusAll: (m.skillData.ps.bonusAll + (usBuff ? m.skillData.us.bonusAll : 0)) * this.value,
      defThrough: m.checkSoul(2) ? 8 * this.value : 0,
    }
  }
}
class BuffSparkle extends Buff {
  static info(data, member) {
    const tags = member.checkES('夜想曲')?['buff','加攻']:[];
    return {
      name: '花火',
      short: '花火',
      source: '天赋',
      desc: '花火被动效果',
      show: false,
      maxValue: 0,
      target:'members',
      tags,
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'SP_CHANGE', t:'members', f:(buff, unit, data)=>{
      if(data.sp > -1) return;
      //console.log(data);
      const val = -data.sp;
      m.team.getAliveUnits('members').forEach(t => m.addBuff(Buff.getKey(m.name, '天赋', '叙述性诡计'), t, val, {count:2}));
    }})
  }
  getAttributes(target) {
    const m = this.member;
    return m.checkES('夜想曲')? {
      atkRate:  15 + (target.base.type==='Quantum'?m.getBonusQuantum(): 0),
    } : {};
  }
}
class SsrSparkle extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    return [
      Buff.getListJson(this, BuffNS),
      Buff.getListJson(this, BuffUS, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffPS, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffSparkle),
    ];
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, {na: this.checkES('岁时记')? 30: 20}),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    this.actionAttack(cb=>cb(), 'NA', target, 'single', this.checkES('岁时记')? 30: 20, this.rawFunc(1, 'na'), this.base.naHits);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffNSKey, target, 1, {count: 1, endNextTurn: 0 });
      if(this.checkSoul(6)) {
        this.team.getAliveUnits('members').forEach(m => {
          if(m===this || m===target) return;
          if(m.findBuff({ key: buffUSKey })) this.addBuff(buffNSKey, m, 1, {count: 1, endNextTurn: 0});
        });
      }
      if(target !== this)target.changeWaitTime(-50);
      this.addEn(30);
    });
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      const count = this.checkSoul(1)? 3: 2;
      const members = this.team.getAliveUnits('members');
      let nsBuff = null;
      members.forEach(m => {
        this.addBuff(buffUSKey, m, 1, {count});
        if(this.checkSoul(6)) {
          const buff = m.findBuff({key: buffNSKey});
          if(buff && (!nsBuff || nsBuff.state.endNextTurn === 1)) nsBuff = buff;
        }
      });
      if(nsBuff) {
        members.forEach(m => {
          if(m === this) return;
          const bs = nsBuff.state;
          this.addBuff(buffNSKey, m, 1, {count: bs.count, endNextTurn: bs.endNextTurn})
        });
      }
      this.changeSp(this.checkSoul(4)? 5: 4);
      this.addEn(5);
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.changeSp(3);
  }
  getNsCriDamage(rateOnly) {
    const ns = this.skillData.ns;
    const rate = (ns.criDmgT + (this.checkSoul(6)? 30: 0)) * 0.01;
    if(rateOnly) {
      return { raw: 'criDamage', rate, add: ns.criDamage};
    }
    return  rate * this.attr.data.criDamage + ns.criDamage;
  }
  getBonusQuantum() {
    const count = this.team.members.reduce((sum, m)=> sum + (m && m.base.type==='Quantum'? 1: 0), 0);
    return count>=3? 30:(count===2? 15: 5);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      this.team.state.spMax += this.checkSoul(4)? 3: 2;
      if(this.state.spActivated) this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(this.getAttr('atk') * this.skillData.na.rate * 0.01, ['Ice', 'NA'], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
}

module.exports = {
  data: baseData,
  character: SsrSparkle,
};