'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDefRate, DebuffDefend  } = require('../debuff_simple');
const { BuffHit, BuffDamage, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '佩拉',
  image: 'pela.jpg',
  rarity: 'SR',
  job: '虚无',
  type: 'Ice',
  damages: ['NA','US'],
  hp: D.levelData['134_987'],
  atk: D.levelData['74_546'],
  def: D.levelData['63_463'],
  speed: 105,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 110,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.5,0.5],
  naSoul: 3,
  ns: D.makeTable([['rate'],[105],[115],[126],[136],[147],[157],[170],[183],[196],[210],[220],[231]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['en'],[5.0],[5.5],[6.0],[6.5],[7.0],[7.5],[8.1],[8.7],[9.3],[10.0],[10.5],[11.0]]),
  psSoul: 5,
  us: D.makeTable([['rate','defDown'],[60,30],[64,31],[68,32],[72,33],[76,34],[80,35],[85,36],[90,37],[95,38],[100,40],[104,41],[108,42]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 5,
  es: ['痛击','秘策','追歼'],
  attributes: [
    { bonusIce: 3.2 }, { bonusIce: 3.2 }, { bonusIce: 4.8 }, { bonusIce: 4.8 }, { bonusIce: 6.4 },
    { hit: 4.0 }, { hit: 6.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
  ],
  defaultJson: {
    weapon:'决心如汗珠般闪耀', name4: '密林卧雪的猎人', name2: '泛银河商业公司',
    body: 'hit', foot: 'speed', link:'enRate', ball:'bonusIce',
    hp:[1,0,0]
  },
  ai: {
    na: ai.na_default,
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["buff","tag","增益状态","gt","yes","no"]},{t:"buff",v:["t","tag","增益状态","gt",0]}],
        [{t:"target",v:["selected"]},{t:"sp",v:["gt",2]}]
      ]
    },
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hit:[1000, 0, 57],
      hp:[1, 2500, 99999],
      speed:[30, 0, 99999],
    },
    main: {
      body: 'hit',
      foot: 'speed',
      link: 'enRate',
    },
  },
};
class BuffPela extends Buff {
  static info() {
    return {
      name: '佩拉',
      short: '特殊',
      source: '天赋',
      desc: '佩拉',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  init() {
    const m = this.member;
    if(m.checkSoul(1))this.listen({e:'B_KILL', t:'enemies', f:(buff, unit, data)=>{
      m.addEn(5);
    }});
  }
  getAttributesT(target) {
    return (this.member.checkES('痛击') && target.findBuff({tag:'debuff'}))? {bonusAll: 20}: {};
  }
}

class SrPela extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffPela),
      Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()], '', {
        defDown: this.skillData.us.defDown, name: '通解', source: '终结技', maxValue: 1
      }),
      Buff.getListJson(this, DebuffDefRate, [Buff.simpleListener()], '', {
        defDown: 20, name: '减防', source: '秘技', maxValue: 1
      }),
    ];
    if(this.checkES('秘策')){
      list.push(Buff.getListJson(this, BuffHit, [], '', {
        hit: 10, name: '命中提高', source: '天赋', target: 'members', hide: true,
      }));
    }
    if(this.checkES('追歼')){
      list.push(Buff.getListJson(this, BuffDamage, [Buff.eventListener('ACT_E','self')], '', {
        bonusAll: 20, name: '追歼', source: '天赋', maxValue: 1,
      }))
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 10, name: '加速', source: '星魂', maxValue: 1,
      }))
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, DebuffDefend, [Buff.simpleListener()], '', {
        defendIce: 12, type:'Ice', name: '冰抗降低', source: '星魂', maxValue: 1,
      }))
    }
    return list;
  }
  updateReport(enemy){
    const others = [['天赋回能', this.skillData.ps.en]];
    if(this.checkSoul(1))others.push(['敌人倒下', 5]);
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this, { others }),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      const result = target.removeABuff('buff');
      if(result && this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '加速'), this, 1, { count: 2 });
      if(this.checkSoul(4))this.addBuffRandom(Buff.getKey(this.name, '星魂', '冰抗降低'), target, 1, { count: 2 }, 1);
      cb();
      if(result && this.checkES('追歼')) this.addBuff(Buff.getKey(this.name, '天赋', '追歼'), this, 1);
    },'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(Buff.getKey(this.name, '终结技', '通解'), e, 1, {count: 2}, 1));
      cb();
    }, 'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
  }
  castSP() {
    super.castSP(()=>{
      const enemies = this.team.getAliveUnits('enemies');
      const target = D.sample(enemies)
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 80), 'single', target);
      if(target.findBuff({tag:'debuff'})){
        this.addEn(this.skillData.ps.en);
      }
      const debuffKey = Buff.getKey(this.name, '秘技', '减防');
      this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(debuffKey, e, 1, { count:2 }, 1));
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_DMG_E' && !D.checkType(data.type, 'SP')) {
      let psActivated = false;
      const addDmg = this.checkSoul(6);
      data.targets.forEach(e => {
        if(!e.findBuff({tag:'debuff'}))return;
        if(!psActivated) {
          psActivated = true;
          this.addEn(this.skillData.ps.en);
        }
        if(addDmg) A.newAddDmg(this, this, [e], this.getAttr('atk')*0.4);
      })
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, ['Ice', 'NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2 }, C.calDmg(base * ns.rate, ['Ice', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2, hitRate: C.calHitRate(1, this, enemy, 1)}, C.calDmg(base * us.rate, ['Ice', 'US'], this, enemy)),
    ];
    if(this.checkSoul(6)){
      list.push(Object.assign({ type: 'damage', name:'追伤', tip:'敌人有负面效果时触发' }, C.calDmg(base * 40, ['Ice', 'AD'], this, enemy)));
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrPela,
};