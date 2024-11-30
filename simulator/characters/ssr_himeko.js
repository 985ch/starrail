'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffSpeedRate } = require('../buff_simple');
const { DebuffWeakType, DebuffDot } = require('../debuff_simple');

const baseData = {
  name: '姬子',
  image: 'himeko.jpg',
  rarity: 'SSR',
  job: '智识',
  type: 'Fire',
  damages: ['AA','US'],
  hp: D.levelData['142_1047'],
  atk: D.levelData['102_756'],
  def: D.levelData['59_436'],
  speed: 96,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.4,0.6],
  naSoul: 3,
  ns: D.makeTable([['rateC','rateD'],[100,40],[110,44],[120,48],[130,52],[140,56],[150,60],[162,65],[175,70],[187,75],[200,80],[210,84],[220,88]]),
  nsHitsC: [0.2, 0.2, 0.05, 0.05, 0.05, 0.05, 0.4 ],
  nsHitsD: [0.2, 0.2, 0, 0, 0, 0, 0.6 ],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[70],[77],[84],[91],[98],[105],[113],[122],[131],[140],[147],[154]]),
  psHits: [0.2, 0.2, 0.2, 0.4],
  psSoul: 5,
  us: D.makeTable([['rate'],[138],[147],[156],[165],[174],[184],[195],[207],[218],[230],[239],[248]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '星火', '灼热', '道标' ],
  attributes: [
    {bonusFire: 3.2}, {bonusFire: 3.2}, {bonusFire: 4.8}, {bonusFire: 4.8}, {bonusFire: 6.4},
    {dodge: 4.0 }, {dodge: 6.0 }, {atkRate: 4.0 }, {atkRate: 6.0 }, {atkRate: 8.0 },
  ],
  defaultJson: {
    weapon:'银河铁道之夜', name4: '熔岩锻铸的火匠', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusFire',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai: {
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'speed',
      link: 'enRate',
      ball: 'bonusFire',
    },
    set2: '停转的萨尔索图'
  },
};
class BuffDamageFire extends Buff {
  static info() {
    return {
      name: '灼热',
      short: '增伤',
      source: '天赋',
      desc: '伤害提高',
      show: false,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(enemy) {
    return enemy.findBuff({ tag:'灼烧' })?  { bonusAll: 20 } : {};
  }
}
class BuffDamageHp extends Buff {
  static info() {
    return {
      name: '道标',
      short: '增伤',
      source: '星魂',
      desc: '伤害增加',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(enemy) {
    return enemy.checkHp(50)?  { bonusAll: 15 } : {};
  }
}
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '按血量加暴击',
      short: '暴击',
      source: '天赋',
      desc: '暴击提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributes() {
    return this.member.checkHp(80, true)?  { criRate: 15 } : {};
  }
}
class BuffBreakListener extends Buff {
  static info() {
    return {
      name: '监听器',
      short: '监听',
      source: '天赋',
      desc: '监听击破事件',
      show: false,
      maxValue: 0,
      target:'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'C_BREAK', t:'members', f:(buff,unit, data)=>{
      m.state.psCount = Math.min(3, (m.state.psCount || 0) + (data.target.isElite()? 3: 1));
      m.castPS();
    }})
  }
}
class SsrHimeko extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffWeakType, [Buff.simpleListener()],'',{type:'Fire', weakFire: 10, name:'火易伤', source:'秘技', maxValue:1}),
      Buff.getListJson(this, BuffBreakListener),
    ];
    if(this.checkES('星火')){
      list.push(Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate: 30, count: 1, baseAttr:'atk', type:'Fire', name:'灼烧', source:'天赋', maxValue:1,
      }));
    }
    if(this.checkES('灼热')) list.push(Buff.getListJson(this, BuffDamageFire, [Buff.eventListener('C_DMG_E', 'self')]));
    if(this.checkES('道标')) list.push(Buff.getListJson(this, BuffCriRate));
    if(this.checkSoul(1)){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()],'',{
        speedRate: 20, name:'童年', source:'星魂', maxValue:1,
      }))
    }
    if(this.checkSoul(2)) list.push(Buff.getListJson(this, BuffDamageHp));
    return list;
  }
  getStateExText() {
    return `充能:${this.state.psCount || 0}`;
  }
  getStateExData() {
    return this.state.psCount || 0;
  }
  updateReport(enemy){
    const others = [];
    if(this.checkSoul(4)) others.push(['战技击破', 1]);
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
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      this.addBuff(Buff.getKey(this.name, '天赋', '灼热'), this, 1);
      cb();
    }, 'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','rateC','rateD'), baseData.nsHitsC, baseData.nsHitsD);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>cb(),'US', target, 'all', 5, this.rawFunc(2,'us'), baseData.usHits);
  }
  castPS() {
    const s = this.state;
    if(s.psTriggered || s.psCount<3) return;
    s.psTriggered = true;
    s.psCount = 0;
    this.castAdditionAttack('enemies', 'all', 10, this.rawFunc(1, 'ps'), baseData.psHits, null, { himekoPS: true });
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(Buff.getKey(this.name, '秘技', '火易伤'), e, 1, { count: 2 }, 1));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      this.state.psCount = 1;
      if(this.state.fieldActivated) this.onSP();
    } else if(e==='C_DMG_E') {
      if(this.checkES('星火')){
        data.targets.forEach(e => this.addBuffRandom(Buff.getKey(this.name, '天赋', '灼烧'), e, 1, { count: 2 }, 0.5))
      }
      if(this.checkSoul(6) && D.checkType(data.type, 'US')){
        const raw = this.getBaseDmg('us')*0.4;
        A.newAddDmg(this, this, [D.sample(data.targets)], raw, false, null, 'US');
        A.newAddDmg(this, this, [D.sample(data.targets)], raw, false, null, 'US');
      }
      if(data.options && data.options.himekoPS) {
        if(this.checkSoul(1))this.addBuff(Buff.getKey(this.name, '星魂', '童年'), this, 1, {count: 2});
        this.state.psTriggered = false;
      }
    } else if(e==='C_BREAK') {
      if(this.checkSoul(4) && D.checkType(data.type, 'NS')) this.addEn(1);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;    
    const bonus = enemy.findBuff({ tag:'灼烧' }) && this.checkES('灼热')? 20: 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Fire', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[中心]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rateC, [ 'Fire', 'NS' ], this, enemy, null, {bonus})),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateD, [ 'Fire', 'NS' ], this, enemy, null, {bonus})),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rate, [ 'Fire', 'US' ], this, enemy)),
    ];
    if(this.checkSoul(6)) {
      list.push(Object.assign({ type: 'damage', name:'终结技[追加]]', tip:'弹射2次'}, C.calDmg(base * us.rate * 0.4, [ 'Fire', 'US' ], this, enemy)));
    }
    list.push(Object.assign({ type: 'damage', name:'追加攻击', brkDmg}, C.calDmg(base * ps.rate, [ 'Fire', 'AA' ], this, enemy)));
    if(this.checkES('星火')) {
      const dotDmg = C.calDmg(base * 30, [ 'Fire', 'DOT' ], this, enemy, {simpleMode:true});
      list.push({ type:'dot', name:'灼烧', damage: dotDmg, turn: 2, totalDamage: dotDmg*2, hitRate: C.calHitRate(0.5, this, enemy) });
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrHimeko,
};