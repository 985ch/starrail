'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffImmune } = require('../buff_simple');

const baseData = {
  name: '阿兰',
  image: 'arlan.jpg',
  rarity: 'SR',
  job: '毁灭',
  type: 'Thunder',
  hp: D.levelData['163_1199'],
  atk: D.levelData['81_599'],
  def: D.levelData['45_330'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3, 0.7],
  naSoul: 3,
  ns: D.makeTable([['rate'],[120],[132],[144],[156],[168],[180],[195],[210],[225],[240],[252],[264]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 3,
  ps: D.makeTable([['bonusRate'],[36],[39],[43],[46],[50],[54],[58],[63],[67],[72],[75],[29]]),
  psSoul: 5,
  us: D.makeTable([['rateC','rateD'],[192,96],[204,102], [217,108],[230,115],[243,121],[256,128],[272,136],[288,144],[304,152],[320,160],[332,166],[345,172]]),
  usTarget: 'enemy',
  usHits: [0.3, 0.1, 0.6], 
  usSoul: 5,
  es: ['苏生','坚忍','抗御'],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { dodge: 4.0 }, { dodge: 6.0 }, { dodge: 8.0 },
  ],
  defaultJson: {
    weapon:'秘密誓心', name4: '激奏雷电的乐队', name2: '繁星竞技场',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusThunder',
  },
};

class BuffArlan extends Buff {
  static info() {
    return {
      name: '阿兰天赋',
      short: '特殊',
      source: '天赋',
      desc: '阿兰',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const m = this.member;
    const hp = m.getAttr('hp');
    const hpRate = m.state.hp/hp;
    const bonusAll = (1 - hpRate)* m.skillData.ps.bonusRate;
    return {
      bonusAll,
      dodgeDot: m.checkES('坚忍')? 50: 0,
      bonusNS: m.checkSoul(1) && hpRate<=0.5? 10: 0,
      bonusUS: m.checkSoul(6) && hpRate<=0.5? 20: 0,
    }
  }
}
class BuffReborn extends Buff {
  static info() {
    return {
      name: '绝处反击',
      short: '重生',
      source: '星魂',
      desc: '受到致命攻击时不会倒下，且回复25%的生命值',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'BEFORE_DEATH', t:'self', f:()=>{
      if(m.state.hp>0)return;
      m.state.hp = 0.01;
      m.triggerHeal([m], m.getAttr('hp')*0.25);
      this.state.count = 0;
    }})
  }
}


class SrArlan extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffArlan),
    ];
    if(this.checkES('抗御')){
      list.push(Buff.getListJson(this, BuffImmune, [Buff.eventListener('C_DMG_E', 'self')], '', {
        name: '抗御', source: '天赋',  maxValue: 1,
      }));
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffReborn, [Buff.simpleListener()]));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...this.getDefendReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    this.costHp(15);
    this.actionAttack(cb=>{
      if(this.checkSoul(2)) this.removeABuff('debuff');
      cb();
    },'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    const hits = baseData.hits;
    const isPlus = this.checkSoul(6) && this.checkHp(50);
    this.actionAttack(cb=>{
      if(this.checkSoul(2)) this.removeABuff('debuff');
      cb();
    },'US', target, 'diff', 5, this.rawDiffFunc(2, 2, 'us', 'rateC', isPlus? 'rateC': 'rateD'), hits, hits);
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this, 2, this.rawFuncRate(0, 80));
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('抗御') && this.checkHp(50))this.addBuff(Buff.getKey(this, '天赋', '抗御'), this, 1);
      if(this.checkSoul(4))this.addBuff(Buff.getKey(this.name, '星魂', '绝处反击'), this, 1, {count:2});
    } else if(e==='C_KILL') {
      if(this.checkES('苏生') && this.checkHp(30)) this.triggerHeal([this], this.getAttr('hp')*0.2);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const isPlus = this.checkSoul(6) && this.checkHp(50);
    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Thunder', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg:brkDmg*2, tip:'消耗生命'+Math.floor(this.getAttr('hp')*0.15)}, C.calDmg(base * ns.rate, [ 'Thunder', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[中心]', brkDmg:brkDmg*2}, C.calDmg(base * us.rateC, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[扩散]', brkDmg:brkDmg*2}, C.calDmg(base * (isPlus? us.rateC: us.rateD), [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'秘技',brkDmg:2}, C.calDmg(base * 80, [ 'Thunder', 'SP' ], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  // 获取承伤比例数据报告
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    const labels = [];
    const values = [];
    if(this.checkES('苏生')) {
      labels.push('被动回血');
      values.push(C.calHealData(this.getAttr('hp')*0.2, this, this));
    }
    if(this.checkSoul(4)) {
      labels.push('重生回复');
      values.push(C.calHealData(this.getAttr('hp')*0.25, this, this));
    }
    if(labels.length>0) {
      list.push({ type:'heal', name:'回复能力', labels, heal0: values[0], heal1: values[1] });
    }
    if(this.checkES('坚忍')) {
      list.push({ type:'dodge', name:'持续伤害抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 50) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrArlan,
};