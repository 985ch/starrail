'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffSpeedRate } = require('../debuff_simple');
const { BuffDodge, BuffShield } = require('../buff_simple');

const baseData = {
  name: '杰帕德',
  image: 'gepard.jpg',
  rarity: 'SSR',
  job: '存护',
  type: 'Ice',
  damages: ['NA','NS'],
  hp: D.levelData['190_1397'],
  atk: D.levelData['73_543'],
  def: D.levelData['89_654'],
  speed: 92,
  criRate: 5,
  criDamage: 50,
  hate: 150,
  enMax: 100,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.5, 0.5],
  naSoul: 5,
  ns: D.makeTable([['rate','adRate'],[100,30],[110,33],[120,36],[130,39],[140,42],[150,45],[162,48],[175,52],[187,56],[200,60],[210,63], [220,66]]),
  nsHits: [0.15, 0.35, 0.5],
  nsTarget: 'enemy',
  nsSoul: 5,
  ps: D.makeTable([['healR'],[25], [27], [30], [32], [35], [37], [40], [43], [46], [50], [52], [55]]),
  psSoul: 3,
  us: D.makeTable([['shieldR','shield'],[30,150],[31,240],[33,307],[35,375],[37,420],[39,465],[40,498],[42,532],[43,566],[45,600],[46,633],[48,667]]),
  usTarget: 'members',
  usSoul: 3,
  es: [ '刚正', '统领', '战意' ],
  attributes: [
    { bonusIce: 3.2 }, { bonusIce: 3.2 }, { bonusIce: 4.8 }, { bonusIce: 4.8 }, { bonusIce: 6.4 },
    { defRate: 5.0 }, { defRate: 7.5 }, { dodge: 4.0 }, { dodge: 6.0 }, { dodge: 8.0 },
  ],
  defaultJson: {
    weapon:'制胜的瞬间', name4: '净庭教宗的圣骑士', name2: '筑城者的贝洛伯格',
    body: 'defRate', foot: 'speed', link:'enRate', ball:'defRate',
    atk:[1,0,0],hp:[0,0,1],defRate:[0,3,2]
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_sp_gt(3),
    us: ai.us_always,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      def:[1, 4000, 5000],
      speed: [50, 0, 99999],
    },
    main: {
      body: 'defRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'defRate',
    },
    set2: '筑城者的贝洛伯格'
  },
};

class DebuffFreeze extends Buff {
  static info() {
    return {
      name: '冻结',
      short: '冻结',
      source: '战技',
      desc: '无法行动，解冻时受到冰属性伤害',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags:  ['debuff', '冻结', 'freeze', 'removable'],
    }
  }
  getDesc() {
    const { damage, criDamage } = this.getData();
    return `无法行动，解冻时受到${Math.floor(damage)}(${Math.floor(criDamage)})点冰属性伤害。`;
  }
  getData() {
    const damage = this.member.getAdditionDamage(this.member.getBaseDmg('ns','adRate'), this.target, 'Ice', false);
    return damage;
  }
  beforeRemove(newBuff) {
    if(this.member.checkSoul(2) && !newBuff) {
      this.member.addBuff(Buff.getKey(baseData.name, '星魂', '减速'), this.target, 1);
    }
  }
}
class BuffAtk extends Buff {
  static info() {
    return {
      name: '刚正',
      short: '加攻',
      source: '天赋',
      desc: '根据当前防御力提升攻击力',
      show: true,
      maxValue: 1,
      target: 'self',
      tags:  ['buff', '加攻'],
    }
  }
  getDesc() {
    return `攻击力增加${Math.floor(this.state.atk)}点。`;
  }
  init() {
    this.state.atk = this.member.getAttr('def') * 0.35;
  }
  getAttributes() {
    return { atk: this.state.atk };
  }
}

class SsrGepard extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('统领')) list.push({ hateRate: 200 });
    return list;
  }
  getCharacterBuffList(){
    const { us } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: 24, shield: 150, baseAttr: 'def',
        name: '有情之证', source:'秘技', maxValue: 1, target:'member',
      }),
      Buff.getListJson(this, BuffShield, [Buff.simpleListener()], '', {
        shieldR: us.shieldR, shield: us.shield, baseAttr: 'def',
        name: '永屹之壁', source:'终结技', maxValue: 1, target:'member',
      }),
      Buff.getListJson(this, DebuffFreeze, [Buff.freezeListener(true, false)], '', {}),
    ];
    if(this.checkES('刚正')){
      list.push(Buff.getListJson(this, BuffAtk));
    }
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, DebuffSpeedRate, [Buff.simpleListener()], '', {
        speedRate: 20, name: '减速', source: '星魂', maxValue: 1
      }))
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffDodge, [], '', {
        dodge: 20, name: '精诚所至', source:'星魂', target:'members',
      }))
    }
    return list;
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
  castNS(target) {
    super.castNS(target);
    this.actionAttack(cb=>{
      cb();
      this.addBuffRandom(Buff.getKey(this.name, '战技', '冻结'), target, 1, {count:1}, this.checkSoul(1)? 1: 0.65, 1, true);
    },'NS', target, 'single', 30, this.rawFunc(2, 'ns'), this.base.nsHits);
  }
  castUS(target){
    super.castUS(target);
    const usKey = Buff.getKey(this.name, '终结技', '永屹之壁');
    A.actionBase({type:'US', member:this, target: this}, ()=>{
      this.team.getAliveUnits('members').forEach(m => this.addBuff(usKey, m, 1, {count:3}));
      this.addEn(5);
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    const spKey = Buff.getKey(this.name, '秘技', '有情之证');
    this.team.getAliveUnits('members').forEach(m => this.addBuff(spKey, m, 1, {count:3}));
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated) this.onSP();
    } if(e==='TURN_S') {
      if(this.checkES('刚正'))this.addBuff(Buff.getKey(this.name, '天赋', '刚正'), this, 1);
    } else if(e==='BEFORE_DEATH') {
      if(!this.state.reborn && this.state.hp <= 0) {
        this.state.hp = 0.01;
        this.triggerHeal([this], this.getAttr('hp') * (this.skillData.ps.healR + (this.checkSoul(6)? 50: 0)) * 0.01);
        if(this.checkES('战意'))this.addEn(100);
        if(this.checkSoul(6)) this.changeWaitTime(-100);
        this.state.reborn = true;
      }
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    return [
      Object.assign({ type: 'damage', name:'普攻', brkDmg}, C.calDmg(base * na.rate, [ 'Ice', 'NA' ], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', brkDmg: brkDmg*2, hitRate: C.calHitRate(this.checkSoul(1)? 1: 0.65, this, enemy, 1, true)},
        C.calDmg(base * ns.rate, [ 'Ice', 'NS' ], this, enemy)),
      Object.assign({ type: 'damage', name:'冻结伤害'}, C.calDmg(base * ns.adRate, [ 'Ice', 'AD' ], this, enemy)),
      R.getBreakReport(this, enemy)
    ];
  }
  getDefendReport(enemy) {
    const list = R.getDefendReport(this, enemy);
    const ps = this.skillData.ps;
    const heal = this.getAttr('hp') * (ps.healR + (this.checkSoul(6)? 50: 0)) * 0.01;
    list.push(
      { type:'shield', name: '终结技[护盾]', shield: C.calShieldData(this.getBaseHeal('us','shield','def'), this, this)},
      { type:'shield', name: '秘技[护盾]', shield: C.calShieldData(this.getAttr('def')*0.24+150, this, this)},
      { type:'heal', name:'天赋[回复]', labels: ['回复量'], heal0: C.calHealData(heal, this, this)},
    );
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrGepard,
};