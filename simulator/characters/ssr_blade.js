'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffBonus, BuffHpRate } = require('../buff_simple');

const baseData = {
  name: '刃',
  image: 'blade.jpg',
  rarity: 'SSR',
  job: '毁灭',
  type: 'Wind',
  mainAttr: 'hp',
  damages: ['NA','AA'],
  hp: D.levelData['184_1358'],
  atk: D.levelData['73_543'],
  def: D.levelData['66_485'],
  speed: 97,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 130,
  na: D.makeTable([
    ['rate', 'rateAC', 'rateHC', 'rateAD', 'rateHD'],
    [50, 20, 50, 8, 20],
    [60, 24, 60, 9, 24],
    [70, 28, 70, 11, 28],
    [80, 32, 80, 12, 32],
    [90, 36, 90, 14, 36],
    [100, 40, 100, 16, 40],
    [110, 44, 110, 17, 44],
  ]),
  naHits: [0.5, 0.5],
  naSoul: 5,
  ns: D.makeTable([['bonusAll'], [12.0], [14.8], [17.6], [20.4], [23.2], [26.0], [29.5], [33.0], [36.5], [40], [42.8], [45.6]]),
  nsTarget: 'self',
  nsSoul: 5,
  ps: D.makeTable([['rateA','rateH'], [22,55],[24.2,60.5],[26.4,66],[28.6,71.5],[30.8,77],[33,82.5],[35.75,89.375],[38.5,96.25],[41.25,103.125],[44,110],[46.2,115.5],[48.4,121]]),
  psHits: [0.33, 0.33, 0.34],
  psSoul: 3,
  us: D.makeTable([
    ['rateAC', 'rateHC', 'rateAD', 'rateHD'],
    [ 24.0, 60, 9.60, 24],
    [ 25.6, 64, 10.24, 25.6],
    [ 27.2, 68, 10.88, 27.2],
    [ 28.8, 72, 11.52, 28.8],
    [ 30.4, 76, 12.16, 30.4],
    [ 32.0, 80, 12.80, 32.0],
    [ 34, 85, 13.6, 34],
    [ 36, 90, 14.4, 36],
    [ 38, 95, 15.2, 38],
    [ 40, 100, 16.0, 40],
    [ 41.6, 104, 16.64, 41.6],
    [ 43.2, 108, 17.28, 43.2],
  ]),
  usTarget: 'enemy',
  usHits: [1], 
  usSoul: 3,
  es: ['无尽形寿', '吞忍百死', '坏劫隳亡'],
  attributes: [
    {hpRate: 4.0}, {hpRate: 4.0}, {hpRate: 6.0}, {hpRate: 6.0}, {hpRate: 8.0},
    {dodge: 4.0}, {dodge: 6.0}, {criRate: 2.7}, {criRate: 4.0}, {criRate: 5.3},
  ],
  defaultJson: {
    weapon:'到不了的彼岸', name4: '宝命长存的莳者', name2: '停转的萨尔索图',
    body: 'criDamage', foot: 'speed', link:'hpRate', ball:'bonusWind',
    hpRate:[0,3,2], hp:[1,0,0],atk:[0,0,1]
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  equipSetting: {
    rule: 'dmgNA',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusWind',
    },
    set2: '繁星竞技场'
  },
};

const buffNsKey = Buff.getKey(baseData.name, '战技', '地狱变');
class BuffDYB extends Buff {
  static info() {
    return {
      name: '地狱变',
      short: '地狱变',
      source: '战技',
      desc:'强化普攻，伤害提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusAll'],
    };
  }
  init() {
    const m = this.member;
    if(m.checkES('吞忍百死')) {
      this.listen({e:'C_DMG_E', t:'self', f:(buff, unit, data)=>{
        if(!D.checkType(data.type, 'NA'))return;
        for(let i=0;i<data.targets.length;i++) {
          if(data.targets[i].findBuff({tag:'破韧'})) {
            m.triggerHeal([m], m.getAttr('hp')*0.05 + 100);
          }
        }
      }})
    }
  }
  getDesc() {
    return `强化普攻，伤害提高${this.member.skillData.ns.bonusAll}%${this.member.checkSoul(2)?'，暴击率提高15%':''}。`
  }
  getAttributes() {
    return {
      bonusAll: this.member.skillData.ns.bonusAll,
      criRate: this.member.checkSoul(2)? 15: 0,
    }
  }
}
class BuffHealBonus extends Buff {
  static info() {
    return {
      name: '无尽形寿',
      short: '无尽形寿',
      source: '天赋',
      desc:'生命低时受到治疗提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributes() {
    return this.member.checkHp(50)? {healBonus: 20}: {};
  }
}
class BuffPsListener extends Buff {
  static info() {
    return {
      name: '监听天赋',
      short: '监听器',
      source: '天赋',
      desc:'监听天赋',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    this.listen({e:'ACT_E', t:'all', f:(buff, unit, data)=>{
      this.member.castPS();
    }});
    this.listen({e:'C_DMG_E', t:'all', f:(buff, unit, data)=>{
      if(D.checkType(data.type, 'AA')) this.member.castPS();
    }});
  }
}

class SsrBlade extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffDYB, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffPsListener),
    ];
    if(this.checkES('无尽形寿')){
      list.push(Buff.getListJson(this, BuffHealBonus));
    }
    if(this.checkES('坏劫隳亡')){
      list.push(Buff.getListJson(this, BuffBonus, [Buff.eventListener('C_DMG_E', 'self')], '', {
        type:'AA', bonusAA: 20, name: '坏劫隳亡', source: '天赋', maxValue: 1, hide: true,
      }));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffHpRate, [], '', {
        hpRate: 20, name: '生命上限', source: '星魂', maxValue: 2,
      }));
    }
    return list;
  }
  getStateExText() {
    return `充能:${this.state.psCount || 0}`;
  }
  getStateExData() {
    return this.state.psCount || 0;
  }
  updateReport(enemy){
    const hpMax = this.getAttr('hp');
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getDefendReport(this, enemy),
        {
          type:'heal', name:'自主回血', labels: ['被动回血', '天赋回血'],
          heal0: C.calHealData(hpMax*0.05+100, this, this),
          heal1: C.calHealData(hpMax*0.25, this, this),
        },
        ...R.getActionReport(this),
        ...R.getEnergyReport(this, {others:[['追加攻击', 10]]}),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    const buff = this.findBuff({key:buffNsKey});
    if(!buff)return super.castNA(target);
    const hits = this.base.naHits;
    this.costHp(10);
    this.actionAttack(cb=>cb(), 'NA', target, 'diff', 30, this.getRawDmg(2, 'na', 0, 1), hits, [0,1]);
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target: this, keepTurn:true}, ()=>{
      this.costHp(30);
      this.addBuff(buffNsKey, this, 1, { count: 3 });
    });
  }
  checkDisableNS() {
    return super.checkDisableNS() || this.findBuff({key:buffNsKey})!==null;
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      const hpMax = this.getAttr('hp');
      const change = hpMax * 0.5 - this.state.hp;
      this.changeHp(change, this, 'cost');
      if(change<0){
        this.team.logger.logDamage(null, this, change, 0, 'COST');
      }else{
        this.team.logger.logHeal(this, this, change);
      }
      const costedHp = Math.min(hpMax*0.9, this.state.costedHp);
      const hits = this.base.usHits;
      A.triggerAttack({ type:'US', member:this, target, atkType:'diff', hits, diffHits: hits }, ()=>A.simpleDmg(this.base.type, 5, this.getRawDmg(2, 'us', costedHp, 2)));
      this.state.costedHp = 0;
    })
  }
  castSP() {
    super.castSP(()=>{
      this.costHp(20);
      A.startBattleDmg(this, 2, this.rawFuncRate(0, 40, 'hp'));
    });
  }
  addPsCount() {
    this.state.psCount = (this.state.psCount || 0) + 1;
  }
  castPS() {
    const bonus = this.checkSoul(6);
    if((this.state.psCount || 0) < (bonus?4:5)) return;
    this.state.psCount = 0;
    if(this.checkES('坏劫隳亡'))this.addBuff(Buff.getKey(this.name, '天赋', '坏劫隳亡'), this, 1);
    this.castAdditionAttack('enemies', 'all', 10, this.getRawDmg(1, 'ps', 0), this.base.psHits);
    this.triggerHeal([this], this.getAttr('hp')*0.25);
  }
  getDmgInfo(key, ch, isDiff=true, ba = null, bh = null) {
    ba = ba || this.getAttr('atk')*0.01;
    bh = bh || this.getAttr('hp')*0.01;
    const xs = this.skillData[key];
    const bonus = this.checkSoul(1)? 150: 0;
    return isDiff? { dmgC: ba*xs.rateAC+bh*xs.rateHC + ch*0.01*(xs.rateHC+bonus), dmgD: ba*xs.rateAD + bh*xs.rateHD + ch*0.01*xs.rateHD}:
      { dmg: ba*xs.rateA + bh*(xs.rateH + (this.checkSoul(6)? 50: 0))};
  }
  getRawDmg(brkDmg, key, ch, brkDmgD) {
    return (i)=>{
      const { dmg, dmgC, dmgD } = this.getDmgInfo(key, ch, brkDmgD? true: false);
      //console.log(dmg, dmgC, dmgD)
      return {brkDmg:(brkDmgD && i>0)? brkDmgD: brkDmg, raw: brkDmgD? (i===0? dmgC: dmgD) :dmg };
    }
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='HP_CHANGE') {
      const hp = this.state.hp;
      if(data.change < 0 && hp > 0) {
        const x = this.getAttr('hp')*0.5;
        if(this.checkSoul(4) && hp<x && hp-data.change>x) this.addBuff(Buff.getKey(this.name, '星魂', '生命上限'), this, 1);
        this.state.costedHp = (this.state.costedHp || 0) - data.change;
        if(data.source!=='damage') {
          this.addPsCount();
        }
      }
    } else if(e==='B_DMG_E') {
      this.addPsCount();
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const aaPlus = this.checkES('坏劫隳亡') && !this.findBuff({key:Buff.getKey(this.name, '天赋', '坏劫隳亡')});
    const naTypes = [ 'Wind', 'NA' ];
    const usTypes = [ 'Wind', 'US' ];
    const buff = this.findBuff({key:buffNsKey});
    const hpMax = this.getAttr('hp');

    const ba = this.getAttr('atk')*0.01;
    const bh = this.getAttr('hp')*0.01;
    const na = this.getDmgInfo('na', 0, true, ba, bh);
    const usA = this.getDmgInfo('us', 0, true, ba, bh);
    const usB = this.getDmgInfo('us', hpMax*0.9, true, ba, bh);
    const ps = this.getDmgInfo('ps', 0, false, ba, bh);

    const brkDmg = C.calBrkDmg(this, enemy, 1)

    let list = buff?[
      Object.assign({ type: 'damage', tip:'消耗生命'+Math.floor(hpMax*0.1), name:'强化普攻[中心]', brkDmg: brkDmg*2}, C.calDmg(na.dmgC, naTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'强化普攻[扩散]', brkDmg }, C.calDmg(na.dmgD, naTypes, this, enemy)),
    ]:[Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(this.getBaseDmg('na'),  naTypes, this, enemy))];
    list = list.concat([
      Object.assign({ type: 'damage', tip:'完全未掉血', name:'终结技[中心]', brkDmg: brkDmg*2 }, C.calDmg(usA.dmgC, usTypes, this, enemy)),
      Object.assign({ type: 'damage', tip:'完全未掉血', name:'终结技[扩散]', brkDmg: brkDmg*2 }, C.calDmg(usA.dmgD, usTypes, this, enemy)),
      Object.assign({ type: 'damage', tip:'累计掉血超90%', name:'终结技[中心]', brkDmg: brkDmg*2 }, C.calDmg(usB.dmgC, usTypes, this, enemy)),
      Object.assign({ type: 'damage', tip:'累计掉血超90%', name:'终结技[扩散]', brkDmg: brkDmg*2 }, C.calDmg(usB.dmgD, usTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'追加伤害', brkDmg }, C.calDmg(ps.dmg, [ 'Wind', 'AA' ], this, enemy, null, { bonus: aaPlus? 20: 0 })),
      Object.assign({ type: 'damage', name:'秘技伤害', brkDmg: 2}, C.calDmg(bh*40, ['Wind', 'SP'], this, enemy)),
    ]);
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrBlade,
};