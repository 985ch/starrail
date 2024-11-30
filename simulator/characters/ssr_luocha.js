'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDamage, DebuffDefendAll } = require('../debuff_simple');
const { BuffShield } = require('../buff_simple');

const baseData = {
  name: '罗刹',
  image: 'luocha.jpg',
  rarity: 'SSR',
  job: '丰饶',
  type: 'Void',
  damages: ['NA','US'],
  hp: D.levelData['174_1280'],
  atk: D.levelData['102_756'],
  def: D.levelData['49_363'],
  speed: 101,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3,0.3,0.4],
  naSoul: 3,
  ns: D.makeTable([['healR','heal'],[40,200],[42,320],[45,410],[47,500],[50,560],[52,620],[54,665],[56,710],[58,755],[60,800],[62,845],[64,890]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['healR','heal'],[12, 60],[12.7, 96],[13.5, 123],[14.2, 150],[15.0, 168],[15.6, 186],[16.2, 199],[16.8, 213],[17.4, 226],[18.0, 240],[18.6, 253],[19.2, 267]]),
  psSoul: 5,
  us: D.makeTable([['rate'],[120],[128],[136],[144],[152],[160],[170],[180],[190],[200],[208],[216]]),
  usHits: [1],
  usTarget: 'enemies',
  usSoul: 5,
  es: [ '浸池苏生', '浇灌尘身', '行过幽谷' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'棺的回响', name4: '云无留迹的过客', name2: '太空封印站',
    body: 'atkRate', foot: 'speed', link:'enRate', ball:'atkRate',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai:{
    na: ai.na_default,
    ns: ai.ns_heal_target,
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
    set4: ['云无留迹的过客', null],
  },
};
const buffFieldKey = Buff.getKey(baseData.name, '天赋', '结界');
class BuffField extends Buff {
  static info() {
    return {
      name: '结界',
      short: '结界',
      source: '天赋',
      desc: '敌人受到攻击时攻击者回复生命',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['field', 'report'],
    }
  }
  init() {
    this.listen({e:'C_DMG_S', t:'members', f:(buff, unit, data)=> {
      this.member.castPS(unit);
    }})
  }
  beforeRemove() {
    const m = this.member;
    const buff = m.findBuff({key:Buff.getKey(m.name, '星魂', '虚弱'), target:['enemies']});
    if(buff) m.removeBuff(buff);
  }
  getAttributes() {
    return this.member.checkSoul(1)? {atkRate:20}: {};
  }
  getReportData(target) {
    const m = this.member;
    const report = {
      type:'heal', name:'攻击回血', labels:['自己攻击'], tip: '来自罗刹的天赋',
      heal0: C.calHealData(m.getBaseHeal('ps','heal','atk'), m, target),
    };
    if(m.checkES('浇灌尘身')) {
      report.labels.push('队友攻击');
      report.heal1 = C.calHealData(m.getAttr('atk')*0.07+93, m, target);
    }
    return [report];
  }
}
class BuffLC extends Buff {
  static info() {
    return {
      name: '罗刹被动',
      short: '监听',
      source: '天赋',
      desc: '监听我方掉血',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    }
  }
  init() {
    this.listen({e:'HP_CHANGE', t:'members', f:(buff, unit, data)=> {
      if(unit.checkHp(50)) this.member.triggerNS(unit, false);
    }})
  }
}

class SsrLuocha extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('行过幽谷')) list.push({ dodgeCtrl:70 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffLC),
      Buff.getListJson(this, BuffField, [Buff.simpleListener(false, 'self')]),
    ];
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: 18, shield: 240, baseAttr: 'atk',
        name: '护盾', source:'星魂', maxValue: 1, target:'member',
      }));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, DebuffDamage, [], '', { bonusAll: 12, name: '虚弱', source: '星魂', maxValue: 1, target: 'enemies' }));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, DebuffDefendAll, [Buff.simpleListener()], '', {
        defendAll: 20, name: '全抗性降低', source:'星魂', target: 'enemy', maxValue: 1,
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
        ...R.getEnergyReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const buff = this.findBuff({key:buffFieldKey, target:'members'});
    return `结界${buff? buff.state.count: 0}被动${this.state.psCount || 0}`;
  }
  getStateExData() {
    return this.state.psCount || 0;
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.triggerNS(target, true);
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.team.getAliveUnits('enemies').forEach(e =>{
        e.removeABuff('buff');
        if(this.checkSoul(6))this.addBuff(Buff.getKey(this.name, '星魂', '全抗性降低'), e, 1, {count:2})
      });
      cb();
    }, 'US', 'enemies', 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
    this.triggerPS();
  }
  castSP() {
    this.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.triggerPS(true);
  }
  castPS(member) {
    this.triggerHeal([member], this.getBaseHeal('ps','heal','atk'));
    if(this.checkES('浇灌尘身')) {
      this.team.getAliveUnits('members').forEach(m => {
        if(m !== member) this.triggerHeal([m], this.getAttr('atk') * 0.07 + 93);
      })
    }
  }
  onEvent(e, unit, data) {
    if(unit===this && e==='BTL_S' && this.state.spActivated) {
      this.onSP();
    }
    super.onEvent(e, unit, data);
  }
  triggerNS(target, castSp) {
    if(!castSp && !this.updateCD(2, 'nsCD')) return;
    if(this.checkES('浸池苏生'))target.removeABuff('debuff');
    let bonus = 0;
    if(this.checkSoul(2)) {
      if(target.checkHp(50)) {
        bonus = 30;
      } else {
        this.addBuff(Buff.getKey(this.name, '星魂', '护盾'), target, 1, {count:2});
      }
    }
    const heal = this.getBaseHeal('ns','heal','atk');    
    A.triggerHeal({ type:'NS', member:this, targets:[target] }, (d)=>{
      return C.calHealData(heal, this, target, bonus);
    });
    this.triggerPS();
  }
  triggerPS(force = false) {
    if(!force) {
      this.state.psCount = (this.state.psCount || 0) + 1;
      if(this.state.psCount<2)return;
      this.state.psCount = 0
    }
    A.actionBase({type:'OTH', member: this }, ()=>{
      this.addBuff(buffFieldKey, this, 1, {count:2});
      if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '星魂', '虚弱'), 'enemies', 1, {});
    });
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    const nsReport = {
      type:'heal', name:'战技[回复]', labels:['正常目标'],
      heal0: C.calHealData(this.getBaseHeal('ns','heal'), this, this),
    };
    const psReport = {
      type:'heal', name:'天赋[回复]', labels:['主目标'],
      heal0: C.calHealData(this.getBaseHeal('ps','heal','atk'), this, this),
    };
    list.push(nsReport, psReport);

    if(this.checkES('浇灌尘身')) {
      psReport.labels.push('其他队友');
      psReport.heal1 = C.calHealData(this.getAttr('atk')*0.07+93, this, this);
    }
    if(this.checkSoul(2)) {
      nsReport.labels.push('低血量目标')
      nsReport.heal1 = C.calHealData(this.getBaseHeal('ns','heal'), this, this, 30);
      list.push({
        type:'shield', name: '战技[护盾]',  tip: '对高血量目标使用战技时',
        shield: C.calShieldData(this.getAttr('atk') * 0.18 + 240, this, this),
      })
    }
    if(this.checkES('行过幽谷')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 70) });
    }
    return list;
  }
  getDamageReport(enemy){
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg },  C.calDmg(this.getBaseDmg('na'), ['Void', 'NA'], this, enemy)),
      Object.assign({ type:'damage', name:'终结技', brkDmg: brkDmg*2 },  C.calDmg(this.getBaseDmg('us'), ['Void', 'US'], this, enemy)),
      R.getBreakReport(this,enemy),
    ];
  }
}

module.exports = {
  data: baseData,
  character: SsrLuocha,
};