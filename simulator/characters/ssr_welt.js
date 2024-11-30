'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffSpeedRate, DebuffShackle, DebuffWeakAll } = require('../debuff_simple');

const baseData = {
  name: '瓦尔特',
  image: 'welt.jpg',
  rarity: 'SSR',
  job: '虚无',
  type: 'Void',
  hp: D.levelData['153_1125'],
  atk: D.levelData['84_620'],
  def: D.levelData['69_509'],
  speed: 102,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([['rate','hit'],[36,65],[39,66],[43,67],[46,68],[50,69],[54,70],[58,71],[63,72],[67,73],[72,75],[75,76],[79,77]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['rate'],[30],[33],[36],[39],[42],[45],[48],[52],[56],[60],[63],[66]]),
  psSoul: 5,
  us: D.makeTable([['rate','late'],[90,32],[96,32],[102,33],[108,34],[114,35],[120,36],[127,37],[135,38],[142,39],[150,40],[156,40],[162,41]]),
  usTarget: 'enemies',
  usHits: [0.1,0.9],
  usSoul: 5,
  es: ['惩戒','审判','裁决'],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { dodge: 4.0 }, { dodge: 6.0 }, { bonusVoid: 3.2 }, { bonusVoid: 4.8 }, { bonusVoid: 6.4 },
  ],
  defaultJson: {
    weapon:'以世界之名', name4: '盗匪荒漠的废土客', name2: '泛银河商业公司',
    body: 'hit', foot: 'speed', link:'atkRate', ball:'bonusVoid',
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_sp_gt(1),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'dmgNS',
    attrs: { hit: [100, 0, 50] },
    main: {
      foot: 'speed',
      link: 'enRate',
    },
  },
};
const debuffUSKey = Buff.getKey(baseData.name, '终结技', '拟似黑洞');
class BuffWelt extends Buff {
  static info() {
    return {
      name: '瓦尔特',
      short: '特殊',
      source: '天赋',
      desc: '瓦尔特',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    return target.findBuff({tag:'破韧'})? {bonusAll:20}: {};
  }
}

class SsrWelt extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, DebuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 10, name: '虚空断界', source: '战技',  maxValue: 1,
      }),
      Buff.getListJson(this, DebuffShackle, [Buff.freezeListener(false, true)], '', {
        speedRate: 10, name: '拟似黑洞', source: '终结技',  maxValue: 1,
      }),
    ];
    if(this.checkES('裁决')) list.push(Buff.getListJson(this, BuffWelt));
    if(this.checkES('惩戒')){
      list.push(Buff.getListJson(this, DebuffWeakAll, [Buff.simpleListener()], '', {
        weakAll: 12, name: '惩戒', source: '天赋', maxValue: 2,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const others = [];
    if(this.checkSoul(2)){
      others.push(['天赋回能', 3]);
    }
    const options = {
      ns: this.checkSoul(6)? 40: 30,
      us: 5+(this.checkES('审判')? 10: 0),
      others,
    }
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, options),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    let count = this.checkSoul(6)? 4: 3;
    this.actionAttack(cb=>cb(), 'NS', target, 'random', 10, this.rawFunc(1, 'ns'), count, null, { hitAliveOnly: true });
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      this.team.getAliveUnits('enemies').forEach(e=>{
        if(!e.findBuff({tag:'禁锢'}))e.changeWaitTime(this.skillData.us.late);
        this.addBuffRandom(debuffUSKey, e, 1, { count: 2 }, 1, 2, true);
        if(this.checkES('惩戒')) this.addBuffRandom(Buff.getKey(this.name, '天赋', '惩戒'), e, 1, { count: 2 }, 1);
      })
    }, 'US', target, 'all', 5+(this.checkES('审判')? 10: 0), this.rawFunc(2, 'us'), baseData.usHits);
    if(this.checkSoul(1))this.state.adBonusCount = 2;
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    this.team.getAliveUnits('enemies').forEach(e=> {
      e.changeWaitTime(20);
      this.addBuffRandom(debuffUSKey, e, 1, { count: 2 }, 1, 2, true);
    })
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.fieldActivated) this.onSP();
    } else if(e==='C_HIT_E') {
      const hit = this.skillData.ns.hit * 0.01 + (this.checkSoul(4)? 0.35: 0);
      if(D.checkType(data.type, ['NA','NS','US','AA']) && data.target.findBuff({tag:'减速'})) {
        A.newAddDmg(this, this, [data.target], this.getBaseDmg('ps'));
        if(this.checkSoul(2))this.addEn(3);
      }
      if(D.checkType(data.type, 'NS')) {
        this.addBuffRandom(Buff.getKey(this.name, '战技', '虚空断界'), data.target, 1, {count:2}, hit, 1, true, false);
      }
    } else if(e==='C_DMG_E') {
      if(this.state.adBonusCount && D.checkType(data.type, ['NA','NS'])) {
        A.newAddDmg(this, this, [data.targets[0]], D.checkType(data.type, 'NS')? this.getBaseDmg('ns')*0.8: this.getBaseDmg('na')*0.5);
        this.state.adBonusCount--;
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, ps, us } = this.skillData;
    const nsHit = ns.hit*0.01 + (this.checkSoul(4)? 0.35: 0);
    const count = this.checkSoul(6)? 4: 3;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Void', 'NA' ], this, enemy)),
      Object.assign({
        type: 'damage', name:'战技', brkDmg, tip:`弹射${count}次`, hitRate: C.calHitRate(nsHit, this, enemy, 1, true, false)
      }, C.calDmg(base * ns.rate, [ 'Void', 'NS' ], this, enemy)),
      Object.assign({
        type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate: C.calHitRate(1, this, enemy, 1, true, false)
      }, C.calDmg(base * us.rate, [ 'Void', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'天赋[追伤]'}, C.calDmg(base * ps.rate, [ 'Void', 'AD' ], this, enemy)),
    ];
    if(this.checkSoul(1)) {
      list.splice(1, 0, Object.assign({
        type: 'damage', name:'普攻[追伤]', tip:'终结技后可触发最多2次'
      }, C.calDmg(base * na.rate * 0.5, [ 'Void', 'AD' ], this, enemy)));
      list.splice(3, 0, Object.assign({
        type: 'damage', name:'战技[追伤]', tip:'终结技后可触发最多2次'
      }, C.calDmg(base * ns.rate * 0.8, [ 'Void', 'AD' ], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrWelt,
};