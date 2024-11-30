'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffBlock, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '素裳',
  image: 'sushang.jpg',
  rarity: 'SR',
  job: '巡猎',
  type: 'Physical',
  hp: D.levelData['124_917'],
  atk: D.levelData['76_564'],
  def: D.levelData['57_418'],
  speed: 107,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate', 'rateAD'],[105, 50],[115, 55],[126, 60],[136, 65],[147, 70],[157, 75],[170, 81],[183, 87],[196, 93],[210, 100],[220, 105],[231, 110]]),
  nsTarget: 'enemy',
  nsHits: [0.3, 0.7],
  nsSoul: 5,
  ps: D.makeTable([['speedRate'], [15], [15.5], [16], [16.5], [17], [17.5], [18.12], [18.75], [19.37], [20], [20.5], [21]]),
  psSoul: 3,
  us: D.makeTable([['rate','atkRate'],[192, 18],[204, 19],[217, 20],[230, 21],[243, 22],[256, 24],[272, 25],[288, 27],[304, 28],[320, 30],[332, 31],[345, 32]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: [ '赤子', '逐寇', '破敌' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
  ],
  defaultJson: {
    weapon:'唯有沉默', name4: '街头出身的拳王', name2: '盗贼公国塔利亚',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusPhysical',
    hp:[1,0,0],def:[1,0,0]
  },
  ai:{
    na: ai.na_breaker,
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","eq",0,"yes"]},{t:"shield",v:["eq",0]}],
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱物理","gt",0]}],
        [{t:"target",v:["selected"]},{t:"sp",v:["gt",1]}]
      ]
    },
    us: {
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱物理","gt",0]}],
        [{t:"target",v:["selected"]}]
      ]
    },
  },
};

const buffUsKey = Buff.getKey(baseData.name, '终结技', '太虚形蕴·烛夜');
const buffEsKey = Buff.getKey(baseData.name, '天赋', '逐寇');
class BuffSushang extends Buff {
  static info() {
    return {
      name: '素裳天赋',
      short: '特殊',
      source: '天赋',
      desc: '素裳',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'C_BREAK', t:'members', f:(buff, unit, data)=>{
      m.addBuff(Buff.getKey(m.name, '天赋', '游刃若水'), m, 1, { count: 2});
    }});
  }
  getAttributes() {
    const m = this.member;
    return (m.checkES('赤子') && m.checkHp(50))? {hate:-50 }: {};
  }
}
class BuffZY extends Buff {
  static info() {
    return {
      name: '太虚形蕴·烛夜',
      short: '加攻',
      source: '终结技',
      desc: '攻击提高，额外剑势',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', 'atkRate', '加攻', '附加伤害'],
    };
  }
  getDesc() {
    return `攻击力提升${D.toPercent(this.member.skillData.us.atkRate)}，战技额外增加两次剑势发动判定，额外剑势伤害为原伤害的50%。`;
  }
  getAttributes() {
    return { atkRate: this.member.skillData.us.atkRate};
  }
}
class BuffZK extends Buff {
  static info() {
    return {
      name: '逐寇',
      short: '剑势+',
      source: '天赋',
      desc: '剑势伤害提高',
      show: true,
      maxValue: 10,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    return `剑势伤害提高${D.toPercent(2*this.value)}。`;
  }
}

class SrSushang extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkSoul(4)) list.push({ breakRate:40 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffSushang),
      Buff.getListJson(this, BuffZY, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()],'',{
        speedRate: this.skillData.ps.speedRate,
        name: '游刃若水', source:'天赋', maxValue: this.checkSoul(6)? 2: 1,
      }),
    ];
    if(this.checkES('逐寇')) {
      list.push(Buff.getListJson(this, BuffZK));
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffBlock, [Buff.simpleListener()], '', {
        damageRate: 20,  name: '其身百炼', source: '星魂', maxValue: 1,
      }))
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        ...this.getActionReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
    if(this.checkSoul(1) && target.findBuff({tag:'破韧'})) this.changeSp(1);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.addBuff(buffUsKey, this, 1, { count: 2});
      cb();
    },'US', target, 'single', 5, this.rawFunc(3, 'us') , baseData.usHits);
    this.changeWaitTime(-100, true);
  }
  castSP() {
    super.castSP(()=> A.startBattleDmg(this, 2, this.rawFuncRate(0, 80)));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_ATK_E') {
      if(this.checkES('破敌') && D.checkType(data.type, ['NA','NS']) && this.findBuff({tag:'破韧'}, null, false)) {
        this.changeWaitTime(-15);
      }
    } else if(e==='BTL_S') {
      if(this.checkSoul(6)) this.addBuff(Buff.getKey(this.name, '天赋', '游刃若水'), this, 1, { count: 2});
    } else if(e==='C_DMG_E') {
      if(D.checkType(data.type, 'NS')) {
        const hasUsBuff = this.findBuff({key: buffUsKey});
        data.targets.forEach((t)=>{
          const isBroken = t.findBuff({tag:'破韧'})
          this.randomAdditionDamage(t, isBroken, false);
          if(hasUsBuff) {
            this.randomAdditionDamage(t, isBroken, true);
            this.randomAdditionDamage(t, isBroken, true);
          }
        })
      }
    }
    super.onEvent(e, unit, data);
  }
  randomAdditionDamage(target, isBroken, isHalf) {
    const trigger = isBroken || Math.random() < 0.33;
    if(!trigger)return;
    const base =  this.getBaseDmg('ns','rateAD') * (isHalf? 0.5: 1);
    A.newAddDmg(this, this, [target], base, false, 'Physical');
    if(this.checkES('逐寇')) this.addBuff(buffEsKey, this, 1); // 注意：未确认发动前还是发动后
    if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '其身百炼'), this, 1);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;
    const esBuff = this.findBuff({key:buffEsKey});
    const bonus = esBuff? esBuff.value: 0
    const usBuff = this.findBuff({key:buffUsKey});
    const hitRate = enemy.findBuff({tag:'破韧'})? 100: 33;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Physical', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rate, [ 'Physical', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3 }, C.calDmg(base * us.rate, [ 'Physical', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'剑势', hitRate},
        C.calDmg(base * ns.rateAD, [ 'Physical', 'AD'], this, enemy, null, { bonus})),
    ];
    if(usBuff) {
      list.push(Object.assign({ type: 'damage', tip:'触发两次', name:'剑势(额外)', hitRate},
        C.calDmg(base * ns.rateAD * 0.5, [ 'Physical', 'AD'], this, enemy, null, { bonus })));
    }
    list.push(Object.assign({ type: 'damage', name:'秘技', brkDmg: 2}, C.calDmg(base * 80, [ 'Physical', 'SP'], this, enemy)));
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getActionReport() {
    if(this.checkES('破敌') && this.findBuff({tag:'破韧'}, null, false)){
      const wait = C.calActionTime(this.getAttr('speed'), 15);
      return [{ type:'action', name:'行动间隔', wait }]
    }
    return R.getActionReport(this);
  }
}

module.exports = {
  data: baseData,
  character: SrSushang,
};