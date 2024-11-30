'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffFreeze } = require('../debuff_simple');
const { BuffShield, BuffBlock, BuffAtkRate, BuffDefRate } = require('../buff_simple');

const baseData = {
  name: '三月七',
  image: 'march7th.jpg',
  rarity: 'SR',
  job: '存护',
  type: 'Ice',
  damages: ['AA','US'],
  hp: D.levelData['144_1058'],
  atk: D.levelData['69_511'],
  def: D.levelData['78_573'],
  speed: 101,
  criRate: 5,
  criDamage: 50,
  hate: 150,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['shieldR','shield'],[38,190],[40.38,304],[42.75,389.5],[45.13,475],[47.5,532],[49.4,589],[51.3,631.75],[53.2,674.5],[55.1,717.25],[57,760],[58.9,802.75],[60.8,845.5],[62.7,888.25],[64.6,931],[66.5,973.75]]),
  nsTarget: 'member',
  nsSoul: 5,
  ps: D.makeTable([['rate'],[50],[55],[60],[65],[70],[75],[81.25],[87.5],[93.75],[100],[105],[110],[115],[120],[125]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([['rate','adRate'],[90,30],[96,33],[102,36],[108,39],[114,42],[120,45],[127.5,48.75],[135,52.5],[142.5,56.25],[150,60],[156,63],[162,66],[168,69],[174,72],[180,75]]),
  usTarget: 'enemies',
  usHits: [0.25, 0.25, 0.25, 0.25],
  usSoul: 3,
  es: ['纯洁','加护','冰咒'],
  attributes: [
    {bonusIce: 3.2}, {bonusIce: 3.2}, {bonusIce: 4.8}, {bonusIce: 4.8}, {bonusIce: 6.4},
    {dodge: 4.0}, {dodge: 6.0}, {defRate: 5.0}, {defRate: 7.5}, {defRate: 10.0},
  ],
  defaultJson: {
    weapon:'余生的第一天', name4: '净庭教宗的圣骑士', name2: '筑城者的贝洛伯格',
    body: 'defRate', foot: 'speed', link:'enRate', ball:'defRate',
    hp:[1,0,0],def:[0,0,1],atkRate:[0,5,0]
  },
  ai: {
    na: ai.na_default,
    ns: ai.ns_buff_noT("三月七$战技$可爱即正义."),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      def:[10, 3000, 99999],
      hit:[10, 0, 50],
    },
    main: {
      body: 'hit',
      foot: 'speed',
      link: 'enRate',
      ball: 'defRate',
    },
    set4: ['净庭教宗的圣骑士', '净庭教宗的圣骑士'],
  },
};

class BuffShieldEx extends BuffShield {
  static info() {
    return {
      name: '可爱即正义',
      short: '护盾',
      source: '战技',
      desc: '获得护盾，生命值高时受击概率提高',
      show: true  ,
      maxValue: 1,
      target: 'member',
      tags: ['shield','report'],
    };
  }
  init() {
    super.init();
    if(this.member.checkSoul(6))this.listen({e:'TURN_S', t:'member', f:(buff, unit, data)=>{
      this.member.triggerHeal([unit], unit.getAttr('hp')*0.04 + 106);
    }})
  }
  getDesc() {
    const target = this.target;
    const hateText = target.checkHp(30, true)?'受击概率大幅提高。':'';
    const healText = this.member.checkSoul(6)?`每回合回复${Math.floor(C.calHealData(target.getAttr('hp')*0.04 + 106, this.member, target))}点生命值。`:'';
    return `${hateText}${healText}剩余护盾：${Math.floor(this.state.shield)}。`;
  }
  getData() {
    return C.calShieldData(this.member.getBaseHeal('ns','shield','def'), this.member, this.target);
  }
  getAttributes() {
    return this.target.checkHp(30, true)?{hateRate: 500}:{};
  }
  getReportData(target) {
    return [{
      type:'heal', name:'护盾回血', labels:['每回合'], tip: '来自三月七的护盾',
      heal0: C.calHealData(target.getAttr('hp') * 0.04 + 106, this.member, target),
    }];
  }
}
class BuffCounter extends Buff {
  static info() {
    return {
      name: '反击',
      short: '反击',
      source: '天赋',
      desc:'反击',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'B_DMG_S', t:'members', f:(buff, unit, data)=>{
      if(!buff.state.psActivated && unit.findBuff({tag:'shield'})) {
        buff.state.psActivated = true;
      }
    }});
    this.listen({e:'B_DMG_E', t:'members', f:(buff, unit, data)=>{
      if(data.idxT!==data.idxMT || !buff.state.psActivated || (m.state.spCount || 0) >= (m.checkSoul(4)? 3: 2)) return;
      m.castAdditionAttack(data.member, 'single', 10, ()=>{
        return { brkDmg: 1, raw: m.getBaseDmg('ps') + (m.checkSoul(4)?m.getAttr('def') * 0.3: 0)}
      }, baseData.psHits );
      buff.state.psActivated = false;
      m.state.spCount = (m.state.spCount || 0) + 1;
    }});
  }
}

class SrMarch7th extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffCounter),
      Buff.getListJson(this, BuffShieldEx, [Buff.simpleListener()]),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {
        baseAttr:'atk', rate:50 ,name: '冻结', source: '秘技',
      }),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {
        baseAttr:'atk', rate:this.skillData.us.adRate ,name: '冻结', source: '终结技',
      }),
    ];
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: 24, shield: 320, baseAttr: 'def',
        name: '护盾', source:'星魂', maxValue: 1, target:'member',
      }));
    }
    return list;
  }
  getStateExText() {
    const maxCount = this.checkSoul(4)? 3:2;
    return `反击:${maxCount - (this.state.spCount|| 0)}`;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDefendReport(enemy),
        ...this.getDamageReport(enemy),
        ...this.getEnergyReport(),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      if(this.checkES('纯洁')) target.removeABuff('debuff');
      const count = this.checkES('加护')?4:3;
      this.addBuff(Buff.getKey(this.name,'战技','可爱即正义'), target, 1, {count});
    });
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      const hit = this.checkES('冰咒')? 0.65: 0.5;
      let count = 0;
      this.team.getAliveUnits('enemies').forEach(e => {
        if(D.rand(C.calHitRate(hit, this, e, 4, true, false))) {
          this.addBuff(Buff.getKey(this.name, '终结技', '冻结'), e, 1);
          count++;
        }
      });
      if(count>0 && this.checkSoul(1)) this.addEn(6 * count);
    },'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      A.startBattleDmg(this);
      const freezeKey = Buff.getKey(this.name, '秘技', '冻结');
      this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(freezeKey, e, 1, { count:1 }, 1, 1, true, false));
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S' && this.checkSoul(2)) {
      const member = this.team.findUnitByFunc('members', (m, t) => m.state.hp/m.getAttr('hp') < t.state.hp/t.getAttr('hp'));
      this.addBuff(Buff.getKey(this.name, '星魂', '护盾'), member, 1, {count:3});
    } else if(e==='TURN_E') {
      this.state.spCount = 0;
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ps, us } = this.skillData;
    const aaBonus = this.checkSoul(4)? this.getAttr('def')*0.3: 0;
    const hit = this.checkES('冰咒')? 0.65: 0.5;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Ice', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'反击', brkDmg }, C.calDmg(base * ps.rate + aaBonus, ['Ice', 'AA'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate: C.calHitRate(hit, this, enemy, 1, true)}, C.calDmg(base * us.rate, ['Ice', 'US'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技[解冻]'}, C.calDmg(base * us.adRate, ['Ice', 'AD'], this, enemy)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    list.push(
      { type:'shield', name: '战技[护盾]', shield: C.calShieldData(this.getBaseHeal('ns','shield','def'), this, this)},
    );
    if(this.checkSoul(2))list.push({ type:'shield', name: '进入战斗[护盾]', shield: C.calShieldData(this.getAttr('def')*0.24+320, this, this)});
    return list;
  }
  getEnergyReport() {
    const list = R.getEnergyReport(this);
    if(this.checkSoul(1)) {
      const en = C.calEnergy(6, this);
      list.push({
        type: 'energy', name: '终结技额外回能', tip:'终结技冻结目标后触发', labels: ['单目标','俩目标','仨目标'], en0: en, en1:en*2, en2:en*3,
      })
    }
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrMarch7th,
};