'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffAtkRate, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '飞霄',
  image: 'feixiao.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Wind',
  damages: ['US','AA'],
  hp: D.levelData['142_1047'],
  atk: D.levelData['81_601'],
  def: D.levelData['52_388'],
  speed: 112,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 0,
  na: D.makeTable([["rate"],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([["rate"],[100],[110],[120],[130],[140],[150],[162.5],[175],[187.5],[200],[210],[220],[230],[240],[250]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 5,
  ps: D.makeTable([['rate','bonusAll'],[55,30],[60.5,33],[66,36],[71.5,39],[77,42],[82.5,45],[89.38,48.75],[96.25,52.5],[103.13,56.25],[110,60],[115.5,63],[121,66],[126.5,69],[132,72],[137.5,75]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([
    ['rateA','rateB','rateC'],
    [36, 15, 96],
    [38.4, 16.5, 102.4],
    [40.8, 18, 108.8],
    [43.2, 19.5, 115.2],
    [45.6, 21, 121.6],
    [48, 22.5, 128],
    [51, 24.38, 136],
    [54, 26.25, 144],
    [57, 28.13, 152],
    [60, 30, 160],
    [62.4, 31.5, 166.4],
    [64.8, 33, 172.8],
    [67.2, 34.5, 179.2],
    [69.6, 36, 185.6],
    [72, 37.5, 192]
  ]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: [ '天通', '解形', '电举' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { criRate: 2.7 }, { criRate: 4.0 }, { criRate: 5.3 },
  ],
  defaultJson: {
    weapon:'我将，巡征追猎', name4: '风举云飞的勇烈', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusWind',
    hp:[1,0,0],atk:[1,0,0],atkRate:[0,3,2],def:[0,0,1]
  },
  equipSetting: {
    rule: 'dmgUS',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusWind',
    },
    set2: '停转的萨尔索图'
  },
  aiLabels: [['ns','战技'],['us','终结技'],['usB','钺'],['usA','刃'],['na','普攻']],
};

class BuffFeixiao extends Buff {
  static info() {
    return {
      name: '飞霄被动',
      short: '飞霄',
      source: '天赋',
      desc: '飞霄的监控用被动',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    }
  }
  init() {
    const m = this.member;
    this.listen({e:'C_ATK_E', t:'members', f:(buff, unit, data)=> {
      if(unit===m && data.options && data.options['飞霄终结技']) return;
      let pt = 1;
      if(m.state.ptBonus && D.checkType(data.type,'AA')) {
        pt += 2;
        m.state.ptBonus--;
      }
      m.addUsPoint(pt);
      if(unit!==m && !m.state['已追击']) {
        m.state['已追击'] = true;
        m.castFeixiaoAA(data.targets[0]);
      }
    }});
  }
  getAttributes() {
    return {
      throughAll: this.member.checkSoul(6)? 20: 0,
      criDmgAA: this.member.checkES('解形')? 36: 0,
    }
  }
}

class BuffBreakRate extends Buff {
  static info() {
    return {
      name: '击破效率',
      short: '击破',
      source: '终结技',
      desc: '目标弱点未被击破时飞霄的弱点击破效率提高100%。',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: [],
    }
  }
  getAttributesT(target) {
    return target.findBuff({tag:'破韧'})? {}: { breakRate: 100 };
  }
}

class BuffUsBonus extends Buff {
  static info() {
    return {
      name: '镇绥天钧',
      short: '终结技',
      source: '终结技',
      desc: '飞霄的终结技伤害额外提高',
      show: true,
      maxValue: 5,
      target: 'self',
      tags: [],
    }
  }
  getDesc() {
    return '飞霄的终结技伤害额外提高'+(this.value*10)+'%。';
  }
}

class SsrFeixiao extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffFeixiao),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.skillData.ps.bonusAll, name: '雷狩', source:'天赋', maxValue: 1
      }),
      Buff.getListJson(this, BuffBreakRate, [Buff.eventListener('ACT_E', 'self')]),
    ];
    if(this.checkES('电举')) list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', {
      atkRate: 48, name: '电举', source:'战技', maxValue: 1
    }));
    if(this.checkSoul(1)) list.push(Buff.getListJson(this, BuffUsBonus, [Buff.eventListener('ACT_E', 'self')]));
    if(this.checkSoul(4)) list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
      speedRate: 8, name: '加速', source:'星魂', maxValue: 1
    }));
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return '飞黄：'+this.getStateExData().toFixed(1)+(this.state['已追击']? '(1)': '(0)');
  }
  getStateExData() {
    return (this.state.usPt || 0)/2;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      if(this.checkES('电举')) this.addBuff(Buff.getKey(this.name, '战技', '电举'), this, 1, {count:3});
      cb();
      this.castFeixiaoAA(target);
    },'NS', target, 'single', 0, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  getBattleActions(isMyTurn) {
    if(this.checkBonusTurn()) {
      return [{
        text: '闪裂刃舞',
        key: 'usA',
        target: 'enemy',
        disable: false,
      },{
        text: '钺贯天冲',
        key: 'usB',
        target: 'enemy',
        disable: false,
      }]
    }
    return super.getBattleActions(isMyTurn);
  }
  onAction(data) {
    switch(data.key) {
      case 'usA':
        this.castUsA(true);
        break;
      case 'usB':{
        this.castUsA(false);
        break;
      }
      default:
        break;
    }
    super.onAction(data);
  }
  checkDisableUS() {
    return  !this.checkAlive() || !this.state.usPt || this.state.usPt < 12 || this.findBuff({tag:'freeze'})
  };
  castUS(target) {
    this.triggerEvent('ACT_S', {type:'US', member:this, target, options:{['飞霄终结技']: true}});
    this.startBonusTurn();
    this.state.usPt -= 12;
    this.state.usTarget = target.name;
    this.state.usAction = 0;
    this.addBuff(Buff.getKey(this.name, '终结技', '击破效率'), this, 1, {count:1});
  }
  castUsA(needBreak) {
    // 造成伤害
    const type = this.checkES('解形')? ['US','AA']:'US'
    const target = this.team.getCharacter(this.state.usTarget);
    const broken = (target.checkAlive() && !target.findBuff({tag:'破韧'}))? false: true;
    const us = this.skillData.us;
    const bonusBuff = this.findBuff({key:Buff.getKey(this.name, '终结技', '镇绥天钧')});
    const rate = (us.rateA + (needBreak===broken? us.rateB: 0)) * (bonusBuff? 1 + bonusBuff.value * 0.1: 1);

    A.triggerAttack({ type, member: this, target, atkType:'single', attrType:'Wind', en:0, hits: [1],
      rawDmg:this.rawFuncRate(0.5, rate), options:{ forceBreak: 1, ['飞霄终结技']: true }
    });
    if(this.checkSoul(1)) this.addBuff(Buff.getKey(this.name, '终结技', '镇绥天钧'), this, 1, {count:1});
    // 计数
    this.state.usAction++;
    if(this.state.usAction<6) return;
    // 处理最后的附加攻击
    A.triggerAttack({ type, member: this, target, atkType:'single', attrType:'Wind', en:0, hits: [1],
      rawDmg:this.rawFuncRate(0, us.rateC), options: { ['飞霄终结技']: true},
    });
    // 完成并结算
    this.triggerEvent('ACT_E', {type:'US', member:this, target, options:{['飞霄终结技']: true}});
    this.endBonusTurn();
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    A.startBattleDmg(this, 1, this.rawFuncRate(0, 200), 'all', 'enemies', this.base.type, [1], {fixed:{ crit: 100 }});
  }
  addUsPoint(pt) {
    //console.log('+'+pt)
    this.state.usPt =  Math.min(24, (this.state.usPt || 0) + pt);
  }
  castFeixiaoAA(target) {
    target = target.checkAlive()? target: D.sample(this.team.getAliveUnits('enemies'));
    const brkDmg = this.checkSoul(4)? 1: 0.5;
    const rate = this.skillData.ps.rate+(this.checkSoul(6)? 140: 0);
    const data = {
      type: this.checkSoul(6)?['AA','US']:'AA', target, atkType: 'single',
      en: 0, rawDmg: this.rawFuncRate(brkDmg, rate), hits:baseData.psHits, diffHits: null,
      options: {}, func: cb=>{
        this.addBuff(Buff.getKey(this.name, '天赋', '雷狩'), this, 1, { count: 2 });
        if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '星魂', '加速'), this, 1, { count: 2});
        cb();
      }
    }
    this.pushAction(data);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='TURN_S') {
      if(this.checkSoul(2)) this.state.ptBonus = 6;
      if(!this.state['已追击']) this.state.usPt ++;
      this.state['已追击'] = false;
    } else if(e==='WAVE_S') {
      if(this.state.spActivated) this.onSP();
    } else if(e==='BTL_S') {
      if(this.checkSoul(2)) this.state.ptBonus = 6;
      if(this.checkES('天通')) this.state.usPt = 6;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;

    const aaTypes = this.checkSoul(6)? ['Wind','AA','US']:['Wind','AA'];
    const usTypes = this.checkES('解形')? ['Wind','US','AA']:['Wind','US'];
    const broken = enemy.findBuff({tag:'破韧'})? true: false;
    const usBuff = this.findBuff({key:Buff.getKey(this.name, '终结技', '镇绥天钧')});
    const usBase = base * (usBuff? (1 + usBuff.value * 0.1): 1);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Wind','NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(base * ns.rate, ['Wind','NS'], this, enemy)),
      Object.assign({
        type: 'damage', name:'追击', brkDmg: this.checkSoul(4)? brkDmg: brkDmg*0.5
      }, C.calDmg(base * (ps.rate + (this.checkSoul(6)? 140: 0)), aaTypes, this, enemy)),
      Object.assign({
        type: 'damage', name:'终结技[刃]', brkDmg: broken? brkDmg*0.5: brkDmg,
      }, C.calDmg(usBase * (us.rateA + (broken? us.rateB: 0)), usTypes, this, enemy)),
      Object.assign({
        type: 'damage', name:'终结技[钺]', brkDmg: broken? brkDmg*0.5: brkDmg,
      }, C.calDmg(usBase * (us.rateA + (broken? 0: us.rateB)), usTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[终]', brkDmg: 0 }, C.calDmg(usBase * us.rateC, usTypes, this, enemy)),
      Object.assign({ type: 'damage', name:'秘技[最低]', brkDmg: brkDmg * 2}, C.calDmg(base * 200, [ 'Wind', 'SP'], this, enemy, null, { crit: 100 })),
      Object.assign({ type: 'damage', name:'秘技[最高]', brkDmg: brkDmg * 2}, C.calDmg(base * 1000, [ 'Wind', 'SP'], this, enemy, null, { crit: 100 })),
      R.getBreakReport(this, enemy)
    ];
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrFeixiao,
};