'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffAtkRate, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '青雀',
  image: 'qingque.jpg',
  rarity: 'SR',
  job: '智识',
  type: 'Quantum',
  damages: ['NA','US'],
  hp: D.levelData['139_1023'],
  atk: D.levelData['88_652'],
  def: D.levelData['60_441'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 140,
  na: D.makeTable([
    ['rate', 'ratePlus', 'rateDiff'],
    [ 50, 120, 50],
    [ 60, 144, 60],
    [ 70, 168, 70],
    [ 80, 192, 80],
    [ 90, 216, 90],
    [100, 240, 100],
    [110, 264, 110],
  ]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['bonusAll'],[14], [15], [16], [18], [19], [21], [22], [24], [26], [28], [29], [30]]),
  nsTarget: 'self',
  nsSoul: 5,
  ps: D.makeTable([['atkRate'],[36], [39], [43], [46], [50], [54], [58], [63], [67], [72], [75], [79]]),
  psSoul: 3,
  us: D.makeTable([['rate'],[120], [128], [136], [144], [152], [160], [170],[180], [190], [200], [208], [216]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 3,
  es: [ '争番', '听牌', '抢杠' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { bonusQuantum: 3.2 }, { bonusQuantum: 4.8 }, { bonusQuantum: 6.4 }, { defRate: 5.0 }, { defRate: 7.5 },
  ],
  defaultJson: {
    weapon:'今日亦是和平的一日', name4: '繁星璀璨的天才', name2: '繁星竞技场',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusQuantum',
  },
  aiConditions: [{value:'c_qingqueP',text:'牌型'},{value:'c_qingqueN', text:'战技层数'}],
  ai:{
    na: ai.na_default,
    ns:{
      disable:false,
      rules:[
        [{t:"en",v:["t","absolute","eqm",0]}],
        [{t:"sp",v:["gt",3]}],
        [{t:"c_qingqueP",v:["gt","1+1"]},{t:"sp",v:["gt",2]}],
        [{t:"c_qingqueP",v:["gt","2+1"]},{t:"sp",v:["gt",1]}],
        [{t:"c_qingqueP",v:["gt","2+1+1"]}],
        [{t:"c_qingqueN",v:["gt",1]}],
      ]
    },
    us:{
      disable:false,
      rules:[
        [{t:"sp",v:["eq",0]},{t:"c_qingqueN",v:["gt",0]}],
        [{t:"buff",v:["s","key","青雀$天赋$暗杠.","yes",0]},{t:"c_qingqueN",v:["gt",0]}]
      ]
    }
  },
  equipSetting: {
    rule: 'dmgNA',
    main: {
      foot: 'speed',
      link: 'atkRate',
      ball: 'bonusQuantum',
    },
    set2: '繁星竞技场'
  },
};

const LA = ['一豆', '两豆', '三豆', '四豆'];
const LB = ['两豆', '三豆', '四豆', '五豆'];
const rateReports = D.makeTable([
  ['name', 'labels', 'hit0', 'hit1', 'hit2', 'hit3'],
  ['0', LB, 3.70, 30.04, 64.79, 83.89],
  ['1', LB, 13.58, 49.25, 76.07, 89.21],
  ['1+1', LB, 23.46, 61.04, 82.14, 92.00],
  ['1+1+1', LB, 33.33, 67.90, 85.46, 93.51],
  ['2', LA, 11.11, 43.21, 72.29, 87.41],
  ['2+1', LA, 11.11, 49.38, 76.27, 89.32],
  ['2+2', LA, 22.22, 61.73, 82.58, 92.21],
  ['2+1+1', LA, 11.11, 53.09, 78.33, 90.28],
  ['3+n', LA, 55.56, 80.25, 91.22, 96.10],
]).map(obj => Object.assign({type:'hit',tip:'胡牌概率'}, obj));

const buffPsKey = Buff.getKey(baseData.name, '天赋', '暗杠');
const buffBQRKey = Buff.getKey(baseData.name, '星魂', '不求人');

class BuffPickCard extends Buff {
  static info() {
    return {
      name: '抽牌',
      short: '抽牌',
      source: '天赋',
      desc: '',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: [],
    }
  }
  init() {
    this.listen({ e: 'TURN_S', t:'members', f: ()=> {
      this.member.pickCard(1)
    }});
  }
}

class BuffBQR extends Buff {
  static info() {
    return {
      name: '不求人',
      short: '追击',
      source: '星魂',
      desc: '普攻后进行一次追加攻击',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff'],
    }
  }
  init() {
    this.listen({ e: 'C_DMG_E', t:'self', f: (buff, unit, data)=>{
      const m = this.member;
      if(!D.checkType(data.type,'NA')) return;
      const isPlus = data.options && data.options.isPlus;
      if(isPlus) {
        m.castAdditionAttack(data.targets[0], 'diff', 15, m.rawDiffFunc(2, 1, 'na', 'ratePlus', 'rateDiff'), baseData.naHits, baseData.naHits );
      } else {
        m.castAdditionAttack(data.targets[0], 'single', 10, m.rawFunc(1, 'na', 'rate'), baseData.naHits );
      }
    }});
  }
}

class SrQingque extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkSoul(1)) list.push({bonusUS:10});
    return list;
  }
  getCharacterBuffList(){
    const { ns, ps } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffPickCard, []),
      Buff.getListJson(this, BuffAtkRate, [Buff.damageListener('C_ATK_E', ['NA'])], '', {
        atkRate: ps.atkRate, name: '暗杠', source: '天赋', maxValue: 1,
      }),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener(false)], '', {
        bonusAll: ns.bonusAll + (this.checkES('听牌')? 10 : 0),
        name: '海底捞月', source:'战技', maxValue: 4,
      }),
    ];
    if(this.checkES('抢杠')) list.push(Buff.getListJson(this, BuffSpeedRate, [], '', {
      speedRate: 10, name: '抢杠', source:'普攻', maxValue: 1,
    }));
    if(this.checkSoul(4)) list.push(Buff.getListJson(this, BuffBQR, [Buff.simpleListener(false)]));
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...this.getEnergyReport(),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
        ...this.getRateReport(),
      ]
    }
    return report;
  }
  getStateExText() {
    const cards = this.state.cards || [0,0,0];
    const text = 'A'.repeat(cards[0]) + 'B'.repeat(cards[1]) + 'C'.repeat(cards[2]);
    return text===''? '未抽牌':text;
  }
  getStateExData(key) {
    if(key==='value') {
      const buff = this.findBuff({key:Buff.getKey(this.name, '战技', '海底捞月')});
      return buff? buff.value: 0;
    }
    const cards = this.state.cards;
    if(!cards) return { type:'0', value };
    const sCards = [...cards].filter((a)=>a>0).sort((a,b)=>b-a);
    if(sCards[0]===3) return '3+n';
    return sCards.join('+');
  }
  castNA(target) {
    if(this.checkCards()) {
      this.state.cards = [0, 0, 0];
      this.actionAttack(cb => cb(),'NA', target, 'diff', 30, this.rawDiffFunc(2, 1, 'na', 'ratePlus', 'rateDiff'), baseData.naHits, baseData.naHits, { isPlus: true});
      if(this.checkES('抢杠'))this.addBuff(Buff.getKey(this.name, '普攻', '抢杠'), this, 1);
      if(this.checkSoul(6))this.changeSp(1);
    } else {
      this.actionAttack(cb => cb(),'NA', target, 'single', 20, this.rawFunc(1, 'na'), baseData.naHits);
      this.changeSp(1);
      this.throwCard();
    }
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target:this, keepTurn: true}, ()=>{
      if(!this.state.firstNS && this.checkES('争番')) {
        this.state.firstNS = true;
        this.changeSp(1);
      }
      this.addBuff(Buff.getKey(this.name, '战技', '海底捞月'), target, 1);
      this.pickCard(2);
      if(this.checkSoul(4) && Math.random()<0.24)this.addBuff(buffBQRKey, this, 1);
    });
  }
  checkDisableNS() { return super.checkDisableNS() || this.checkCards();}
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>cb(), 'US', 'enemies', 'all', 5, this.rawFunc(2, 'us'), this.base.usHits);
    this.pickCard(99999, false);
  }
  castSP() {
    this.changeSp(-1);
    this.state.spelledSP = true;
  }
  onEvent(e, unit, data) {
    if(e==='BTL_S' && unit===this && this.state.spelledSP) {
      this.pickCard(2);
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk') * 0.01;
    const { na, us } = this.skillData;
    const isPlus = this.findBuff({key:buffPsKey})!==null;
    const hasBQR = this.checkSoul(4) && this.findBuff({key: buffBQRKey});

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const damages = isPlus ? [
      Object.assign({ type: 'damage', name: '强化普攻[中心]', brkDmg: brkDmg*2 }, C.calDmg(base*na.ratePlus, ['Quantum', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name: '强化普攻[扩散]', brkDmg }, C.calDmg(base*na.rateDiff, ['Quantum', 'NA'], this, enemy)),
    ]:[ Object.assign({ type: 'damage', name: '普攻', brkDmg }, C.calDmg(base*na.rate, ['Quantum', 'NA'], this, enemy)) ];
    if(hasBQR) {
      if(isPlus) {
        damages.push(Object.assign({ type: 'damage', name: '不求人[中心]', brkDmg: brkDmg*2}, C.calDmg(base * na.ratePlus, ['Quantum', 'AA'], this, enemy)));
        damages.push(Object.assign({ type: 'damage', name: '不求人[扩散]', brkDmg}, C.calDmg(base * na.rateDiff, ['Quantum', 'AA'], this, enemy)));
      } else {
        damages.push(Object.assign({ type: 'damage', name: '不求人[追击]', brkDmg}, C.calDmg(base * na.rate, ['Quantum', 'AA'], this, enemy)));
      }
    }
    damages.push(
      Object.assign({ type: 'damage', name: '终结技', brkDmg: brkDmg*2}, C.calDmg(base * us.rate, ['Quantum', 'US'], this, enemy)),
      R.getBreakReport(this, enemy)
    );
    return damages;
  }
  getRateReport() {
    
    const list = [];
    if(this.checkSoul(4)) {
      list.push(Object.assign({type: 'hit', name: '不求人', tip:'触发概率', labels: LA, hit0: 24, hit1: 42.24, hit2:56.10, hit3:66.64 }))
    }
    return list.concat(rateReports);
  }
  getEnergyReport(){
    const list = [{
      type:'energy',
      name:'行动回能',
      labels: ['普攻', '强化普攻', '终结技'],
      en0: C.calEnergy(20, this),
      en1: C.calEnergy(30, this),
      en2: C.calEnergy(5, this),
    }]
    list.push(...R.getEnergyReport(this, {ignoreAction:true}));
    if(this.checkSoul(2)){
      list.push({
        type:'energy', name:'抽牌回能', labels:['抽牌时'],
        en0: C.calEnergy(1, this),
      })
    }
    return list;
  }
  // 是否胡牌
  checkCards() {
    if(!this.state.cards) return false;
    return Math.max(...this.state.cards) >=4;
  }
  // 扔牌
  throwCard() {
    const cards = this.state.cards;
    let min = 4;
    let idx = 0;
    cards.forEach((count, index) => {
      if(count> 0 && count<min) {
        min = count;
        idx = index;
      }
    })
    if(cards[idx] > 0) cards[idx]--;
  }
  // 抽牌
  pickCard(count, normal = true) {
    if(this.checkCards()) return true;
    const cards = this.state.cards || [0,0,0];
    const total = cards[0]+cards[1]+cards[2];
    const idx = Math.floor(Math.random()*3);
    if(total<4) {
      cards[idx]++;
    } else if(cards[idx] > 0 && cards[idx]<4){
      let minIdx = -1, min = 4, maxIdx=-1, max=0;
      for(let i=0;i<3;i++) {
        if(i===idx)continue;
        if(cards[i]<min) {
          min = cards[i];
          minIdx = i;
        }
        if(cards[i]>max) {
          max = cards[i];
          maxIdx = i;
        }
      }
      if(min === 1) {
        cards[idx]++; cards[minIdx]--;
      } else if(max<3) {
        cards[idx]++; cards[maxIdx]--;
      }
    }
    if(normal && this.team.state.inBattle && this.checkSoul(2)) this.addEn(1);
    this.state.cards = cards;
    if(cards[idx]>=4){
      this.addBuff(buffPsKey, this, 1);
      return true;
    }
    if(count>1) return this.pickCard(count-1, false);
    return false;
  }
}

module.exports = {
  data: baseData,
  character: SrQingque,
};