'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDefendAll } = require('../debuff_simple');
const { BuffDefRate } = require('../buff_simple');

const baseData = {
  name: '砂金',
  image: 'aventurine.jpg',
  rarity: 'SSR',
  job: '存护',
  type: 'Void',
  mainAttr: 'def',
  damages: ['AA','US'],
  needAttrs: [{raw:'def', tar:['criRate'], range:[1000,4000] }],
  hp: D.levelData['163_1203'],
  atk: D.levelData['60_446'],
  def: D.levelData['89_654'],
  speed: 106,
  criRate: 5,
  criDamage: 50,
  hate: 150,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['shieldR','shield'],[16,80],[17,128],[18,164],[19,200],[20,224],[20.8,248],[21.6,266],[22.4,284],[23.2,302],[24,320],[24.8,338],[25.6,356],[26.4,374],[27.2,392],[28,410]]),
  nsTarget: 'members',
  nsSoul: 5,
  ps: D.makeTable([["rate","dodge"],[12.5,25],[13.75,27.5],[15,30],[16.25,32.5],[17.5,35],[18.75,37.5],[20.31,40.62],[21.88,43.75],[23.44,46.88],[25,50],[26.25,52.5],[27.5,55],[28.75,57.5],[30,60],[31.25,62.5]]),
  psSoul: 5,
  us: D.makeTable([["rate","criDamage"],[162,9],[172.8,9.6],[183.6,10.2],[194.4,10.8],[205.2,11.4],[216,12],[229.5,12.75],[243,13.5],[256.5,14.25],[270,15],[280.8,15.6],[291.6,16.2],[302.4,16.8],[313.2,17.4],[324,18]]),
  usHits: [1],
  usTarget: 'enemy',
  usSoul: 3,
  es: [ '杠杆', '热手', '宾果！' ],
  attributes: [
    { defRate: 5.0 }, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 7.5 }, { defRate: 10.0 },
    { dodge: 4.0 }, { dodge: 6.0 }, { bonusVoid: 3.2 }, { bonusVoid: 4.8 }, { bonusVoid: 6.4 },
  ],
  defaultJson: {
    weapon:'命运从未公平', name4: '净庭教宗的圣骑士', name2: '停转的萨尔索图',
    body: 'criDamage', foot: 'defRate', link:'defRate', ball:'defRate',
    hp:[0,0,1],defRate:[0,3,2]
  },
  ai:{
    na: ai.na_default,
    ns: {
      disable:false,
      rules:[[{t:"target",v:["selected"]},{t:"buff",v:["t","tag","持有护盾","eq",0]}]]
    },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgAA',
    attrs: {
      def:[10, 3000, 4000],
    },
    main: {
      body: null,
      foot: 'defRate',
      link: 'defRate',
      ball: 'defRate',
    },
    set2: '停转的萨尔索图'
  },
};
const buffNsKey = Buff.getKey(baseData.name, '战技', '坚垣筹码');
class DebuffCry extends Buff {
  static info() {
    return {
      name: '惊惶',
      short: '惊惶',
      source: '终结技',
      desc: '受到攻击时攻击者爆伤提高',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags:  ['debuff', '惊惶', 'removable'],
    }
  }
  getDesc() {
    return `队伍成员击中该目标时造成的暴击伤害提高${D.toPercent(this.data.criDamage)}。`;
  }
}
class BuffCriDamage extends Buff {
  static info() {
    return {
      name: '惊惶(暴伤)',
      short: '暴伤',
      source: '终结技',
      desc: '击中惊惶状态下的目标时暴伤提高',
      show: false,
      maxValue: 0,
      target: 'members',
      tags:  [],
    }
  }
  getAttributesT(enemy) {
    const buff = enemy.findBuff({ tag: '惊惶' });
    return buff? { criDamage: buff.data.criDamage}: {};
  }
}
class BuffShield extends Buff {
  static info(data) {
    const tags = data.criDamage? ['buff','dodge','shield','暴伤']: ['buff','dodge','shield'];
    return {
      name: '坚垣筹码',
      short: '护盾',
      source: '战技',
      desc: '获得护盾及效果抵抗',
      show: true,
      maxValue: 1,
      target: 'member',
      tags,
    }
  }
  getDesc() {
    return `${this.member.checkSoul(1)?'暴伤提高20%，':''}抵抗提高${D.toPercent(this.data.dodge)},剩余护盾：${Math.floor(this.state.shield)}。`;
  }
  init() {
    const m = this.member;
    this.state.shield = this.getShield(this.state.spCount);
    this.listen({ e: 'B_HIT_S', t:'member', f: (buff, unit, data)=>{
      const { damage, blocked } = data;
      const b = Math.min(damage, buff.state.shield);
      data.blocked = Math.max(b, blocked || 0);
      buff.state.shield -= b;
      if(buff.state.shield <= 0) {
        buff.state.count = 0;
      }
      m.addPsCount(this.target===m? 2: 1);
    }})
    if(m.checkES('宾果！')) {
      this.listen({ e: 'C_DMG_E', t:'member', f: (buff, unit, data)=>{
        if(unit===m || m.state.bingoCount>=3 || !D.checkType(data.type, 'AA')) return;
        m.state.bingoCount ++;
        m.addPsCount(1);
      }})
    }
  }
  getAttributes() {
    return {
      dodge: this.data.dodge,
      criDamage: this.member.checkSoul(1)? 20: 0,
    }
  }
  blockDebuff(member, target, info) {
    const m = this.member;
    return m===target && info.tags.includes('控制') && m.updateCD(2, 'blockDebuff', false, true); 
  }
  getShield(spCount = 0) {
    const base = this.member.getAttr('def');
    const { shieldR, shield } = spCount? { shieldR: 7.2*spCount, shield: 96*spCount }: this.data;
    return C.calShieldData(base * shieldR * 0.01 + shield, this.member, this.target);
  }
  stack(sameBuff) {
    this.state.shield = Math.min(this.state.shield + sameBuff.state.shield, this.getShield() * 2);
  }
}
class BuffCriRate extends Buff {
  static info() {
    return {
      name: '杠杆',
      short: '杠杆',
      source: '天赋',
      desc: '防御力高于一定值时获得额外暴击',
      show: false,
      maxValue: 0,
      target: 'self',
      tags:  [],
    }
  }
  getDesc(target) {
    if(!this.lastTransAttr[target.name]) return super.getDesc();
    return `暴击提高${D.toPercent(this.lastTransAttr[target.name].criRate)}。`;
  }
  getTransAttr() {
    return {
      criRate: { raw:'def', min: 1600, step: 100, rate:2, max: 48 }
    };
  }
}
class BuffSP extends Buff {
  static info(data) {
    return {
      name: '防御力提高·' + data.level,
      short: '加防',
      source: '秘技',
      desc: '防御力提高',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', '加防'],
    }
  }
  getDesc() {
    return `防御力提升${D.toPercent(this.getData() )}`;
  }
  getAttributes() { return { defRate: this.getData()}}
  getData() {
    return this.data.level === '小'? 24: (this.data.level === '中'? 36: 60);
  }
  checkSameBuff(buff) {
    return this.constructor === buff.constructor && this.target === buff.target;
  }
}
class BuffBonusAll extends Buff {
  static info() {
    return {
      name: '猎鹿游戏',
      short: '增伤',
      source: '秘技',
      desc: '根据持有护盾的队友数量获得增伤',
      show: true,
      maxValue: 0,
      target: 'self',
      tags: ['buff', '增伤'],
    }
  }
  init() {
    this.listen({e:'B_BUFF_E', t:'members', f:()=> this.markTargets()});
    this.listen({e:'B_BUFF_RM', t:'members', f:()=> this.markTargets()});
  }
  getDesc(){
    return `伤害提高${D.toPercent(this.getData())}。`;
  }
  getAttributes() {
    return { bonusAll: this.getData() }
  }
  getData(){
    let bonus = 0;
    this.member.eachUnit('members', m => {
      if(m!== this.member && m.findBuff({ tag:'shield' })) bonus += 50;
    })
    return bonus;
  }
}

class SsrAventurine extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { ns, ps, us } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: ns.shieldR, shield: ns.shield, dodge: ps.dodge, criDamage: this.checkSoul(1)? 20: 0,
      }),
      Buff.getListJson(this, DebuffCry, [Buff.simpleListener()], '', { criDamage: us.criDamage }),
      Buff.getListJson(this, BuffCriDamage, []),
      Buff.getListJson(this, BuffSP, [Buff.simpleListener()], '', { level: '小' }),
      Buff.getListJson(this, BuffSP, [Buff.simpleListener()], '', { level: '中' }),
      Buff.getListJson(this, BuffSP, [Buff.simpleListener()], '', { level: '大' }),
    ];
    if(this.checkES('杠杆')){
      list.push(Buff.getListJson(this, BuffCriRate));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, DebuffDefendAll, [Buff.simpleListener()], '', {
        defendAll: 12, name: '全抗性降低', source:'星魂', target: 'enemy', maxValue: 1,
      }))
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffDefRate, [Buff.simpleListener()], '', {
        defRate: 40, name: '防御力提高', source:'星魂', maxValue: 1
      }))
    }
    if(this.checkSoul(6)){
      list.push(Buff.getListJson(this, BuffBonusAll, []));
    }
    return list;
  }
  getStateExText() {
    return `盲注${this.state.psCount || 0} 宾果${this.state.bingoCount || 0}`;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDefendReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    super.castNA(target, 'atk', cb=>{
      if(this.checkSoul(2))this.addBuff(Buff.getKey(this.name, '星魂', '全抗性降低'),target,1,{count:3});
      cb();
    });
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target: this}, ()=>{
      this.eachUnit('members', m => this.addBuff(buffNsKey, m, 1, {count:3}));
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    const roll = Math.floor(Math.random()*7) + 1;
    this.team.logger.logInfo(roll)
    this.actionAttack(cb=>{
      this.addPsCount(roll);
      this.addBuff(Buff.getKey(this.name, '终结技', '惊惶'), target, 1, {count:3})
      cb();
      if(this.checkSoul(1)) this.eachUnit('members', m=>this.addBuff(buffNsKey, m, 1, {count:3}))
    }, 'US', target, 'single', 5, this.rawFunc(3,'us','rate', 'def'), this.base.usHits);
  }
  castSP() {
    super.changeSp(-1);
    const r = Math.random();
    const n = r<0.15? 3:(r<0.65? 2: 1);
    this.team.logger.logInfo(n === 1? '小': (n === 2? '中': '大'));
    this.state.spLevel = Math.max(this.state.spLevel || 0, n);
  }
  _onSP() {
    const level = '小中大'[this.state.spLevel - 1];
    const spKey = Buff.getKey(this.name, '秘技', '防御力提高·' + level);
    this.eachUnit('members', m => this.addBuff(spKey, m, 1, {count:3}));
  }
  addPsCount(n) {
    let count = Math.min(10, (this.state.psCount || 0) + n);
    if(count >= 7) {
      count -=7;
      const target = D.sample(this.team.getAliveUnits('enemies'));
      const rawDmg = this.rawFunc(0.3333333, 'ps', 'rate', 'def');
      if(target)this.castAdditionAttack( target, 'random', 1, rawDmg , this.checkSoul(4)? 10: 7, null, {}, cb => {
        if(this.checkSoul(4)) this.addBuff(Buff.getKey(this.name, '星魂', '防御力提高'), this, 1, {count:2});
        cb();
        if(this.checkES('宾果！')) {
          let min = -1;
          let tar = null;
          this.eachUnit('members', m => {
            const shield = m.getMaxShield();
            if(shield>min) {
              min = shield;
              tar = m;
            }
          });
          this.eachUnit('members', m => m.addBuff(buffNsKey, m, 1, {count: 3, spCount: m===tar? 2: 1}));
        }
      });
    }
    this.state.psCount = count;
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spLevel) this.onSP();
      if(this.checkES('热手')) this.eachUnit('members', m=>this.addBuff(buffNsKey, m, 1, {count:3}));
      this.state.bingoCount = 0;
      this.state.psCount = 0;
    } if(e==='TURN_S') {
      this.state.bingoCount = 0;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('def')*0.01;
    const { na, ps, us } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Void', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'追击（单次）', brkDmg:brkDmg/3, tip:`弹射${this.checkSoul(4)? 10: 7}次`}, C.calDmg(base * ps.rate, [ 'Void', 'PS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, [ 'Void', 'US' ], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    const shield = C.calShieldData(this.getBaseHeal('ns','shield','def'), this, this);
    list.push(
      { type:'shield', name: '战技[护盾]', shield},
      { type:'shield', name: '战技[护盾上限]', shield: shield * 2},
      { type:'shield', name: '宾果[护盾]', tip:'普通目标', shield: C.calShieldData(this.getAttr('def')*0.072+96, this, this)},
      { type:'shield', name: '宾果[护盾]', tip:'护盾最低目标', shield: C.calShieldData(this.getAttr('def')*0.144+192, this, this)},
    );
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrAventurine,
};