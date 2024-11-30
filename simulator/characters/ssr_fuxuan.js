'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBlock } = require('../buff_simple');

const baseData = {
  name: '符玄',
  image: 'fuxuan.jpg',
  rarity: 'SSR',
  job: '存护',
  type: 'Quantum',
  mainAttr: 'hp',
  damages: ['NA','US'],
  hp: D.levelData['200_1474'],
  atk: D.levelData['63_465'],
  def: D.levelData['82_606'],
  speed: 100,
  criRate: 5,
  criDamage: 50,
  hate: 150,
  enMax: 135,
  na: D.makeTable([['rate'],[25],[30],[35],[40],[45],[50],[55]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([
    ['criRate', 'hpRate'],
    [6.0, 3.0],
    [6.6, 3.3],
    [7.2, 3.6],
    [7.8, 3.9],
    [8.4, 4.2],
    [9.0, 4.5],
    [9.7, 4.8],
    [10.5, 5.2],
    [11.2, 5.6],
    [12.0, 6.0],
    [12.6, 6.3],
    [13.2, 6.6],
  ]),
  nsTarget: 'members',
  nsSoul: 3,
  ps: D.makeTable([
    ['dmgRate', 'healRate'],
    [10.0, 80],
    [10.8, 81],
    [11.6, 82],
    [12.4, 83],
    [13.2, 84],
    [14.0, 85],
    [15.0, 86],
    [16.0, 87],
    [17.0, 88],
    [18.0, 90],
    [18.8, 91],
    [19.6, 92],
  ]),
  psSoul: 3,
  us: D.makeTable([['rate'],[60], [64], [68], [72], [76], [80], [85], [90], [95], [100], [104], [108]]),
  usHits: [1],
  usTarget: 'self',
  usSoul: 5,
  es: [ '太乙式盘', '遁甲星舆', '六壬兆堪' ],
  attributes: [
    { criRate: 2.7 }, { criRate: 2.7 }, { criRate: 4.0 }, { criRate: 4.0 }, { criRate: 5.3 },
    { dodge: 4.0 }, { dodge: 6.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'她已闭上双眼', name4: '宝命长存的莳者', name2: '不老者的仙舟',
    body: 'hpRate', foot: 'speed', link:'enRate', ball:'hpRate',
  },
  aiConditions: [{value:'c_fuxuanN',text:'穷观阵'}, {value:'c_fuxuanU', text:'翻转次数'}],
  ai: {
    na:ai.na_default,
    ns:{
      disable:false,
      rules:[[{t:"c_fuxuanN",v:["lt",2]}]]
    },
    us:ai.us_always,
  },
  equipSetting: {
    rule: 'alive',
    main: {
      body: 'hpRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'hpRate',
    },
    set2: '折断的龙骨'
  },
};
const buffQGZKey = Buff.getKey(baseData.name, '战技', '鉴知');
class BuffQGZ extends Buff {
  static info() {
    return {
      name: '鉴知',
      short: '鉴知',
      source: '战技',
      desc: '生命上限提高，暴击提高，暴伤提高',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', 'report', '生命上限', '暴击', '暴伤'],
    }
  }
  init() {
    const self = this.member;
    this.listen({e:'C_DMG_S', t:'enemies', f:(buff, unit, data)=> {
      buff.state.rebornFlag = false;
    }});
    this.listen({e:'B_HIT_E', t:'members', f:(buff, unit, data)=>{
      if(data.idxT===0) {
        buff.state.rawDmg = data.raw;
      } else {
        buff.state.rawDmg += data.raw;
      }
      if(data.idxT !== data.idxMT) return;
      if(unit!==self){
        const damage = C.calDmg(buff.state.rawDmg*0.65, [data.attrType], data.member, self, { simpleMode: true});
        self.state.statistics.atkedC++;
        self.state.damaged += damage;
        self.changeHp(-damage, self, 'alloc', false);
        self.team.logger.logDamage(null, self, damage, damage, 'NORMAL');
        if(self.state.hp<=0 && !this.checkReborn(self)){
          self.triggerEvent('B_KILL', { member: self, target: self });
        }
      }
    }})
    this.listen({e:'BEFORE_DEATH', t:'members', f:(buff, unit, data)=>{
      this.checkReborn(unit);
    }})
    if(self.checkES('六壬兆堪')){
      this.state.actFlag = 1;
      this.listen({e:'ACT_S', t:'enemies', f:(buff, unit, data)=> {
        if(D.checkType(data.type,'NA')) this.state.actFlag++;
      }});
    }
    if(self.checkSoul(4))this.listen({e:'B_ATK_E', t:'members', f:(buff, unit, data)=>{
      if(unit!==self) self.addEn(5);
    }})
    if(self.checkSoul(6)) this.listen({e:'HP_CHANGE', t:'members', f:(buff, unit, data)=>{
      if(data.change<0) self.state.dmgCount = (self.state.dmgCount || 0) - data.change;
    }})
  }
  getDesc() {
    const { hp, criRate, criDamage } = this.getData();
    let desc = `符玄分担65%伤害，生命上限提高${Math.floor(hp)}，暴击提高${criRate.toFixed(1)}%`;
    if(criDamage > 0) desc +='，暴伤提高'+(criDamage.toFixed(1))+'%';
    return desc;
  }
  getAttributes(target) {
    const { hp, criRate, criDamage } = this.getData();
    return { hp, criRate, criDamage, damageRate: (this.member !== target)? 0.35 : 1 }
  }
  getData() {
    const { hpRate, criRate } = this.member.skillData.ns;
    return {
      hp: this.member.getAttr('hp') * hpRate * 0.01,
      criRate,
      criDamage: this.member.checkSoul(1)? 30 : 0,
    }
  }
  getReportData(target) {
    if(this.member === target && this.member.checkSoul(4)) {
      return [{ type:'energy', name:'[符玄]穷观阵[额外回能]', labels:['受击'], en0: 5}];
    }
    return [];
  }
  blockDebuff(member, target, info) {
    if(!this.member.checkES('六壬兆堪') || !info.tags.includes('控制')) return false;
    if(!this.state.blockFlag || this.state.blockFlag === this.state.actFlag) {
      this.state.blockFlag = this.state.actFlag;
      return true;
    }
    return false
  }
  // 判断是否可以重生
  checkReborn(target) {
    const m = this.member;
    if(!m.checkSoul(2) || (m.state.reborn && !this.state.rebornFlag)) return false;
    m.state.reborn = true;
    this.state.rebornFlag = true;
    target.state.hp = 0.01;
    m.triggerHeal([target], target.getAttr('hp')*0.7)
    return true;
  }
}

class SsrFuxuan extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    return [
      Buff.getListJson(this, BuffQGZ, [Buff.simpleListener(true, 'self'), {e:'B_KILL', t:'self', f:buff=>buff.state.count=0}]),
      Buff.getListJson(this, BuffBlock, [], '', {
        damageRate: this.skillData.ps.dmgRate,
        name: '避厄', source: '天赋', desc: '我方全体', target: 'members',
      }),
    ];
  }
  updateReport(enemy){
    const hasBuff = this.findBuff({key:buffQGZKey, target:'members'}) !== null;
    return {
      reportList: [
        ...this.getLiveReport(enemy, hasBuff),
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...this.getEnergyReport(hasBuff),
        ...R.getAdditionReport(this, enemy),
      ]
    }
  }
  castNA(target) { super.castNA(target, 'hp') }
  castNS(target) {
    super.castNS(target);
    const hasBuff = this.findBuff({key:buffQGZKey, target:'members'}) !== null;
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffQGZKey, target, 1, { count:3 });
    });
    const enBonus = (hasBuff && this.checkES('太乙式盘'))? 20: 0;
    this.addEn(30 + enBonus)
  }
  castUS(target){
    super.castUS(target);
    const bonus = this.checkSoul(6)? Math.min(this.getAttr('hp')*1.2, (this.state.dmgCount || 0)) : 0;
    this.actionAttack(cb=>{
      cb();
      if(this.checkES('遁甲星舆')) {
        this.triggerHeal(this.team.members.filter(m=>m && m!==this && m.checkAlive()), this.getAttr('hp')*0.05 + 133);
      }
      this.state.swapCount = Math.min((this.state.swapCount || 0) + 1, 2);
      this.state.dmgCount = 0;
      if(this.checkHp(50)) this.swapHp();
    },'US', 'enemies', 'all', 5, () => {
      return {brkDmg: 2, raw: this.getAttr('hp') * 0.01 * this.skillData.us.rate + bonus}
    }, baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(buffQGZKey, 'members', 1, { count:2 });
  }
  onEvent(e, unit, data) {
    if(e==='BTL_S' && unit===this) {
      if(this.state.spActivated)this.onSP();
      this.state.swapCount = 1;
    } else if(e==='C_DMG_E' && D.checkType(data.type,'US') && unit===this && this.checkSoul(6) && this.state.dmgCount) {
      A.newAddDmg(this, this, data.targets, Math.min(this.getAttr('hp')*1.2, this.state.dmgCount))
      this.state.dmgCount = 0;
    } else if(e==='HP_CHANGE' && unit===this && this.state.hp>0 && this.checkHp(50) && this.state.swapCount>0){
      this.swapHp();
    }
    super.onEvent(e, unit, data);
  }
  swapHp() {
    this.state.swapCount--;
    this.triggerHeal([this], (this.getAttr('hp')-this.state.hp)*this.skillData.ps.healRate*0.01);
  }
  getStateExText() {
    const { ns, us } = this.getStateExData();
    return `阵:${ns} 翻:${us}`;
  }
  getStateExData(key) {
    const buff = this.findBuff({key:buffQGZKey, target:'members'});
    const data = {
      ns: buff? buff.state.count: 0,
      us: this.state.swapCount || 0,
    }
    return key? data[key]: data;
  }
  getLiveReport(enemy, hasBuff){
    const list = R.getDefendReport(this, enemy);
    const hp = this.getAttr('hp');
    const { ps } = this.skillData;
    const damageRate = (1 - ps.dmgRate * 0.01) * ( hasBuff ? 0.35 : 1);
    list.push({
      type:'block', name:'队友减伤', labels:['合计减伤'],
      block0: (1 - damageRate) * 100,
    }, {
      type:'heal', name:'翻转', labels:['最大回复'],  heal0: C.calHealData(hp * ps.healRate*0.01, this, this ),
    });
    if(this.checkES('遁甲星舆')) {
      list.push({ type:'heal', name:'终结技[回复]', labels: ['回复量'], heal0: C.calHealData(hp * 0.05 + 133, this, this) });
    }
    return list;
  }
  // 获取能量报告
  getEnergyReport(hasBuff){
    const nsBonus = (hasBuff && this.checkES('太乙式盘'))? 20: 0;
    const list = R.getEnergyReport(this, {ns:30 + nsBonus});
    if(hasBuff && this.checkSoul(4)) {
      list.push({ type: 'energy', name: '额外回能', labels: ['队友受击'], en0: C.calEnergy(5, this) });
    }
    return list;
  }
  // 获取伤害报告
  getDamageReport(enemy){
    const base = this.getAttr('hp') * 0.01;
    const { na, us } = this.skillData;
    const hasBonus = this.checkSoul(6);
    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg}, C.calDmg(base*na.rate, ['Quantum', 'NA'], this, enemy)),
      Object.assign({ type:'damage', name:'终结技'+(hasBonus?'[空]':''), brkDmg: brkDmg*2}, C.calDmg(base*us.rate, ['Quantum', 'US'], this, enemy)),
    ];
    if(hasBonus) {
      list.push(Object.assign({ type:'damage', name:'终结技[满]', brkDmg: brkDmg*2}, C.calDmg(base*(us.rate+120), ['Quantum', 'US'], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrFuxuan,
};