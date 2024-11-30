'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '貊泽',
  image: 'moze.jpg',
  rarity: 'SR',
  job: '巡猎',
  type: 'Thunder',
  hp: D.levelData['110_811'],
  atk: D.levelData['81_599'],
  def: D.levelData['48_352'],
  speed: 111,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[75],[82.5],[90],[97.5],[105],[112.5],[121.88],[131.25],[140.63],[150],[157.5],[165],[172.5],[180],[187.5]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 5,
  ps: D.makeTable([['rateAD', 'rateAA'],[15,80],[16.5,88],[18,96],[19.5,104],[21,112],[22.5,120],[24.38,130],[26.25,140],[28.13,150],[30,160],[31.5,168],[33,176],[34.5,184],[36,192],[37.5,200]]),
  psHits: [1],
  psSoul: 3,
  us: D.makeTable([['rate'],[162],[172.8],[183.6],[194.4],[205.2],[216],[229.5],[243],[256.5],[270],[280.8],[291.6],[302.4],[313.2],[324]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: ['墨毫绣衣','手奋匕尺','不折镆干'],
  attributes: [
    {criDamage: 5.3}, {criDamage: 5.3}, {criDamage: 8.0}, {criDamage: 8.0}, {criDamage: 10.7},
    {hpRate: 4.0}, {hpRate: 6.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 8.0},
  ],
  defaultJson: {
    weapon:'黑夜如影随行', name4: '毁烬焚骨的大公', name2: '奔狼的都蓝王朝',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusThunder',
  },
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusThunder',
    },
    set2: '奔狼的都蓝王朝'
  },
};

const buffNsKey = Buff.getKey(baseData.name, '战技', '猎物');

class DebuffMark extends Buff {
  static info() {
    return {
      name: '猎物',
      short: '猎物',
      source: '战技',
      desc: '成为貊泽的猎物直至倒下',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['猎物'],
    }
  }
  getDesc() {
    const info1 = this.member.checkES('不折镆干')?'受到的追击伤害提高25%。':'';
    const info2 = this.member.checkSoul(2)?'受到的暴击伤害提高40%。':'';
    return `成为貊泽的猎物直至倒下。${info1}${info2}`;
  }
  init() {
    const m = this.member;
    m.hide();
    this.listen({e:'B_KILL', t:'members', f:(buff, unit, data) => {
      const lived = m.team.getAliveUnits('members').reduce((count, member)=>{
        return (member===m && member===unit)? count: count + 1;
      }, 0);
      if(lived<=0) m.comeBack();
    }});
    this.listen({e:'B_KILL', t:'enemy', f:(buff, unit, data) => {
      m.comeBack();
    }});
    this.listen({e:'B_DMG_E', t:'enemy', f:(buff, unit, data)=>{
      if(data.member.faction!=='members' || !D.checkType(data.type,['NA','NS','US','AA'])) return;
      m.castPs(data.member, unit);
    }});
  }
  getAttributes() {
    return this.member.checkES('不折镆干')? {weakAA:25}: {};
  }
}

class BuffMark extends Buff {
  static info() {
    return {
      name: '暴伤',
      short: '暴伤',
      source: '天赋',
      desc: '对【猎物】暴伤提高40%',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    }
  }
  getAttributesT(target) {
    if(!this.member.checkSoul(2)) return {};

    const buff = target.findBuff({tag: '猎物'});
    return buff? { criDamage: 40 }: {};
  }
  getReportData(target) {
    const enemy = target.getEnemy();
    const m = this.member;
    if(m === target) return [];
    return [Object.assign({ type: 'damage', name:'[貊泽]追伤'}, C.calDmg(m.getAttr('atk') * m.skillData.ps.rateAD * 0.01, ['Thunder', 'AD'], m, enemy))]
  }
}

class SrMoze extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffMark),
      Buff.getListJson(this, BuffMark),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: 30, name: '增伤', source:'秘技', maxValue:1, target:'self',
      }),
    ];
    if(this.checkSoul(4))list.push(Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
      bonusAll: 30, name: '逐薮', source:'星魂', maxValue:1, target:'self',
    }));
    return list;
  }
  getStateExText() {
    const { hide, count } = this.getStateExData();
    return `${hide?'离场':'驻场'}:${count}`;
  }
  getStateExData() {
    const isHide = this.findBuff({key:buffNsKey}, null, false)? true: false;
    return {
      hide: isHide,
      count: this.state.psCount || 0,
    }
  }
  updateReport(enemy){
    const others = this.checkSoul(1)? [['附伤回能', 2]]: [];
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
  checkDisableNS() {
    const lived = this.team.getAliveUnits('members').reduce((count, member)=>{
      return member===this? count: count + 1;
    }, 0);
    return !this.canAction() || this.team.state.sp <= 0 || lived<=0;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      this.addBuff(buffNsKey, target, 1, { count: 1 });
      cb();
    }, 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    const types = this.checkES('不折镆干')? ['US','AA']: ['US'];
    this.actionAttack(cb=>{
      if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name,'星魂','逐薮'), target, 1, { count: 4 });
      cb();
      const tar = target.checkAlive()? target: D.sample(this.team.getAliveUnits('enemies'));
      this.castMozeAA(tar);
    }, types, target, 'single', 5, this.rawFunc(2, 'us'), baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '增伤'), this, 1, { count: 2 });
  }
  checkHide() {
    return this.state.hide || false;
  }
  hide() {
    this.state.psCount = (this.state.psCount || 0) + 9;
    this.state.hide = true;
    this.team.updateActionUnit(this);
  }
  castPs(member, target) {
    if(member!==this) this.state.psCount --;
    const base = this.getAttr('atk')*0.01;
    A.newAddDmg(this, member, [target], base*this.skillData.ps.rateAD, false, 'Thunder');
    if(this.checkSoul(1))this.addEn(2);
    if(member!==this && target.checkAlive() && this.state.psCount%3===0) {
      this.castMozeAA(target);
    }
    if(this.state.psCount===0) this.comeBack();
  }
  comeBack(){
    const buff = this.findBuff({key: buffNsKey}, null, false);
    if(!buff) return;
    this.removeBuff(buff, true);

    this.state.hide = false;
    this.state.wait = this.calActionTime();
    if(this.checkES('手奋匕尺')) this.changeWaitTime(-20);
    this.team.updateActionUnit(this);
  }
  castMozeAA(target) {
    this.castAdditionAttack(target, 'single', 10, this.rawFuncRate(1, this.skillData.ps.rateAA+(this.checkSoul(6)? 25: 0)), baseData.psHits, null, null, cb=>{
      cb();
      if(this.checkES('墨毫绣衣') && this.updateCD(1, 'spCD', false, true)) {
        this.changeSp(1);
      }
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e === 'WAVE_S') {
      this.changeWaitTime(-30);
    } else if(e === 'BTL_S') {
      if(this.state.spActivated) this.onSP();
      if(this.checkSoul(1)) this.addEn(20);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const usTypes = this.checkES('不折镆干')?['Thunder', 'US','AA']:['Thunder', 'US'];
    const rateBonus = this.checkSoul(6)? 25: 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Thunder', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(base * ns.rate, ['Thunder', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, usTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'追伤'}, C.calDmg(base * ps.rateAD, ['Thunder', 'AD'], this, enemy)),
      Object.assign({ type: 'damage', name:'追击', brkDmg}, C.calDmg(base * (ps.rateAA + rateBonus ), ['Thunder', 'AA'], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrMoze,
};