'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');

const baseData = {
  name: '三月七·仙舟',
  image: 'march7th_sword.jpg',
  rarity: 'SR',
  job: '巡猎',
  type: 'Void',
  damages: ['NA','AA'],
  hp: D.levelData['144_1058'],
  atk: D.levelData['76_564'],
  def: D.levelData['60_441'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 110,
  na: D.makeTable([['rate','ratePlus'],[50,40],[60,48],[70,56],[80,64],[90,72],[100,80],[110,88],[120,96],[130,104]]),
  naHits: [0.4,0.6],
  naSoul: 3,
  ns: D.makeTable([['speedRate','rate'],[6,10],[6.4,11],[6.8,12],[7.2,13],[7.6,14],[8,15],[8.5,16.25],[9,17.5],[9.5,18.75],[10,20],[10.4,21],[10.8,22],[11.2,23],[11.6,24],[12,25]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['bonusAll'], [40],[44],[48],[52],[56],[60],[65],[70],[75],[80],[84],[88],[92],[96],[100]]),
  psSoul: 5,
  us: D.makeTable([['rate'],[144],[153.6],[163.2],[172.8],[182.4],[192],[204],[216],[228],[240],[249.6],[259.2],[268.8],[278.4],[288]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '惊鸿', '玲珑', '斡波' ],
  attributes: [
    { atkRate: 4 }, { atkRate: 4 }, { atkRate: 6 }, { atkRate: 6 }, { atkRate: 8 },
    { defRate: 5.0 }, { defRate: 7.5 }, { criDamage: 5.3 }, { criDamage: 8.0 }, { criDamage: 10.7 },
  ],
  defaultJson: {
    weapon:'芳华待灼', name4: '野穗伴行的快枪手', name2: '繁星竞技场',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusVoid',
    hp: [1, 0, 0]
  },
  ai: {
    na: ai.na_default,
    ns: ai.ns_buff_noT('三月七·仙舟$战技$师父.'),
    us: ai.us_always,
  },
};
const buffSfKey = Buff.getKey(baseData.name, '战技', '师父');
const buffPsKey = Buff.getKey(baseData.name, '天赋', '我悟了');
const buffUsKey = Buff.getKey(baseData.name, '终结技', '盖世女侠');
class BuffShifu extends Buff {
  static info() {
    return {
      name: '师父',
      short: '师父',
      source: '战技',
      desc: '速度提高',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff','加速'],
    };
  }
  init() {
    const m = this.member;
    const t = this.target;
    const sfType = ['智识','毁灭','巡猎'].includes(t.base.job)? 'atk':'brk';
    m.state.sfType = sfType;
    this.listen({e:'C_DMG_E', t:'member', f:(buff, unit, data)=>{
      if(D.checkType(data.type, ['NA','NS','AA'])) m.addPsCount(1);
      if(m.checkSoul(2) && !m.state.addAttacked && D.checkType(data.type, ['NA','NS'])) {
        const tar = (data.atkType==='all' || !data.targets[0].checkAlive())? D.sample(m.team.getAliveUnits('enemies')): data.targets[0];
        m.castAdditionAttack(tar, 'single', 10, m.rawFuncRate((sfType==='brk'? 2: 1), 60), [1], null, {
          March7thAA: true,
          sfType,
          forceBreak: m.checkForceBreak(tar, this)? 1: 0,
        },cb=>{
          cb();
          m.addPsCount(1);
        })
        m.state.addAttacked = true;
      }
    }});
    this.listen({e:'ACT_E', t:'member', f:(buff, unit, data)=>{
      if(D.checkType(data.type, ['US'])) m.addPsCount(1);
    }});
  }
  getDesc() {
    const m = this.member;
    const soul1Text = `${m.checkSoul(1)?'速度提高10%，':''}`;
    const typeText = `三月七${soul1Text}普攻${m.state.sfType==='atk'? '可造成附加伤害':'削韧值提高'}。`;
    return `速度提高${D.toPercent(this.member.skillData.ns.speedRate)}。${typeText}`;
  }
  getAttributes() {
    return {
      speedRate: this.member.skillData.ns.speedRate,
    }
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}
class BuffMarch7th extends Buff {
  static info() {
    return {
      name: '三月七·仙舟',
      short: '三月七',
      source: '天赋',
      desc: '三月七被动效果',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'SP_CAST', t:'members', f:(buff, unit, data)=>{
      if(unit!==m) m.state.psCount = Math.min(3, (m.state.psCount || 0) + 1);
    }});
  }
  getAttributes() {
    const m = this.member;
    if(!m.checkSoul(1) || !m.getShifuBuff()) return null;
    return { speedRate: 10 }
  }
}
class BuffUS extends Buff {
  static info() {
    return {
      name: '盖世女侠',
      short: '女侠',
      source: '终结技',
      desc: '三月七下一次强化普攻得到强化。',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  init() {
    if(this.member.checkSoul(6)) this.listen({e:'C_DMG_S', t:'self', f:(buff, unit, data)=>{
      if(data.options && data.options.naPlus) {
        this.state.criDamage = 50;
        this.markTargets();
      }
    }});
    this.listen({e:'C_DMG_E', t:'self', f:(buff, unit, data)=>{
      if(data.options && data.options.naPlus) this.state.count = 0;
    }});
  }
  getDesc() {
    return `三月七下一次强化普攻初始段数增加2段，造成额外伤害的固定概率提高20%${this.member.checkSoul(6)? '，且暴伤提高50%':''}。`
  }
  getAttributes() {
    return {
      criDamage: this.state.criDamage || 0,
    }
  }
}
class BuffNaPlus extends Buff {
  static info() {
    return {
      name: '我悟了',
      short: '悟道',
      source: '天赋',
      desc: '三月七的普攻得到强化。',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.listen({e:'C_DMG_E', t:'self', f:(buff, unit, data)=>{
      if(data.options && data.options.naPlus) {
        this.state.count = 0;
        this.member.state.psCount -= 7;
      }
    }});
  }
  getDesc() {
    return `普攻得到强化且无法施放战技，伤害提高100%。`;
  }
  getAttributes() {
    return {
      bonusAll: this.member.skillData.ps.bonusAll,
    }
  }
}
class BuffShifuEx extends Buff {
  static info() {
    return {
      name: '斡波',
      short: '斡波',
      source: '天赋',
      desc: '“师父”的暴伤及击破特攻提高',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff','暴伤', '击破'],
    };
  }
  getDesc(target) {
    if(!target.findBuff({key: buffSfKey })) return '无效果，该状态仅对“师父”生效。';
    return `暴伤提高60%，击破特攻提高36%。`;
  }
  getAttributes(target) {
    if(!target.findBuff({key: buffSfKey })) return null;
    return {
      criDamage: 60,
      breakRate: 36,
    }
  }
}

class SrMarch7thSword extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffShifu),
      Buff.getListJson(this, BuffMarch7th),
      Buff.getListJson(this, BuffUS),
      Buff.getListJson(this, BuffNaPlus),
    ];
    if(this.checkES('斡波')){
      list.push(Buff.getListJson(this, BuffShifuEx, [Buff.simpleListener()]));
    }
    return list;
  }
  updateReport(enemy){
    const others = [['强化普攻', 30]];
    if(this.checkSoul(4)) others.push(['每回合', 5]);
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
  getStateExText() {
    return `${this.state.psCount || 0}/7${this.checkSoul(2)? (this.state.addAttacked? ' 已追击':' 可追击'):''}`;
  }
  castNA(target) {
    const buffPs = this.findBuff({key: buffPsKey});
    const buffSF = this.getShifuBuff();
    const sfType = buffSF? this.state.sfType: null;
    const forceBreak = this.checkForceBreak(target, buffSF)? 1: 0;
    const brkRate = sfType==='brk'? 2: 1;
    if(!buffPs) {
      this.actionAttack(cb => cb(), 'NA', target, 'single', 20, this.rawFunc(brkRate, 'na'), this.base.naHits, null, { forceBreak, sfType });
      this.addPsCount(1);
      this.changeSp(1);
    } else {
      const buffUs = this.findBuff({key: buffUsKey });
      const hits = (buffUs? 5: 3) + this.getBonusHits( buffUs? 0.8: 0.6);
      const naHits = (new Array(hits)).fill(1);
      this.actionAttack(cb => {
        cb();
        if(this.checkES('斡波')) this.addBuff(Buff.getKey(this.name, '天赋', '斡波'), buffSF? buffSF.target: null , 1, {count: 2});
      }, 'NA', target, 'single', 30/hits, this.rawFunc(brkRate/2, 'na', 'ratePlus'), naHits, null, {forceBreak, sfType, naPlus: true});
    }
  }
  getBonusHits(percent) {
    let i = 0;
    while(i<3 && Math.random()<percent) i++;
    return i;
  }
  checkDisableNS() {
    return super.checkDisableNS() || (this.findBuff({key: buffPsKey})? true: false);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffSfKey, target, 1);
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    const buffSF = this.getShifuBuff();
    const forceBreak = this.checkForceBreak(target, buffSF)? 1: 0;
    this.actionAttack(cb => {
      cb();
      this.addBuff(buffUsKey, this, 1, { count: 1 });
    }, 'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits, null, {forceBreak});
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addEn(30);
  }
  getShifuBuff() {
    return this.findBuff({key: buffSfKey}, null, false);
  }
  checkForceBreak(target, buffSF) {
    if(!target || !buffSF || !this.checkES('玲珑')) return false;
    return target.findBuff({tag:'weak'+ buffSF.target.base.type})? true: false;
  }
  addPsCount(add) {
    this.state.psCount = Math.min(10, (this.state.psCount || 0) + add);
    if(this.state.psCount>=7) {
      this.changeWaitTime(-100, true);
      this.addBuff(buffPsKey, this, 1, { count: 1 });
    }
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated)this.onSP();
      if(this.checkES('惊鸿')) this.changeWaitTime(-25);
      const buff = this.findBuff({key: buffPsKey});
      if(buff)this.removeBuff(buff, false);
    } else if(e==='TURN_S') {
      if(this.checkSoul(4)) this.addEn(5);
    } else if(e==='TURN_E') {
      this.state.addAttacked = false;
    } else if(e==='C_HIT_E') {
      if(data.options && data.options.sfType==='atk') {
        const buff = this.getShifuBuff();
        A.newAddDmg(this, this, [data.target], this.getAttr('atk')*this.skillData.ns.rate*0.01, false, buff.target.base.type);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const sfBuff = this.getShifuBuff();
    const sfType = sfBuff? (['智识','毁灭','巡猎'].includes(sfBuff.target.base.job)? 'atk':'brk'): null;
    const hasBonus = this.findBuff({key: buffPsKey});
    const usBuff = this.findBuff({key: buffUsKey })
    const criDmg = (this.checkSoul(6) && usBuff)? 50: 0;
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const brkRate = sfType==='brk'? 2: 1;
    const count = usBuff? 5: 3;

    const naPList = [];
    const hitRates = [[20, 16, 12.8, 51.2],[40, 24, 14.4, 21.6]]
    for(let i=0; i<4; i++) {
      const hits = count + i;
      naPList.push(Object.assign({
        type: 'damage', name:'强化普攻' + i, brkDmg:brkDmg* 0.5 * hits * brkRate, tip:'共'+hits+'段', hitRate: hitRates[usBuff? 0: 1][i],
      }, C.calDmg(base * na.ratePlus * hits, ['Void', 'NA'], this, enemy, null, { criDmg, bonus: hasBonus? 0: ps.bonusAll })))
    }
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg:brkDmg * brkRate}, C.calDmg(base * na.rate, ['Void', 'NA'], this, enemy, null, { bonus: hasBonus? -ps.bonusAll: 0 })),
      ...naPList,
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, ['Void', 'US'], this, enemy)),
    ];
    if(sfType==='atk') {
      list.push(Object.assign({ type: 'damage', name:'附加伤害'}, C.calDmg(base * ns.rate, [sfBuff.target.base.type, 'AD'], this, enemy)))
    }
    if(this.checkSoul(2)) {
      list.push(Object.assign({ type: 'damage', name:'追加攻击', brkDmg:brkDmg*brkRate}, C.calDmg(base * 60, ['Void', 'AA'], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrMarch7thSword,
};