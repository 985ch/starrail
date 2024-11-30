'use strict';

const { SummonUnit, Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffWeakTmp } = require('../debuff_simple');

const baseData = {
  name: '流萤',
  image: 'firefly.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Fire',
  damages: ['NA','NS'],
  needAttrs: [{raw:'breakRate', tar:['atkRate'], range:[0,360] },{raw:'atk', tar:['breakRate'], range:[0, 9999]}],
  brkList: [1, 3, 6],
  hp: D.levelData['111_815'],
  atk: D.levelData['71_523'],
  def: D.levelData['105_776'],
  speed: 104,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 240,
  na: D.makeTable([
    ['rate', 'rateP'],
    [50, 100],
    [60, 120],
    [70, 140],
    [80, 160],
    [90, 180],
    [100, 200],
    [110, 220],
    [120, 240],
    [130, 260],
  ]),
  naHits: [1],
  naHitsP: [0.15, 0.15, 0.15, 0.15, 0.4],
  naSoul: 3,
  ns: D.makeTable([
    ['rate','enRate', 'rateD'],
    [100, 50, 50],
    [110, 51, 55],
    [120, 52, 60],
    [130, 53, 65],
    [140, 54, 70],
    [150, 55, 75],
    [162.5, 56.25, 81.25],
    [175, 57.5, 87.5],
    [187.5, 58.75, 93.75],
    [200, 60, 100],
    [210, 61, 105],
    [220, 62, 110],
    [230, 63, 115],
    [240, 64, 120],
    [250, 65, 125]
  ]),
  nsTarget: 'enemy',
  nsHits: [0.4, 0.6],
  nsHitsP: [0.15, 0.15, 0.15, 0.15, 0.4],
  nsSoul: 3,
  ps: D.makeTable([['damageRate','dodge'], [20, 10], [22, 12], [24, 14], [26, 16], [28, 18], [30, 20], [32.5, 22.5], [35, 25], [37.5, 27.5], [40, 30], [42, 32], [44, 34],[46, 36],[48, 38],[50, 40]]),
  psSoul: 5,
  us: D.makeTable([
    ['weakBRK', 'speed'],
    [10, 30],
    [11, 33],
    [12, 36],
    [13, 39],
    [14, 42],
    [15, 45],
    [16.25, 48.75],
    [17.5, 52.5],
    [18.75, 56.25],
    [20, 60],
    [21, 63],
    [22, 66],
    [23, 69],
    [24, 72],
    [25, 75],
  ]),
  usTarget: 'self',
  usSoul: 5,
  es: ['偏时迸发', '自限装甲', '过载核心'],
  attributes: [
    {breakRate: 5.3}, {breakRate: 5.3}, {breakRate: 8.0}, {breakRate: 8.0}, {breakRate: 10.7},
    {speed: 2.0}, {speed: 3.0}, {dodge: 4.0}, {dodge: 6.0}, {dodge: 8.0},
  ],
  defaultJson: {
    weapon:'梦应归于何处', name4: '荡除蠹灾的铁骑', name2: '劫火莲灯铸炼宫',
    body: 'criRate', foot: 'atkRate', link:'breakRate', ball:'atkRate',
  },
  equipSetting: {
    rule: 'dmgBRK',
    main: {
      body: 'atkRate',
      foot: 'speed',
      link: 'breakRate',
      ball: 'atkRate',
    },
  },
};
const buffUsKey = Buff.getKey(baseData.name, '终结技', '完全燃烧');
const buffWeakKey = Buff.getKey(baseData.name, '战技', '火属性弱点');
class BuffFullBurning extends Buff {
  static info() {
    return {
      name: '完全燃烧',
      short: '强化',
      source: '终结技',
      desc:'进入完全燃烧状态，得到大幅度强化',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    };
  }
  getDesc() {
    const m = this.member;
    const data = this.getData();
    const ext1 = m.checkES('偏时迸发')?'。对没有火弱点的敌人亦有55%削韧':'';
    const ext2 = data.superBrk?`。攻击破韧后的敌人可将削韧值转为${data.superBrk}%的超击破伤害`:'';
    const soul1 = data.arpNS?`。强化战技获得${data.arpNS}%防御穿透`:'';
    const soul2 = m.checkSoul(2)?`。击杀或击破敌人时可获得额外回合`:'';
    const soul4 = data.dodge?`效果抵抗提高${data.dodge}%，`:'';
    const soul6 = data.throughFire?`获得${data.throughFire}%的火抗穿透，`:'';
    return `强化普攻和战技，速度提高${data.speed}，弱点击破效率提高${data.breakBonus}%，${soul6}${soul4}对敌方目标获得${data.weakBRK}%击破易伤${ext1}${ext2}${soul1}${soul2}。`
  }
  init(){
    const m = this.member;
    m.changeFlag.summon();
    this.listen({e:'B_DMG_E', t:'enemies', f:(buff, unit, data)=>{
      if(data.member!==m || !m.checkES('自限装甲') || !unit.checkAlive() || unit.state.shield>0) return;
      const breakRate = m.getAttr('breakRate');
      const rate = breakRate>=360? 50: (breakRate>=200? 35: 0);
      const tInfo = data[unit.name];
      if(tInfo.brkDmgEx) m.castSuperBrkDmg(unit, tInfo.brkDmgEx, rate);
    }})
  }
  getAttributes() {
    const data = this.getData();
    return {
      speed: data.speed,
      breakBonus: data.breakBonus,
      dodge: data.dodge,
      throughFire: data.throughFire,
      arpNS: data.arpNS,
    }
  }
  getData() {
    const m = this.member;
    const { us } = m.skillData;
    const breakRate = m.getAttr('breakRate');
    return {
      speed: us.speed,
      breakBonus: 50 + (m.checkSoul(6)? 50: 0),
      weakBRK: us.weakBRK,
      superBrk: breakRate>=360? 50: (breakRate>=200? 35: 0),
      dodge: m.checkSoul(4)? 50: 0,
      throughFire: m.checkSoul(6)? 20: 0,
      arpNS: m.checkSoul(1)? 15: 0,
    }
  }
  beforeRemove() {
    this.member.changeFlag.dismiss();
  }
}
class BuffFBE extends Buff {
  static info() {
    return {
      name: '完全燃烧[敌]',
      short: '易伤',
      source: '天赋',
      desc:'当萨姆完全燃烧时，受到萨姆攻击有击破易伤',
      show: false,
      maxValue: 0,
      target: 'enemies',
      tags: [],
    };
  }
  getAttributesB(target) {
    const m = this.member;
    return target===m && m.findBuff({key: buffUsKey})? {
      weakBRK: this.member.skillData.us.weakBRK,
    }: null;
  }
}
class BuffFirefly extends Buff {
  static info() {
    return {
      name: '源火中枢',
      short: '减伤',
      source: '天赋',
      desc:'受到的伤害降低，效果抵抗提高',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['减伤','抵抗'],
    };
  }
  getDesc() {
    const data = this.getData();
    return `获得${D.toPercent(data.damageRate)}减伤，且效果抵抗提高${data.dodge}。${data.breakRate? `击破特攻提高${D.toPercent(data.breakRate)}。`: ''}`;
  }
  getAttributes() {
    const data = this.getData();
    return {
      damageRate: 1 - data.damageRate*0.01,
      dodge: data.dodge,
    }
  }
  getData() {
    const m = this.member;
    const { ps } = m.skillData;
    const hpRate = m.findBuff({key: buffUsKey})? 0.8: Math.min(0.8, 1 - (m.state.hp || 0)/m.getAttr('hp'));
    const breakRate = m.checkES('过载核心')? Math.max(0, Math.floor((m.buffedAttr.data.atk-1800)/10)*0.8): 0;
    return {
      dodge: ps.dodge,
      damageRate: hpRate*ps.damageRate/0.8,
      breakRate,
    }
  }
  getTransAttr() {
    return {breakRate: { raw:'atk', min: 1800, step: 10, rate:0.8 }};
  }
}

class Flag extends SummonUnit {
  getBase() {
    return { image:'firefly_flag.jpg', rarity:'SSR', flag: true }
  }
  countDown() {
    this.state.wait = 10000/70;
    this.team.updateActionUnit(this);
  }
  checkAlive() {
    return this.owner.getStateExData();
  }
  onEvent(e, unit, data) {
    if(e === 'TURN_S' && unit === this) {
      const buff = this.owner.findBuff({key: buffUsKey});
      if(buff) this.owner.removeBuff(buff, true);
    }
    super.onEvent(e, unit, data);
  }
}
class SsrFirefly extends Character {
  constructor(team, index, json) {
    super(team, index, json);
    this.changeFlag = new Flag(this, '完全燃烧');
  }
  getSummonList(){
    return [this.changeFlag];
  }
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffFullBurning),
      Buff.getListJson(this, BuffFBE),
      Buff.getListJson(this, BuffFirefly),
      Buff.getListJson(this, DebuffWeakTmp, [Buff.simpleListener()], '', { weak:'Fire', source:'战技', noDefendDown: true, target:'enemy'})
    ];
    return list;
  }
  getStateExText() {
    return this.getStateExData()?'完全燃烧':'-';
  }
  getStateExData() {
    return this.findBuff({key: buffUsKey})? 1: 0;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { ns:this.base.enMax * this.skillData.ns.enRate *0.01 }),
        ...this.getActionReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(enemy) {
    if(!this.getStateExData()) return super.castNA(enemy);
    const bdInfo = this.getBrkDmgInfo(enemy, 1.5);
    this.actionAttack(cb=>{
      this.triggerHeal([this], this.getAttr('hp')*0.2);
      cb();
    }, 'NA', enemy, 'single', 0, this.rawFunc(bdInfo.brkDmg, 'na', 'rateP', 'atk'), this.base.naHitsP, null, { forceBreak: bdInfo.forceBreak });
    this.changeSp(1);
    this.endBonusTurn();
  }
  checkDisableNS() {
    return !this.canAction() || (this.team.state.sp <= 0 && (!this.checkSoul(1) || !this.getStateExData()));
  }
  castNS(enemy) {
    const { ns } = this.skillData;
    const isBonusTurn = this.checkBonusTurn();
    if(this.getStateExData()) {
      if(!this.checkSoul(1)) this.changeSp(-1);
      const breakRate = Math.min(360, this.getAttr('breakRate'));
      const base = this.getAttr('atk')*0.01;
      const bdInfos = A.getTargets(this, 'diff', enemy).map(unit =>this.getBrkDmgInfo(unit, 3));
      this.actionAttack(cb=>{
        this.triggerHeal([this], this.getAttr('hp')*0.25);
        this.addBuff(buffWeakKey, enemy, 1, { count:2 });
        cb();
      }, 'NS', enemy, 'diff', 0, (i)=>({
        brkDmg: bdInfos[i].brkDmg * (i===0? 1: 0.5),
        raw: i===0? (0.2*breakRate+ns.rate)*base: (0.1*breakRate+ns.rateD)*base,
      }), baseData.nsHitsP, baseData.nsHitsP, { forceBreak: bdInfos.map(obj=>obj.forceBreak) });
    } else {
      this.changeSp(-1);
      this.actionAttack(cb=>{
        this.costHp(40);
        this.addEn(ns.enRate*0.01*this.base.enMax, true);
        cb();
      }, 'NS', enemy, 'single', 0, this.rawFunc(2, 'ns', 'rate', 'atk'), baseData.nsHits);
      this.changeWaitTime(-25);
    }
    if(isBonusTurn)this.endBonusTurn();
  }
  checkDisableUS() {
    return this.getStateExData() || super.checkDisableUS();
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(buffUsKey, this, 1, {count:1});
    });
    this.changeFlag.countDown();
    this.addEn(5);
    this.changeWaitTime(-100, true);
  }
  castSP() {
    this.state.spActivated = true;
    super.castSP(()=>{
      // 什么都不做
    })
  }
  _onSP() {
    const targets = this.team.getAliveUnits('enemies')
    targets.forEach(t => {
      this.addBuff(buffWeakKey, t, 1, { count: 2 })
    });
    A.startBattleDmg(this, 2, this.rawFuncRate(0, 200), 'all','enemies');
  }
  getBrkDmgInfo(target, val) {
    if(!this.checkES('偏时迸发') || target.findBuff({tag:'破韧'}) || target.findBuff({tag:'weakFire'})) {
      return { brkDmg: val, forceBreak: 0}
    }
    return { brkDmg: val*0.55, forceBreak: 1}
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    switch(e) {
      case 'WAVE_S':
        if(this.state.spActivated) this.onSP();
        break;
      case 'BTL_S':
        if(this.state.en < 0.5*this.base.enMax) this.addEn(0.5*this.base.enMax - this.state.en, true);
        break;
      case 'EN_CHANGE':
        if(data.after>=this.base.enMax) {
          let buff = null;
          do {
            buff = this.findBuff({tag:'debuff'});
            if(buff) this.removeBuff(buff, true);
          } while(buff);
        }
        break;
      case 'C_KILL':
      case 'C_BREAK':
        if(this.checkSoul(2) && D.checkType(data.type, ['NA','NS']) && this.getStateExData() && this.updateCD(2,'soul2')) {
          this.startBonusTurn();
        }
        break;
      default:
        break;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(e) {
    const s = this;
    const base = s.getAttr('atk')*0.01;
    const { na, ns } = s.skillData;
    const list = [];
    const brkDmg = C.calBrkDmg(s, e, 1);
    if(!s.getStateExData()){
      list.push(
        Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Fire', 'NA' ], s, e)),
        Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg * 2 }, C.calDmg(base * ns.rate, [ 'Fire', 'NS' ], s, e))
      );
    } else {
      const breakRate = Math.min(360, s.getAttr('breakRate'));
      
      list.push(
        Object.assign({ type: 'damage', name:'强化普攻', brkDmg: brkDmg*1.5, tip:`跨属性削韧${(brkDmg*0.825).toFixed(1)}。` }, C.calDmg(base * na.rateP, [ 'Fire', 'NA' ], s, e)),
        Object.assign({ type: 'damage', name:'强化战技[中心]', brkDmg: brkDmg*3, tip:`跨属性削韧${(brkDmg*1.65).toFixed(1)}。` }, C.calDmg(base * (ns.rate + 0.2 * breakRate), [ 'Fire', 'NS' ], s, e)),
        Object.assign({ type: 'damage', name:'强化战技[扩散]', brkDmg: brkDmg*1.5, tip:`跨属性削韧${(brkDmg*0.825).toFixed(1)}。` }, C.calDmg(base * (ns.rateD + 0.1 * breakRate), [ 'Fire', 'NS' ], s, e))
      )
      if(s.checkES('自限装甲'))list.push(R.getSuperBrkDmgReport(s, e, breakRate>=360? 50:(breakRate>=200? 35: 0), 0, baseData.brkList));
    }
    list.push(
      Object.assign({ type: 'damage', name:'秘技', brkDmg: brkDmg*2, tip:'每波次触发'}, C.calDmg(base*200, ['Void', 'SP'], s, e)),
      R.getBreakReport(s, e)
    );
    return list;
  }
  getActionReport() {
    const list = R.getActionReport(this);
    list.push({ type:'action', name:'战技后', wait: this.calActionTime()*0.75 })
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrFirefly,
};