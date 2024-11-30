'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDot } = require('../debuff_simple');
const { BuffBonus, BuffSpeed } = require('../buff_simple');

const baseData = {
  name: '艾丝妲',
  image: 'asta.jpg',
  rarity: 'SR',
  job: '同谐',
  type: 'Fire',
  damages: ['NA','NS'],
  hp: D.levelData['139_1023'],
  atk: D.levelData['69_511'],
  def: D.levelData['63_463'],
  speed: 106,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 120,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[25],[27.5],[30],[32.5],[35],[37.5],[40.63],[43.75],[46.88],[50],[52.5],[55],[57.5],[60],[62.5]]),
  nsHits: [1],
  nsTarget: 'enemy',
  nsSoul: 3,
  ps: D.makeTable([['atkRate'],[7],[7.7],[8.4],[9.1],[9.8],[10.5],[11.38],[12.25],[13.13],[14],[14.7],[15.4],[16.1],[16.8],[17.5]]),
  psSoul: 3,
  us: D.makeTable([['speed'],[36],[37.4],[38.8],[40.2],[41.6],[43],[44.75],[46.5],[48.25],[50],[51.4],[52.8],[54.2],[55.6],[57]]),
  usTarget: 'members',
  usSoul: 5,
  es: [ '火花', '点燃', '星座' ],
  attributes: [
    {bonusFire: 3.2}, {bonusFire: 3.2}, {bonusFire: 4.8}, {bonusFire: 4.8}, {bonusFire: 6.4},
    {criRate: 2.7 }, {criRate: 4.0 }, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'与行星相会', name4: '熔岩锻铸的火匠', name2: '盗贼公国塔利亚',
    body: 'criRate', foot: 'speed', link:'atkRate', ball:'bonusFire',
    hp:[1,0,0],atk:[1,0,0]
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
  ai: {
    na: ai.na_buff_noT("艾丝妲$天赋$灼烧."),
    ns:{
      disable:false,
      rules:[
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"c_ps_comm",v:["lt",3]},{t:"sp",v:["gt",1]}],
        [{t:"target",v:["shield","min","gt",0,"yes"]},{t:"buff",v:["t","tag","弱火","gt",0]},{t:"sp",v:["gt",1]}]
      ]
    },
    us: ai.us_always, 
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[10, 0, 3000],
      def:[30, 0, 1000],
      speed:[50, 0, 0],
    },
    main: {
      foot: 'speed',
      link: 'enRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
    set2: '梦想之地匹诺康尼',
  },
};
const buffPSKey = Buff.getKey(baseData.name, '天赋', '天象学');
class BuffAsta extends Buff {
  static info() {
    return {
      name: '天象学',
      short: '攻防',
      source: '天赋',
      desc: '增加攻击力和防御力',
      show: true,
      maxValue: 5,
      target: 'members',
      tags: ['buff', '加攻', '加防'],
    };
  }
  getDesc(target) {
    const { atkRate, defRate, enRate } = this.getData(target);
    return `攻击提升${D.toPercent(atkRate)}${defRate? `，防御提升${D.toPercent(defRate)}`:''}${enRate? `，能量回复效率提升${D.toPercent(enRate)}` : ''}。`
  }
  getAttributes(target) {
    return this.getData(target);
  }
  getData(target) {
    const m = this.member;
    return {
      atkRate: m.skillData.ps.atkRate * this.value,
      defRate: (target===m && m.checkES('星座'))? 6 * this.value: 0,
      enRate: (target===m && this.value>=2 && m.checkSoul(4))? 15: 0,
    }
  }
}
class SrAsta extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const { na, us } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffAsta),
      Buff.getListJson(this, BuffSpeed, [Buff.simpleListener()], '', { speed:us.speed, name:'星空祝言', source:'终结技', target:'member', maxValue:1 }),
    ];
    if(this.checkES('火花')){
      list.push(Buff.getListJson(this, DebuffDot, [Buff.dotListener()], '', {
        rate: na.rate * 0.5, count: 3, baseAttr:'atk', type:'Fire', name:'灼烧', source:'天赋'
      }))
    }
    if(this.checkES('点燃')){
      list.push(Buff.getListJson(this, BuffBonus, [], '', { bonusFire: 18, type: 'Fire', name: '点燃', source:'天赋', target:'members' }));
    }
    return list;
  }
  getStateExText() {
    return '天赋:'+ this.getStateExData();
  }
  getStateExData() {
    const buff = this.findBuff({key: buffPSKey})
    return buff? buff.value: 0;
  }
  updateReport(enemy){
    const options = { ns: this.checkSoul(1)? 36: 30 }
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
  castNA(target) {
    super.castNA(target, 'atk', (cb)=>{
      if(this.checkES('火花')) this.addBuffRandom(Buff.getKey(this.name, '天赋', '灼烧'), target, 1, {}, 0.8, 1, false, true);
      cb();
    });
  }
  castNS(target) {
    super.castNS(target);
    const count = this.checkSoul(1)? 6: 5;
    this.actionAttack(cb=>cb(), 'NS', target, 'random', 6, this.rawRandFunc(1, 0.5, 'ns'), count, null, {hitAliveOnly:true});
  }
  castUS(target){
    super.castUS(target);
    const buffKey = Buff.getKey(this.name, '终结技', '星空祝言');
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.team.getAliveUnits('members').forEach(m=>this.addBuff(buffKey, m, 1, {count:2}));
      this.addEn(5);
    });
    if(this.checkSoul(2)) this.state.keepBuff = true;
  }
  castSP() {
    super.castSP(()=>A.startBattleDmg(this, 2, this.rawFuncRate(0, 80)));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='TURN_S') {
      //console.log(data.turn, this.state.turn);
      if(this.state.turn> 1 && !this.state.keepBuff && this.findBuff({key:buffPSKey})) this.addBuff(buffPSKey, this, this.checkSoul(6)? -2: -3);
      this.state.keepBuff = false;
    } else if(e==='C_DMG_S') {
      if(D.checkType(data.type, ['NA','NS','AA'])) this.state.hits = [];
    } else if(e==='C_HIT_E') {
      if(D.checkType(data.type, ['NA','NS','AA']) && this.state.hits.indexOf(data.target.name)===-1) {
        this.addBuff(buffPSKey, this, data.target.findBuff({tag:'weakFire'})? 2: 1);
        this.state.hits.push(data.target.name);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1)
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate,['Fire','NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', tip:`首次削韧${brkDmg.toFixed(1)},后续削韧${(brkDmg/2).toFixed(1)},共${this.checkSoul(1)? 6: 5}次`}, C.calDmg(base * ns.rate, ['Fire', 'NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'秘技', brkDmg: brkDmg*2 }, C.calDmg(base * 50, ['Fire', 'SP'], this, enemy)),
    ];
    if(this.checkES('火花')){
      const dotDamage = C.calDmg(base*na.rate*0.5, [ 'Fire', 'DOT' ], this, enemy, {simpleMode:true});
      list.splice(1, 0, {
        type: 'dot', name:'普攻[灼烧]', damage: dotDamage, turn: 3, totalDamage: dotDamage * 3,
        hitRate: C.calHitRate(0.8, this, enemy, 1, false, true),
      });
    }
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrAsta,
};