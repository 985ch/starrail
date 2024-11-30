'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffHpRate, BuffHealRate } = require('../buff_simple');

const baseData = {
  name: '白露',
  image: 'bailu.jpg',
  rarity: 'SSR',
  job: '丰饶',
  type: 'Thunder',
  damages: ['NA','NS'],
  hp: D.levelData['179_1319'],
  atk: D.levelData['76_562'],
  def: D.levelData['66_485'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['healR','heal'],[7.8,78],[8.2,124],[8.7,159],[9.2,195],[9.7,218],[10.1,241],[10.5,259],[10.9,276],[11.3,294],[11.7,312],[12.0,329],[12.4,347]]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([
    ['healR','heal','rebornR','reborn'],
    [3.6, 36, 12.0, 120],
    [3.8, 57, 12.7, 192],
    [4.0, 73, 13.5, 246],
    [4.2, 90, 14.2, 300],
    [4.5, 100, 15.0, 336],
    [4.6, 111, 15.6, 372],
    [4.8, 119, 16.2, 399],
    [5.0, 127, 16.8, 426],
    [5.2, 135, 17.4, 453],
    [5.4, 144, 18.0, 480],
    [5.5, 152, 18.6, 507],
    [5.7, 160, 19.2, 534],
  ]),
  psSoul: 3,
  us: D.makeTable([['healR','heal'],[9.0,90],[9.5,144],[10.1,184],[10.6,225],[11.2,252],[11.7,279],[12.1,299],[12.6,319],[13.0,339],[13.5,360],[13.9,380],[14.4,400]]),
  usTarget: 'members',
  usSoul: 5,
  es: ['岐黄精义','持明龙脉', '鳞渊福泽'],
  attributes: [
    { hpRate: 4.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
    { dodge: 4.0 }, { dodge: 6.0 }, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'时节不居', name4: '云无留迹的过客', name2: '不老者的仙舟',
    body: 'healRate', foot: 'speed', link:'enRate', ball:'hpRate',
  },
  aiConditions: [{value:'c_bailu',text:'复活次数'}],
  ai:{
    na: ai.na_default,
    ns: ai.ns_heal_target,
    us: ai.us_heal_aoe,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[1, 4000, 99999],
      speed:[10, 0, 99999],
      dodge:[5, 0, 100],
    },
    main: {
      body: 'healRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'hpRate',
    },
    set4: ['云无留迹的过客', null],
  },
};
const buffUsKey = Buff.getKey(baseData.name, '天赋', '生息');
class BuffSX extends Buff {
  static info() {
    return {
      name: '生息',
      short: '生息',
      source: '天赋',
      desc: '受到攻击时可以回血，并获得复活机会',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['report', 'buff', '治疗'],
    }
  }
  getDesc() {
    const m = this.member;
    const { heal, reborn } = this.getData();
    let text=`受到攻击时回复${Math.floor(heal)}点生命，剩余${this.state.healCount}次。`;
    if((m.state.rebornCount || 0)< (m.checkSoul(6)? 2: 1)) text+=`受到致命攻击时不会倒下，并回复${Math.floor(reborn)}点生命。`;
    if(m.checkES('鳞渊福泽')) text+='受到的伤害降低10%。'
    return text;
  }
  init() {
    const m = this.member;
    this.state.healCount = m.checkES('持明龙脉')? 3: 2;
    this.listen({e:'B_DMG_S', t:'member', f:(buff, unit, data)=> {
      if(buff.state.healCount <= 0)return;
      m.triggerHeal([unit], m.getBaseHeal('ps'));
      buff.state.healCount--;
    }})
    this.listen({e:'BEFORE_DEATH', t:'member', f:(buff, unit, data)=>{
      if(unit===m || (m.state.rebornCount || 0)>= (this.member.checkSoul(6)? 2: 1))return;
        unit.state.hp = 0.01;
        m.triggerHeal([unit], m.getBaseHeal('ps','reborn'));
        m.state.rebornCount = (m.state.rebornCount || 0) + 1;
    }})
  }
  beforeRemove() {
    const t = this.target;
    if(this.member.checkSoul(1) && t.state.hp===t.getAttr('hp'))t.addEn(8,true);
  }
  getAttributes() {
    return this.member.checkES('鳞渊福泽')? {damageRate:0.9}: {};
  }
  getData() {
    const m = this.member;
    return {
      heal: C.calHealData(m.getBaseHeal('ps'), m, this.target),
      reborn: C.calHealData(m.getBaseHeal('ps','reborn'), m, this.target),
    }
  }
  getReportData(target) {
    if(target===this.member)return [];
    const { heal, reborn } = this.getData();
    const report = {
      type:'heal', name:'[白露]生息[回复]', labels:['受击回血','复活回血'],
      heal0: heal, heal1: reborn,
    };
    return [report];
  }
}
class SsrBailu extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffSX, [Buff.simpleListener()]),
    ];
    if(this.checkES('岐黄精义')){
      list.push(Buff.getListJson(this, BuffHpRate, [Buff.simpleListener()], '', {
        hpRate: 10, name: '岐黄精义', source:'天赋', maxValue: 1, target:'member',
      }))
    }
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffHealRate, [Buff.simpleListener()], '', {
        healRate: 15, name: '治疗效率', source:'星魂', maxValue: 1,
      }));
    }
    if(this.checkSoul(4)) {
      list.push(Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: 10, name: '全伤害提升', source:'星魂', target: 'member', maxValue: 3,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getLiveReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...R.getEnergyReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    return `可复活${this.getStateExData()}次`;
  }
  getStateExData() {
    return (this.checkSoul(6)?2:1) - (this.state.rebornCount || 0);
  }
  castNS(target) {
    super.castNS(target);
    A.actionHeal({type:'NS', member:this, target, tarType:'random', count:3}, cb=>cb(), (data, target)=>{
      if(this.checkSoul(4))this.addBuff(Buff.getKey(this.name, '星魂', '全伤害提升'), target, 1, {count:2});
      return C.calHealData(this.getBaseHeal('ns') * (1 - 0.15 * data.idx), this, target);
    })
    this.addEn(30);
  }
  castUS(target){
    super.castUS(target);
    A.actionHeal({type:'US', member:this, target, tarType:'all'}, cb=>cb(), (data, target)=>{
      const buff = target.findBuff({key: buffUsKey});
      if(buff) {
        buff.state.count++;
      } else {
        this.addBuff(buffUsKey, target, 1, {count:2});
      }
      return C.calHealData(this.getBaseHeal('us'), this, target);
    });
    if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '治疗效率'), this, 1, {count:2});
    this.addEn(5);
  }
  castSP() {
    this.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('members').forEach( m => this.addBuff(buffUsKey, m, 1, {count:2}));
  }
  onEvent(e, unit, data) {
    if(unit!==this)return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
    } else if(e==='C_HEAL_S') {
      const t = data.targets[data.idx];
      if(this.checkES('岐黄精义') && t!==this){
        if(t.state.hp + data.heal > t.getAttr('hp')) {
          this.addBuff(Buff.getKey(this.name, '天赋', '岐黄精义'), t, 1, {count:2});
        }
      }
    }
    super.onEvent(e, unit, data);
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    const nsBase = this.getBaseHeal('ns');
    list.push({
      type:'heal', name:'战技[回复]', labels:['第一次','第二次', '第三次'],
      heal0: C.calHealData(nsBase, this, this),
      heal1: C.calHealData(nsBase * 0.85, this, this),
      heal2: C.calHealData(nsBase * 0.7, this, this),
    }, {
      type:'heal', name:'生息[回复]', labels:['受击回血','复活回血'],
      heal0: C.calHealData(this.getBaseHeal('ps'), this, this),
      heal1: C.calHealData(this.getBaseHeal('ps','reborn'), this, this),
    }, {
      type:'heal', name:'终结技[回复]', labels:['治疗量'],
      heal0: C.calHealData(this.getBaseHeal('us'), this, this),
    });
    return list;
  }
  getDamageReport(enemy){
    return [
      Object.assign({ type:'damage', name:'普通攻击', brkDmg: C.calBrkDmg(this, enemy, 1)},  C.calDmg(this.getBaseDmg('na'), ['Thunder', 'NA'], this, enemy)),
      R.getBreakReport(this,enemy),
    ];
  }
}

module.exports = {
  data: baseData,
  character: SsrBailu,
};