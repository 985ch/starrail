'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffAtkRate, BuffCriRate } = require('../buff_simple');

const baseData = {
  name: '黑塔',
  image: 'herta.jpg',
  rarity: 'SR',
  job: '智识',
  type: 'Ice',
  damages: ['AA','US'],
  hp: D.levelData['129_952'],
  atk: D.levelData['79_582'],
  def: D.levelData['54_396'],
  speed: 100,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['rate'],[50],[55],[60],[65],[70],[75],[81],[87],[93],[100],[105],[110]]),
  nsHits: [0.3,0.7],
  nsTarget: 'enemies',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[25],[26],[28],[29],[31],[32],[34],[36],[38],[40],[41],[43]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([['rate'],[120],[128],[136],[144],[152],[160],[170],[180],[190],[200],[208],[216]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: [ '效率', '人偶', '冰结' ],
  attributes: [
    {bonusIce: 3.2}, {bonusIce: 3.2}, {bonusIce: 4.8}, {bonusIce: 4.8}, {bonusIce: 6.4},
    {criRate: 2.7}, {criRate: 4.0}, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'「我」的诞生', name4: '密林卧雪的猎人', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusIce',
  },
  ai: {
    na: ai.na_default,
    ns: ai.ns_aoe_c,
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusIce',
    },
    set2: '停转的萨尔索图'
  },
};
class BuffHerta extends Buff {
  static info() {
    return {
      name: '黑塔',
      short: '特殊',
      source: '天赋',
      desc: '黑塔',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'HP_CHANGE', t:'enemies', f:(buff, unit, data)=>{
      if(m.state.psActivated)return;
      const hpMax = unit.getAttr('hp');
      if(data.source==='damage' && data.hp/hpMax > 0.5 && unit.state.hp/hpMax <= 0.5){
        m.castPS();
      }
    }});
  }
  getAttributesT(target) {
    const m = this.member;
    return {
      bonusNS: target.checkHp(50)? 0 : (m.checkES('效率') ? 45: 20),
      bonusUS: m.checkES('冰结') && target.findBuff({tag: '冻结'})? 20 : 0,
    }
  }
}
class SrHerta extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('人偶')) list.push({ dodgeCtrl:35 });
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffHerta),
      Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', { atkRate: 40, name:'加攻', source:'秘技', maxValue: 1}),
    ];
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffCriRate, [], '', { criRate: 3, name:'暴击', source:'星魂', maxValue: 5}));
    }
    if(this.checkSoul(6)) {
      list.push(Buff.getListJson(this, BuffAtkRate, [Buff.simpleListener()], '', { atkRate: 25, name:'加攻', source:'星魂', maxValue: 1}));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this),
        ...R.getActionReport(this),
        ...this.getDefendReport(enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNA(target) {
    const options = {};
    if(this.checkSoul(1) && target.checkHp(50)) {
      options.naPlus = true;
    }
    this.actionAttack(cb=>cb(), 'NA', target, 'single', 20, this.rawFunc(1, 'na'), this.base.naHits, null, options);
    this.changeSp(1);
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'all', 30, this.rawFunc(1, 'ns'), baseData.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>cb(),'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
    if(this.checkSoul(6)) this.addBuff(Buff.getKey(this.name, '星魂', '加攻'), this, 1)
  }
  castPS() {
    this.state.psActivated = true;
    this.castAdditionAttack('enemies', 'all', 5, this.rawFunc(0.5, 'ps'), baseData.psHits, null, { fixed:{ bonus: this.checkSoul(4)? 10: 0}, hertaAA: true });
    if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '暴击'), this, 1)
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.addBuff(Buff.getKey(this.name, '秘技', '加攻'), this, 1, {count:3});
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated)this.onSP();
    } else if(e==='C_DMG_S') {
      if(data.options.hertaAA) this.state.psActivated = false;
    } else if(e==='C_DMG_E') {
      if(data.options.naPlus) A.newAddDmg(this, this, data.targets, this.getAttr('atk')*0.4 );
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const bonusPS = this.checkSoul(4)? 10: 0;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Ice', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg}, C.calDmg(base * ns.rate, ['Ice', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2}, C.calDmg(base * us.rate, ['Ice', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'天赋[追击]', brkDmg: brkDmg/2}, C.calDmg(base * ps.rate, ['Ice', 'AA'], this, enemy, null, { bonus: bonusPS })),
      R.getBreakReport(this, enemy)
    ];
    if(this.checkSoul(1) && enemy.checkHp(50)) {
      list.splice(1,0, Object.assign({ type: 'damage', name:'普攻[追伤]'}, C.calDmg(base * 40, ['Ice', 'AD'], this, enemy)));
    }
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    if(this.checkES('人偶')) {
      list.push({ type:'dodge', name:'控制抵抗', dodge: C.calDodgeRate(this.attr.data.dodge, 35.0) });
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrHerta,
};