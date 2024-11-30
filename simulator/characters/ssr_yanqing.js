'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffSpeedRate } = require('../buff_simple');
const { DebuffFreeze } = require('../debuff_simple');

const baseData = {
  name: '彦卿',
  image: 'yanqing.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Ice',
  hp: D.levelData['121_892'],
  atk: D.levelData['92_679'],
  def: D.levelData['56_412'],
  speed: 109,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 140,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.5, 0.25, 0.25],
  naSoul: 3,
  ns: D.makeTable([['rate'],[110],[121],[132],[143],[154],[165],[178],[192],[206],[220],[231],[242]]),
  nsTarget: 'enemy',
  nsHits: [0.25, 0.25, 0.25, 0.25],
  nsSoul: 3,
  ps: D.makeTable([
    ['criRate','criDamage','chance', 'rate'],
    [ 15.0, 15.0, 50, 25],
    [ 15.5, 16.5, 51, 27.5],
    [ 16.0, 18.0, 52, 30],
    [ 16.5, 19.5, 53, 32.5],
    [ 17.0, 21.0, 54, 35],
    [ 17.5, 22.5, 55, 37.5],
    [ 18.1, 24.4, 56, 40.6],
    [ 18.7, 26.2, 57, 43.7],
    [ 19.3, 28.1, 58, 46.8],
    [ 20.0, 30.0, 60, 50],
    [ 20.5, 31.5, 61, 52.5],
    [ 21.0, 33.0, 62, 55],
  ]),
  psHits: [0.3, 0.7],
  psSoul: 5,
  us: D.makeTable([['criDamage','rate'],[30, 210],[32, 224],[34, 238],[36, 252],[38, 266],[40, 280],[42, 297],[45, 315],[47, 332],[50, 350],[52, 364],[54, 378]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 5,
  es: [ '颁冰', '凌霜', '轻吕' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { bonusIce: 3.2 }, { bonusIce: 4.8 }, { bonusIce: 6.4 },
  ],
  defaultJson: {
    weapon:'如泥酣眠', name4: '密林卧雪的猎人', name2: '繁星竞技场',
    body: 'criDamage', foot: 'speed', link:'atkRate', ball:'bonusIce',
  },
};

const buffNsKey = Buff.getKey(baseData.name, '战技', '智剑连心');
const buffUsKey = Buff.getKey(baseData.name, '终结技', '快雨燕相逐');
const freezeDebuff = Buff.getKey(baseData.name, '天赋', '冻结');
class BuffZJLX extends Buff {
  static info() {
    return {
      name: '智剑连心',
      short: '智剑',
      source: '战技',
      desc:'双暴提高，有概率发动可触发冻结的追击',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '暴击', '暴伤', 'report', 'removable'],
    };
  }
  init() {
    const member = this.member;
    const { chance } = member.skillData.ps;
    this.listen({ e: 'C_ATK_E', t:'self', f: (buff, unit, data)=>{
      if(Math.random() > chance || !D.checkType(data.type, ['NA','NS','US']))return;
      const target = data.targets[0]
      member.castAdditionAttack(target, 'single', 10, member.rawFunc(1, 'ps'), baseData.psHits, null, { yanqingAA:true });
    }});
    this.listen({ e: 'B_DMG_E', t:'self', f: (buff, unit, data)=> {
      if(data.damage - (data.blocked || 0) > 0.005) buff.state.count = 0;
    }});
  }
  getDesc() {
    const { criRate, criDamage, dodge, enRate } = this.getData();
    let text = `受击概率降低，暴击提高${criRate.toFixed(1)}%，暴伤提高${criDamage.toFixed(1)}%，`;
    if(enRate>0) text+="能量回复效率提高10%，";
    if(dodge>0) text += "效果抵抗提高20%，";
    text += `有${this.member.skillData.ps.chance.toFixed(1)}%固定概率发动追击，追击有65%基础概率冻结敌人。`;
    return text;
  }
  stack(sameBuff) {
    this.state.usTurn = sameBuff.state.usTurn;
  }
  getAttributes() {
    return this.getData();
  }
  getData() {
    const member = this.member;
    const { criRate, criDamage } = member.skillData.ps;
    const bonus = (this.state.usTurn >= member.state.turn)? member.skillData.us.criDamage: 0;
    return {
      hate: -50,
      criRate,
      criDamage: criDamage + bonus,
      dodge: member.checkES('凌霜')? 20 : 0,
      enRate: member.checkSoul(2)? 10 : 0,
    }
  }
}
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '快雨燕相逐',
      short: '暴击',
      source: '终结技',
      desc:'暴击率提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '暴击'],
    };
  }
  init() {
    const m = this.member;
    const buff = m.findBuff({ key: buffNsKey });
    if(buff) buff.state.usTurn = m.state.turn + (m.checkMyTurn(true)? 2 : 1);
  }
  getDesc() {
    return '暴击概率提高60%。';
  }
  getAttributes() {
    return { criRate: 60 };
  }
}
class BuffThrough extends Buff {
  static info() {
    return {
      name: '冰抗穿透',
      short: '冰穿',
      source: '星魂',
      desc:'冰抗性穿透',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributes() {
    return this.member.checkHp(80, true)?{ throughIce: 12}:{}
  }
}
class BuffBonus extends Buff {
  static info() {
    return {
      name: '御剑真诀',
      short: '增伤',
      source: '秘技',
      desc:'对生命值高于50%的目标增伤',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll', 'removable'],
    };
  }
  getDesc() {
    return `对生命值大于等于50%的目标造成的伤害提高30%。`;
  }
  getAttributesT(target) {
    return target.checkHp(50, true)? { bonusAll: 30 }:{};
  }
}

class SsrYanqing extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffZJLX, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffCriRate, [Buff.simpleListener()]),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {
        baseAttr:'atk', rate:this.skillData.ps.rate ,name: '冻结', source: '天赋',
      }),
      Buff.getListJson(this, BuffBonus, [Buff.simpleListener()]),
    ];
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffThrough, [Buff.simpleListener()]));
    }
    if(this.checkES('轻吕')){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 10, name: '轻吕', source: '天赋',  maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        { type:'energy', name:'智剑连心[回能]', labels:['追击回能'], en0: C.calEnergy(10, this)},
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const hasBuff = this.findBuff({key:buffNsKey})!==null;
    return hasBuff?'智剑连心':'-';
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      cb();
      this.addBuff(buffNsKey, this, 1);
    }, 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      const buff = this.findBuff({ key: buffNsKey });
      if(buff) buff.state.usTurn = this.state.turn + 1;
      this.addBuff(buffUsKey, this, 1);
      cb();
    },'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '御剑真诀'), this, 1, { count: 2 });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
    } else if(e==='C_DMG_E') {
      if(D.checkType(data.type, ['SP'])) return;
      const base = this.getAttr('atk')*0.01;
      if(this.checkES('颁冰')) {
        data.targets.forEach(t =>{
          if(t.findBuff({tag:'weakIce'}))A.newAddDmg(this, this, [t], base*30);
        });
      }
      if(this.checkSoul(1)) {
        data.targets.forEach(t => {
          if(t.findBuff({tag:'冻结'}))A.newAddDmg(this, this, [t], base*60);
        });
      }
    } else if(e==='C_KILL') {
      const usBuff = this.findBuff({key: buffUsKey});
      const nsBuff = this.findBuff({key: buffNsKey});
      if(usBuff)usBuff.state.count++;
      if(nsBuff && nsBuff.state.usTurn) nsBuff.state.usTurn++;
    } else if(e==='C_ATK_E') {
      if(data.options && data.options.yanqingAA) {
        this.addBuffRandom(freezeDebuff, data.target, 1, { count:1 }, 0.65, 1, true);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const adDamage = C.calDmg(base * ps.rate,['Ice', 'AD'], this, enemy, { simpleMode:true });

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Ice', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rate,[ 'Ice', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3 }, C.calDmg(base * us.rate, [ 'Ice', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'追击', brkDmg, hitRate: ps.chance }, C.calDmg(base * ps.rate, [ 'Ice', 'AA' ], this, enemy)),
      { type: 'dot', name:'冻结[伤害]', damage: adDamage, turn: 1, totalDamage: adDamage, hitRate: C.calHitRate(0.65, this, enemy, 1, true) },
    ];
    if(this.checkES('颁冰')){
      list.push(Object.assign({ type:'damage', name:'弱冰目标[追伤]'}, C.calDmg(base * 30, ['Ice', 'AD'], this, enemy)));
    }
    if(this.checkSoul(1)){
      list.push(Object.assign({ type:'damage', name:'被冻结目标[追伤]'}, C.calDmg(base * 60, ['Ice', 'AD'], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrYanqing,
};