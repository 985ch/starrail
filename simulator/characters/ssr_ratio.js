'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { DebuffSpeedRate, DebuffDodge } = require('../debuff_simple');

const baseData = {
  name: '真理医生',
  image: 'dr.ratio.jpg',
  rarity: 'SSR',
  job: '巡猎',
  type: 'Void',
  damages: ['AA','US'],
  hp: D.levelData['142_1047'],
  atk: D.levelData['105_776'],
  def: D.levelData['62_460'],
  speed: 103,
  criRate: 5,
  criDamage: 50,
  hate: 75,
  enMax: 140,
  na: D.makeTable([["rate"],[50],[60],[70],[80],[90],[100],[110],[120],[130]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([["rate"],[75],[82.5],[90],[97.5],[105],[112.5],[121.88],[131.25],[140.63],[150],[157.5],[165],[172.5],[180],[187.5]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 5,
  ps: D.makeTable([['rate'],[135],[148.5],[162],[175.5],[189],[202.5],[219.38],[236.25],[253.13],[270],[283.5],[297],[310.5],[324],[337.5]]),
  psHits: [1],
  psSoul: 5,
  us: D.makeTable([['rate'],[144],[153.6],[163.2],[172.8],[182.4],[192],[204],[216],[228],[240],[249.6],[259.2],[268.8],[278.4],[288]]),
  usTarget: 'enemy',
  usHits: [1],
  usSoul: 3,
  es: [ '归纳', '演绎', '推理' ],
  attributes: [
    { atkRate: 4.0 }, { atkRate: 4.0 }, { atkRate: 6.0 }, { atkRate: 6.0 }, { atkRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { criRate: 2.7 }, { criRate: 4.0 }, { criRate: 5.3 },
  ],
  defaultJson: {
    weapon:'纯粹思维的洗礼', name4: '盗匪荒漠的废土客', name2: '停转的萨尔索图',
    body: 'criRate', foot: 'atkRate', link:'enRate', ball:'bonusVoid',
    hp:[1,0,0],atk:[1,0,0],atkRate:[0,3,2],def:[0,0,1]
  },
  aiConditions: [{value:'c_ratio',text:'追加追击'}],
  equipSetting: {
    rule: 'dmgAA',
    main: {
      foot: 'atkRate',
      link: 'atkRate',
      ball: 'bonusVoid',
    },
    set2: '停转的萨尔索图'
  },
};

class BuffUS extends Buff {
  static info() {
    return {
      name: '智者的短见',
      short: '短见',
      source: '终结技',
      desc:'目标受到真理医生队友攻击时触发追击',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: [],
    };
  }
  init() {
    const c = this.member;
    this.listen({e:'B_DMG_E', t:'enemy', f:(buff, unit, data)=> {
      if(data.member===c || data.member.faction!=='members') return;
      c.castPS(unit, 3);
      buff.state.count--;
    }})
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}
class BuffCrit extends Buff {
  static info(data) {
    return {
      name: '归纳',
      short: '双爆',
      source: '天赋',
      desc:'暴击和暴伤提升',
      show: true,
      maxValue: data.maxValue,
      target: 'self',
      tags: ['buff','暴击','暴伤'],
    };
  }
  getDesc() {
    return `暴击提升${this.value * 2.5}%，暴伤提升${this.value * 5}%。`
  }
  getAttributes() {
    return {
      criRate: this.value * 2.5,
      criDamage: this.value * 5,
    };
  }
}
class BuffDamage extends Buff {
  static info() {
    return {
      name: '推理',
      short: '增伤',
      source: '天赋',
      desc:'对有负面效果的目标增伤',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    const count = target.countBuffs({tag:'debuff'},5);
    return { bonusAll: count<3 ? 0 : count*10 }
  }
}
class SsrDrRatio extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffUS),
      Buff.getListJson(this, DebuffSpeedRate, [Buff.simpleListener()],'',{
        speedRate: 15, name: '减速', source:'秘技', maxValue: 1
      }),
    ];
    if(this.checkES('归纳'))list.push(Buff.getListJson(this, BuffCrit, [], '', { maxValue: this.checkSoul(1) ? 10 : 6}));
    if(this.checkES('演绎')){
      list.push(Buff.getListJson(this, DebuffDodge, [Buff.simpleListener()], '', { dodge: 10, name:'演绎', source: '天赋', maxValue: 1}));
    }
    if(this.checkES('推理'))list.push(Buff.getListJson(this, BuffDamage));
    return list;
  }
  updateReport(enemy){
    const others = [['追击回能', 5 + (this.checkSoul(4)? 15: 0)]];
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
  getStateExText() {
    return '额外追击：'+this.getStateExData();
  }
  getStateExData() {
    const buff = this.findBuff({key:Buff.getKey(this.name, '终结技', '智者的短见')}, null, false);
    return buff? buff.state.count : 0;
  }
  castNS(target) {
    super.castNS(target);
    const count = target.countBuffs({tag:'debuff'});
    let newTarget = null;
    this.actionAttack(cb=>{
      if(this.checkES('归纳')) this.addBuff(Buff.getKey(this.name, '天赋', '归纳'), this, count);
      cb();
      const tAlive =target.checkAlive();
      if(this.checkES('演绎') && tAlive) this.addBuffRandom(Buff.getKey(this.name, '天赋', '演绎'), target, 1, {count:2}, 1)
      newTarget = tAlive ? target: D.sample(this.team.getAliveUnits('enemies'));
    },'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
    if(newTarget)this.castPS(newTarget, count);
  }
  castUS(target){
    super.castUS(target);
    this.actionAttack(cb=>{
      cb();
      if(target.checkAlive()) {
        this.addBuff(Buff.getKey(this.name, '终结技', '智者的短见'), target, 1, {count: this.checkSoul(6)? 3: 2});
      }
    }, 'US', target, 'single', 5, this.rawFunc(3, 'us'), baseData.usHits);
  }
  castSP() {
    super.changeSp(-1);
    this.team.setField(this);
  }
  _onSP() {
    this.team.getAliveUnits('enemies').forEach(e => this.addBuffRandom(Buff.getKey(this.name, '秘技', '减速'), e, 1, { count: 2 }, 1));
  }
  castPS(target, count) {
    if(Math.random() > 0.4 + 0.2 * count) return;
    this.castAdditionAttack(target, 'single', 5 + (this.checkSoul(4)? 15: 0), this.rawFunc(1, 'ps'), baseData.psHits, null, {
      fixed: { bonus: this.checkSoul(6)? 50 : 0 },
      flag: '真理医生追击'
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='C_DMG_E') {
      if(this.checkSoul(2) && data.options && data.options.flag==='真理医生追击') {
        const count = data.targets[0].countBuffs({tag:'debuff'}, 4);
        for(let i=0; i<count; i++) {
          A.newAddDmg(this, this, data.targets, this.getAttr('atk')*0.2);
        }
      }
    } else if(e==='BTL_S') {
      if(this.state.fieldActivated) this.onSP();
      if(this.checkSoul(1) && this.checkES('归纳')) {
        this.addBuff(Buff.getKey(this.name, '天赋', '归纳'), this, 4);
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns, us, ps } = this.skillData;
    const count = enemy.countBuffs({tag:'debuff'}, 4);
    const hitRate = C.calHitRate(1, this, enemy);

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, ['Void','NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2}, C.calDmg(base * ns.rate, ['Void','NS'], this, enemy)),
      Object.assign({ type: 'damage', name:'终结技', brkDmg: brkDmg*3}, C.calDmg(base * us.rate, ['Void','US'], this, enemy)),
      Object.assign({
        type: 'damage', name:'天赋[追击]', hitRate: 40 + Math.min(3, count) * 20, brkDmg,
      }, C.calDmg(base * ps.rate, ['Void','AA'], this, enemy, null, {bonus: this.checkSoul(6)? 50: 0})),
    ];
    if(this.checkES('演绎')) list[1].hitRate = hitRate;
    if(this.checkSoul(2)){
      list.push(Object.assign({ type:'damage', name:'天赋[追伤]', tip:`触发${count}次`}, C.calDmg(base * 20, ['Void','AD'], this, enemy)));
    }
    list.push({type: 'hit', name: '秘技触发概率', labels: ['概率'], hit0: hitRate })
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrDrRatio,
};