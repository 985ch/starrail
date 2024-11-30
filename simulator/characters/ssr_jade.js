'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDefThrough, BuffBonus } = require('../buff_simple');

const baseData = {
  name: '翡翠',
  image: 'jade.jpg',
  rarity: 'SSR',
  job: '智识',
  type: 'Quantum',
  damages: ['AA','US'],
  hp: D.levelData['147_1086'],
  atk: D.levelData['89_659'],
  def: D.levelData['69_509'],
  speed: 103,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 140,
  na: D.makeTable([['rateC','rateD'],[45,15],[54,18],[63,21],[72,24],[81,27],[90,30],[99,33],[108,36],[117,39]]),
  naHitsC: [1],
  naHitsD: [1],
  naSoul: 5,
  ns: D.makeTable([['speed','rate'],[30,15],[30,16],[30,17],[30,18],[30,19],[30,20],[30,21.25],[30,22.5],[30,23.75],[30,25],[30,26],[30,27],[30,28],[30,29],[30,30]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['rate','criDamage'],[60,1.2],[66,1.32],[72,1.44],[78,1.56],[84,1.68],[90,1.8],[97.5,1.95],[105,2.1],[112.5,2.25],[120,2.4],[126,2.52],[132,2.64],[138,2.76],[144,2.88],[150,3]]),
  psHits: [0.15,0.15,0.15,0.15,0.4],
  psHitsP: [0.1,0.1,0.1,0.1,0.6],
  psSoul: 3,
  us: D.makeTable([['rate','rateB'],[120,40],[132,44],[144,48],[156,52],[168,56],[180,60],[195,65],[210,70],[225,75],[240,80],[252,84],[264,88],[276,92],[288,96],[300,100]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '逆回购', '折牙票', '绝当品' ],
  attributes: [
    {bonusQuantum: 3.2}, {bonusQuantum: 3.2}, {bonusQuantum: 4.8}, {bonusQuantum: 4.8}, {bonusQuantum: 6.4},
    {dodge: 4.0 }, {dodge: 6.0 }, {atkRate: 4.0 }, {atkRate: 6.0 }, {atkRate: 8.0 },
  ],
  defaultJson: {
    weapon:'偏偏希望无价', name4: '风举云飞的勇烈', name2: '奔狼的都蓝王朝',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusQuantum',
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai: {
    na: ai.na_default,
    ns: ai.ns_buff_noT('翡翠$战技$收债人.'),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      body: 'criRate',
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusQuantum',
    },
  },
};
const buffNsKey = Buff.getKey(baseData.name, '战技', '收债人');
const buffPsKey = Buff.getKey(baseData.name, '天赋', '当品');
class BuffSZR extends Buff {
  static info() {
    return {
      name: '收债人',
      short: '收债人',
      source: '战技',
      desc: '速度提高并获得附加伤害',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['收债人','report'],
    };
  }
  getDesc() {
    const m = this.member;
    const tar = this.target;
    return `${m!==tar?'速度提高'+this.data.speed+'。攻击时每命中一个目标损失2%生命，最多扣除至1，':''}，攻击时对每个目标造成翡翠${D.toPercent(this.data.rate)}%攻击力的附加伤害。`;
  }
  init() {
    const m = this.member;
    const tar = this.target;
    this.listen({e:'C_DMG_E', t:'member', f:(buff,unit, data)=>{
      const targets = data.targets;
      if(m !== tar) tar.costHp(2 * targets.length);
      A.newAddDmg(m, tar, targets, m.getAttr('atk') * m.skillData.ns.rate * 0.01, false, 'Quantum');
      if(data.options.jadePS) return;
      const enCount = targets.length + (m.checkSoul(1) && targets.length<3 ? (targets.length==1? 2: 1): 0);
      m.addPsCount(enCount);
    }});
    if(m.checkES('逆回购')) {
      this.listen({e:'TURN_S', t:'member',  f:(buff,unit, data)=>{
        m.addBuff(buffPsKey, m, 3, {});
      }})
    }
    if(m.checkSoul(6)) {
      this.listen({e:'BEFORE_DEATH', t:'member', f:(buff,unit,data)=>{
        if(tar!==m) m.removeABuff('收债人')
      }})
    }
  }
  getAttributes() {
    return {
      speed: this.member===this.target? 0: this.data.speed,
    }
  }
  getReportData(target) {
    const m = this.member;
    if(m === target) return [];
    const enemy = target.getEnemy();
    return [Object.assign({ type: 'damage', name:'翡翠追伤'}, C.calDmg(m.getAttr('atk')*0.01 * m.skillData.ns.rate, ['Quantum', 'AD'], m, enemy))];
  }
}
class BuffDP extends Buff {
  static info() {
    return {
      name: '当品',
      short: '当品',
      source: '天赋',
      desc: '爆伤提高，攻击提高',
      show: true,
      maxValue: 50,
      target: 'self',
      tags: ['暴击','暴伤','加攻'],
    };
  }
  getDesc() {
    const {criRate, criDamage, atkRate} = this.getData();
    return `${criRate?'暴击提高'+D.toPercent(criRate)+'，':''}爆伤提高${D.toPercent(criDamage)}${atkRate? '，攻击提高'+D.toPercent(atkRate): ''}。`;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    return {
      criRate: (this.value>=15 && this.member.checkSoul(2))? 18: 0,
      criDamage: this.value*this.data.criDamage,
      atkRate: this.member.checkES('绝当品')? this.value*0.5: 0, 
    }
  }
}
class BuffQuantumThrough extends Buff {
  static info() {
    return {
      name: '量子穿透',
      short: '量子穿透',
      source: '星魂',
      desc: '量子抗性穿透提高20%',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', 'throughQuantum', '量子穿透'],
    };
  }
  isActivated() {
    return this.member.findBuff({key:buffNsKey }, null, false)? true: false;
  }
  getAttributes() {
    return { throughQuantum: this.isActivated()? 20: 0 }
  }
}
class EnemiesListener extends Buff {
  static info() {
    return {
      name: '逆回购敌方监听',
      short: '监听',
      source: '天赋',
      desc: '',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  init() {
    this.listen({e:'BTL_S', t:'enemies', f:(buff,unit, data)=>{
      this.member.addBuff(buffPsKey, this.member, 1);
    }})
  }
}
class SsrJade extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { ns, ps } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffSZR, [Buff.eventListener('TURN_S', 'self')],'',{speed: ns.speed, rate: ns.rate }),
      Buff.getListJson(this, BuffDP, [], '', {criDamage: ps.criDamage }),
    ];
    if(this.checkES('逆回购')) {
      list.push(Buff.getListJson(this, EnemiesListener));
    }
    if(this.checkSoul(1)){
      list.push(Buff.getListJson(this, BuffBonus, [Buff.eventListener('C_ATK_E', 'self')], '', {
        bonusAA: 32, type: 'AA', name: '追击增伤', source:'星魂', maxValue: 1, hide: true,
      }));
    }
    if(this.checkSoul(4)) list.push(Buff.getListJson(this, BuffDefThrough, [Buff.simpleListener()], '', {
      defThrough: 12, name: '防御穿透', source: '星魂',  maxValue: 1,
    }));
    if(this.checkSoul(6)){
      list.push(Buff.getListJson(this, BuffQuantumThrough, [],''))
    }
    return list;
  }
  getStateExText() {
    const { psCount, aaBonus } = this.getStateExData();
    return `追击：${psCount}(${aaBonus})`;
  }
  getStateExData() {
    const s = this.state;
    return {
      psCount: s.psCount || 0,
      aaBonus: s.aaBonus || 0,
    }
  }
  updateReport(enemy){
    const others = [['天赋追击', 10]];
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
  castNA(target) {
    this.actionAttack(cb=>cb(),'NA', target, 'diff', 20, this.rawDiffFunc(2,1,'na','rateC','rateD'), baseData.naHitsC, baseData.naHitsD);
    this.changeSp(1);
  }
  checkDisableNS() {
    return super.checkDisableNS() || (this.findBuff({key:buffNsKey }, null, false)? true: false);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffNsKey, target, 1, { count: 3 });
      if(this.checkSoul(6)) this.addBuff(buffNsKey, this, 1, { count: 3 });
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      this.state.aaBonus = 2;
      if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '星魂', '防御穿透'), this, 1, { count: 3 });
    },'US', target, 'all', 5, this.rawFunc(2,'us'), baseData.usHits);
  }
  addPsCount(count) {
    this.state.psCount = (this.state.psCount || 0) + count;
    if(this.state.psCount >= 8) this.castPS();
  }
  castPS() {
    const s = this.state;
    if(s.psCount<8) return;
    s.psCount -= 8;
    this.castAdditionAttack('enemies', 'all', 10, ()=>{
      const bonus = s.aaBonus? this.skillData.us.rateB: 0;
      if(s.aaBonus) s.aaBonus--;
      return { brkDmg: 1, raw: this.getBaseDmg('ps') + bonus }
    }, bonus===0? baseData.psHits: baseData.psHitsP, null, { jadePS: true }, cb=>{
      this.addBuff(buffPsKey, this, 5);
      cb();
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(buffPsKey, this, 15);
    A.startBattleDmg(this, 0, this.rawFuncRate(0, 50))
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('折牙票')) this.changeWaitTime(-50);
      if(this.state.spActivated) this.onSP();
    } else if(e==='C_DMG_E') {
      const options = data.options || {};
      if(!options.jadePS) this.addPsCount(data.targets.length);
    } else if(e==='C_ATK_S') {
      const options = data.options || {};
      if(options.jadePS && this.checkSoul(1)) this.addBuff(Buff.getKey(this.name, '星魂', '追击增伤'), this, 1);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const bonus = this.findBuff({ key:Buff.getKey(this.name, '星魂', '追击增伤') })? 0: 32;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻[中心]', brkDmg }, C.calDmg(base * na.rateC, [ 'Quantum', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'普攻[扩散]', brkDmg: brkDmg*0.5 }, C.calDmg(base * na.rateD, [ 'Quantum', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rate, [ 'Quantum', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'追加攻击', brkDmg}, C.calDmg(base * ps.rate, [ 'Quantum', 'AA' ], this, enemy, null, { bonus })),
      Object.assign({ type: 'damage', name:'强化追击', brkDmg}, C.calDmg(base * (ps.rate + us.rateB), [ 'Quantum', 'AA' ], this, enemy, null, { bonus })),
      Object.assign({ type: 'damage', name:'翡翠追伤'}, C.calDmg(base * ns.rate, ['Quantum', 'AD'], this, enemy)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrJade,
};