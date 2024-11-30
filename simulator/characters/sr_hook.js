'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { DebuffDot } = require('../debuff_simple');
const { BuffDamage } = require('../buff_simple');

const baseData = {
  name: '虎克',
  image: 'hook.jpg',
  rarity: 'SR',
  job: '毁灭',
  type: 'Fire',
  hp: D.levelData['182_1340'],
  atk: D.levelData['84_617'],
  def: D.levelData['48_352'],
  speed: 94,
  criRate: 5,
  criDamage: 50,
  hate: 125,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['rate', 'rateDot', 'ratePlus', 'rateDiff'],
    [ 120, 25, 140, 40 ],
    [ 132, 27, 154, 44 ],
    [ 144, 30, 168, 48 ],
    [ 156, 32, 182, 52 ],
    [ 168, 35, 196, 56 ],
    [ 180, 38, 210, 60 ],
    [ 195, 43, 227, 65 ],
    [ 210, 50, 245, 70 ],
    [ 225, 57, 262, 75 ],
    [ 240, 65, 280, 80 ],
    [ 252, 68, 294, 84 ],
    [ 264, 71, 308, 88 ],
  ]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 3,
  ps: D.makeTable([['rate'],[50], [55], [60], [65], [70], [75], [81], [87], [93], [100],[105],[110]]),
  psSoul: 5,
  us: D.makeTable([['rate'],[240], [256], [272], [288], [304], [320], [340],[360], [380], [400], [416], [432]]),
  usTarget: 'enemy',
  usHits: [0.3, 0.7], 
  usSoul: 5,
  es: [ '童真', '无邪', '玩火' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 8.0 }, { criDamage: 5.3 }, { criDamage: 8.0 },
  ],
  defaultJson: {
    weapon:'汪！散步时间！', name4: '熔岩锻铸的火匠', name2: '繁星竞技场',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusFire',
  },
  aiConditions: [{value:'c_hook',text:'战技状态'}],
  equipSetting: {
    rule: 'dmgNS',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusFire',
    },
    set2: '繁星竞技场'
  },
};

const BuffNSDotKey = Buff.getKey(baseData.name, '战技', '战技[灼烧]')

class BuffDamageFire extends Buff {
  static info() {
    return {
      name: '灼烧增伤',
      short: '增伤',
      source: '星魂',
      desc: '伤害提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(enemy) {
    return enemy.findBuff({ tag:'灼烧' })?  { bonusAll: 20 } : {};
  }
}

class SrHook extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('无邪')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', this.getDotData(false)),
      Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', this.getDotData(true)),
    ];
    if(this.checkSoul(1)){
      list.push(Buff.getListJson(this, BuffDamage, [Buff.eventListener('ACT_E','self')], '', {
        bonusAll: 20,
        name: '1魂战技强化', source: '星魂', hide:true,
        target: 'self', maxValue: 1,
      }))
    }
    if(this.checkSoul(6))list.push(Buff.getListJson(this, BuffDamageFire, []));
    return list;
  }
  updateReport(enemy){
    const isBurning = enemy.findBuff({ tag: '灼烧' }) !== null;
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, isBurning),
        ...this.getActionReport(),
        ...this.getEnergyReport(),
        ...this.getDefendReport(isBurning, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return this.state.nsPlus? '战技已强化' : '战技未强化';
  }
  getStateExData() {
    return this.state.nsPlus? 'yes': 'no';
  }
  castNS(target) {
    super.castNS(target);
    const hits = baseData.nsHits;
    if(this.state.nsPlus) {
      this.actionAttack(cb=>{
        this.state.nsPlus = false;
        if(this.checkSoul(1))this.addBuff(Buff.getKey(this.name, '星魂', '1魂战技强化'), this, 1, null, false, true);
        cb();
      }, 'NS', target, 'diff', 30, this.rawDiffFunc(2,1,'ns','ratePlus','rateDiff'), hits, hits);
    } else {
      this.actionAttack(cb=>cb(), 'NS', target, 'single', 30, this.rawFunc(2, 'ns'), hits);
    }
  }
  castSP() {
    super.castSP(()=>{
      const enemies = this.team.getAliveUnits('enemies');
      const dotKey = Buff.getKey(this.name, '秘技', '秘技[灼烧]');
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 50), 'single', D.sample(enemies));
      enemies.forEach(e => this.addBuffRandom(dotKey, e, 1, { count:3 }, 1, 1, false, true));
    });
  }
  castUS(target) {
    super.castUS(target);
    this.actionAttack(cb=>cb(), 'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);

    if(e==='C_DMG_E') {
      const targets = data.targets;
      if(D.checkType(data.type,'NS')) { // 添加灼烧效果
        this.addBuffRandom(BuffNSDotKey, targets[0], 1, {count: this.checkSoul(2)? 3: 2}, 1, 1, false, true);
      }
      targets.forEach((t,i) => this.triggerPS(t, i));
    } else if(e==='C_ATK_E' && D.checkType(data.type,'US')) {
      this.state.nsPlus = true;
      if(this.checkES('玩火')) {
        this.changeWaitTime(-20);
        this.addEn(5);
      }
    }
    super.onEvent(e, unit, data);
  }
  
  // 响应天赋
  triggerPS(target, idx) {
    if(target.state.hp<=0) return;
    const isBurning = target.findBuff({ tag: '灼烧' }) !== null;
    if(!isBurning)return;
    if(idx===0 && this.checkSoul(4)) {
      const targets = A.getTargets(this, 'diff',target);
      if(targets[1])this.addBuffRandom(BuffNSDotKey, targets[1], 1, {count: 3}, 1, 1, false, true);
      if(targets[2])this.addBuffRandom(BuffNSDotKey, targets[2], 1, {count: 3}, 1, 1, false, true);
    }
    A.newAddDmg(this, this, [target], this.getBaseDmg('ps'));
    this.addEn(5);
    if(idx===0 && this.checkES('童真')) {
      this.triggerHeal([this], this.getAttr('hp')*0.05);
    }
  }
  // 获取角色伤害报告数据
  getDamageReport(enemy, isBurning) {
    const base = this.getAttr('atk') * 0.01;
    const { na, ns, us, ps } = this.skillData;
    const nsBonus = this.checkSoul(1) ? 20 : 0;
    const bonusFix = (this.checkSoul(6) && !isBurning) ? 20 : 0;
    const dotDamage = C.calDmg(base, ['Fire', 'DOT'], this, enemy, {simpleMode:true}, {bonus: bonusFix});
    const turn = this.checkSoul(2) ? 3 : 2;
    
    const brkDmg = C.calBrkDmg(this, enemy, 1)
    return [
      Object.assign({ type: 'damage', name: '普通攻击', brkDmg }, C.calDmg(base * na.rate, ['Fire', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rate, ['Fire', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技[强化]', brkDmg: brkDmg*2 }, C.calDmg(base * ns.ratePlus,['Fire', 'NS'], this, enemy, null, { bonus: nsBonus })),
      Object.assign({ type: 'damage', name:'战技[扩散]', brkDmg }, C.calDmg(base * ns.rateDiff, ['Fire', 'NS'], this, enemy, null, { bonus: nsBonus })),
      {
        type: 'dot', name:'战技[灼烧]',
        damage: dotDamage * ns.rateDot,
        turn,
        totalDamage: dotDamage * ns.rateDot * turn,
        hitRate: C.calHitRate(1, this, enemy, 2, false, true),
      },
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3 }, C.calDmg(base * us.rate, ['Fire', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'天赋[追伤]'}, C.calDmg(base * ps.rate, ['Fire', 'AD'], this, enemy, null, { bonus: bonusFix })),
      Object.assign({ type: 'damage', name:'秘技', brkDmg }, C.calDmg(base * 50, ['Fire', 'SP'], this, enemy)),
      {
        type: 'dot', name:'秘技[灼烧]',
        damage: dotDamage * 50,
        turn: 3,
        totalDamage: dotDamage * 50 * 3,
        hitRate: C.calHitRate(1, this, enemy, 1, false, true),
      },
      R.getBreakReport(this, enemy),
    ];
  }
  // 获取基础的行动数据报告
  getActionReport() {
    const list = R.getActionReport(this);
    if(this.checkES('玩火')) {
      const wait = C.calActionTime(this.getAttr('speed'), 20.0);
      list.push({ type:'action', name:'终结技后', wait });
    }
    return list;
  }
  // 获取基本的能量数据报告
  getEnergyReport() {
    const res = C.calEnergy(5, this);
    const usBonus = this.checkES('玩火')? 5: 0;
    const list = R.getEnergyReport(this, { us: 5 + usBonus })
    list.push({
      type:'energy', name:'天赋回能', labels:['三目标', '俩目标', '单目标'],
      en0: res * 3, en1: res * 2.0, en2: res,
    })
    return list;
  }
  // 获取承伤比例数据报告
  getDefendReport(isBurning, enemy) {
    const list = R.getDefendReport(this, enemy);
    if(this.checkES('无邪')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35.0) });
    }
    if(isBurning && this.checkES('童真')) {
      list.push({ type:'heal', name:'攻击回血', labels: ['治疗量'], heal0: C.calHealData(this.getAttr('hp') * 0.05, this, this) });
    }
    return list;
  }
  // 获取dot伤害数据
  getDotData(isSp) {
    const rate = isSp ? 50 : this.skillData.ns.rateDot;
    const count = (isSp || this.checkSoul(2))? 3 : 2;
    const prefix = isSp ? '秘技' : '战技';
    return {
      rate,
      count,
      baseHit: 100,
      baseAttr: 'atk',
      type: 'Fire',
      name: prefix +'[灼烧]',
      source: prefix,
      title: prefix + '[灼烧]',
    }
  }
}

module.exports = {
  data: baseData,
  character: SrHook,
};