'use strict';

const { SummonUnit, Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffCriRate, BuffCriDamage } = require('../buff_simple');
const { DebuffWeakAll } = require('../debuff_simple');

const baseData = {
  name: '景元',
  image: 'jingyuan.jpg',
  rarity: 'SSR',
  job: '智识',
  type: 'Thunder',
  damages: ['AA','US'],
  hp: D.levelData['158_1164'],
  atk: D.levelData['95_698'],
  def: D.levelData['66_485'],
  speed: 99,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 130,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.45,0.55],
  naSoul: 3,
  ns: D.makeTable([['rate'],[50],[55],[60],[65],[70],[75],[81],[87],[93],[100],[105],[110]]),
  nsHits: [0.4,0.3,0.3],
  nsTarget: 'enemies',
  nsSoul: 5,
  ps: D.makeTable([['rate'],[33],[36],[39],[42],[46],[49],[53],[57],[61],[66],[69],[72]]),
  psSoul: 5,
  us: D.makeTable([['rate'],[120], [128], [136], [144], [152], [160], [170],[180], [190], [200], [208], [216]]),
  usTarget: 'enemies',
  usHits: [1],
  usSoul: 3,
  es: [ '破阵', '绸缪', '遣将' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { criRate: 2.7 }, { criRate: 4.0 }, { criRate: 5.3 },
  ],
  defaultJson: {
    weapon:'拂晓之前', name4: '激奏雷电的乐队', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'atkRate', ball:'bonusThunder',
  },
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'speed',
      link: 'enRate',
      ball: 'bonusThunder',
    },
    set2: '停转的萨尔索图'
  },
  aiConditions: [{value:'c_ps_comm',text:'被动层数'}],
};
const buffSJKey = Buff.getKey(baseData.name, '天赋', '神君');
class BuffSJ extends Buff {
  static info() {
    return {
      name: '神君',
      short: '神君',
      source: '天赋',
      desc: '神君攻击段数',
      show: true,
      maxValue: 10,
      target: 'self',
      tags: [],
    };
  }
  afterAdd() {
    if(this.value<3)this.value = 3;
  }
  getDesc() {
    return `神君当前攻击段数为${this.value}${this.value>=6 && this.member.checkES('破阵')?'神君下回合暴伤提高25%':''}。`;
  }
  stack(sameBuff){
    const shenjun = this.member.shenjun;
    const oldSpeed =shenjun.getSpeed(sameBuff? sameBuff.value: 3);
    this.value = Math.max(3, Math.min(sameBuff.value + this.value, 10));
    const newSpeed = shenjun.getSpeed(this.value); 
    shenjun.state.wait *= oldSpeed / newSpeed;
    this.member.team.updateActionUnit(shenjun);
  }
}
class BuffDamage extends Buff {
  static info() {
    return {
      name: '增伤',
      short: '增伤',
      source: '星魂',
      desc: '普攻，战技，终结技伤害提高',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['buff', '增伤', 'bonusNA', 'bonusNS', 'bonusUS'],
    };
  }
  getDesc() {
    return '普攻，战技，终结技伤害提高20%。';
  }
  getAttributes() {
    return { bonusNA: 20, bonusNS: 20, bonusUS: 20 }
  }
}
class ShenJun extends SummonUnit {
  getBase() {
    return { image:'shenjun.jpg', rarity:'SSR'}
  }
  getSpeed(value) {
    value = value || this.getBuffValue();
    return 60 + (value - 3) * 10;
  }
  getBuffValue() {
    const buff = this.owner.findBuff({key:buffSJKey});
    return buff? buff.value: 3;
  }
  calActionTime() {
    return C.calActionTime(this.getSpeed(), 0);
  }
  getActions() {
    if(!this.team.state.inBattle || !this.checkAlive() || !this.checkMyTurn(true) || !this.canAction() || this.owner.findBuff({tag:'freeze'})) return [];
    return [{ text: '自动攻击', key: 'na', target: 'enemies', noRecord: true, tarRaw:'dmg', disable: false}];
  }
  onAction(data) {
    let { key } = data;
    const m = this.owner;
    if(key === 'na') {
      const value = this.getBuffValue();
      if(value>=6 && m.checkES('破阵')) m.addBuff(Buff.getKey(m.name, '天赋', '破阵'), m, 1);
      m.castSJAttack(m.skillData.ps.rate, m.checkSoul(1)? 0.5: 0.25, value);
      if(m.checkSoul(2))m.addBuff(Buff.getKey(m.name,'星魂','增伤'), m, 1, {count:2});
      m.addBuff(buffSJKey, m, -7);
      this.team.state.acted = true;
    }
    super.onAction(data);
  }
}

class SsrJingyuan extends Character {
  constructor(team, index, json) {
    super(team, index, json);
    this.shenjun = new ShenJun(this, '神君')
  }
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [Buff.getListJson(this, BuffSJ)];
    if(this.checkES('破阵')){
      list.push(Buff.getListJson(this, BuffCriDamage, [Buff.eventListener('C_DMG_E', 'self')], '', {
        criDamage: 25, name:'破阵', source:'天赋', hide: true, maxValue: 1,
      }));
    }
    if(this.checkES('遣将')){
      list.push(Buff.getListJson(this, BuffCriRate, [Buff.simpleListener()], '', { criRate: 10, name:'遣将', source:'天赋', maxValue: 1 }));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffDamage));
    }
    if(this.checkSoul(6)){
      list.push(Buff.getListJson(this, DebuffWeakAll, [Buff.eventListener('C_DMG_E', 'self')], '', {
        weakAll: 12, name: '易伤', source:'星魂', target:'enemy', maxValue: 3
      }));
    }
    return list;
  }
  getSummonList(){
    return [this.shenjun];
  }
  getStateExText() {
    return `神君:${this.shenjun.getBuffValue()}`;
  }
  getStateExData() {
    return this.shenjun.getBuffValue();
  }
  updateReport(enemy){
    const value = this.shenjun.getBuffValue();
    const report = {
      reportList: [
        ...this.getDamageReport(enemy, value),
        ...this.getActionReport(),
        ...this.getEnergyReport(value),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>cb(), 'NS', target, 'all', 30, this.rawFunc(1, 'ns'), baseData.nsHits);
    if(this.checkES('遣将')) this.addBuff(Buff.getKey(this.name, '天赋', '遣将'), this, 1, {count:2});
    this.addBuff(buffSJKey, this, 2);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>cb(), 'US', target, 'all', 5, this.rawFunc(2, 'us'), baseData.usHits);
    this.addBuff(buffSJKey, this, 3);
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  castSJAttack(rate, diffRate, count) {
    const getHitInfo = (i, targets) => {
      const list = targets.filter(t=>t.checkAlive());
      const tar = D.sample(list) || targets[0];
      const tarList = A.getDiffTargets(targets, tar);
      return tarList.map(t => ({t, r: 1}));
    }
    A.actionBase({type:'AA', member:this, target: 'enemies' }, ()=>{
      A.triggerAttack({
        member: this, target:'enemies', atkType:'all', count,
        attrType:'Thunder', en: 0, options:{ shenjun: true, getHitInfo },
        rawDmg:(i)=>{ return {
          brkDmg: i===0? 0.5 : 0,
          raw: this.getAttr('atk')*0.01*rate*(i===0? 1: diffRate),
        }}
      })
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.checkES('绸缪')) this.addEn(15);
      const buff = this.findBuff({key: buffSJKey});
      const value = this.state.spActivated? 6: 3;
      if(buff) {
        buff.value = value;
      }else{
        this.addBuff(buffSJKey, this, value);
      }
      this.shenjun.state.wait = this.shenjun.calActionTime();
      this.team.updateActionUnit(this.shenjun);
      this.state.spActivated = false;
    } else if(e==='C_HIT_E') {    
      if(data.options && data.options.shenjun && data.idxT === 0) {
        if(this.checkSoul(4)) this.addEn(2);
        if(this.checkSoul(6)) this.addBuff(Buff.getKey(this.name, '星魂', '易伤'), data.target, 1);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy, value) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const fixed = { criDmg: (value>=6 && this.checkES('破阵'))? 25: 0 };

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate, [ 'Thunder', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg }, C.calDmg(base * ns.rate, [ 'Thunder', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*2 }, C.calDmg(base * us.rate, [ 'Thunder', 'US' ], this, enemy)),
      Object.assign({ type: 'damage', name:'神君[中心]', brkDmg: brkDmg/2, tip: `当前共${value}段` }, C.calDmg(base * ps.rate, [ 'Thunder', 'AA' ], this, enemy, null, fixed)),
      Object.assign({ type: 'damage', name:'神君[扩散]', brkDmg: brkDmg/2 }, C.calDmg(base * ps.rate * (this.checkSoul(1)? 0.5: 0.25), [ 'Thunder', 'AA' ], this, enemy, null, fixed)),
      R.getBreakReport(this, enemy),
    ];
  }
  getActionReport() {
    const list = R.getActionReport(this);
    list.push({ type:'action', name:'行动间隔[神君]', wait: C.calActionTime(this.shenjun.getSpeed())});
    return list;
  }
  getEnergyReport(value) {
    const others = [];
    if(this.checkES('绸缪')) others.push(['战斗开始', 15]);
    const list = R.getEnergyReport(this, { others });
    if(this.checkSoul(4))list.push({ type:'energy', name:'神君[回能]', labels:['攻击回能'], en0: C.calEnergy(2*value, this)})
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrJingyuan,
};