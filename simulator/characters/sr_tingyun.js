'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { BuffDamage, BuffSpeedRate } = require('../buff_simple');

const baseData = {
  name: '停云',
  image: 'tingyun.jpg',
  rarity: 'SR',
  job: '同谐',
  type: 'Thunder',
  damages: ['NA','NS'],
  hp: D.levelData['115_846'],
  atk: D.levelData['72_529'],
  def: D.levelData['54_396'],
  speed: 112,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 130,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [0.3, 0.7],
  naSoul: 3,
  ns: D.makeTable([
    ['atkRate', 'limitRate', 'rate'],
    [25, 15, 20],
    [27, 16, 22],
    [30, 17, 24],
    [32, 18, 26],
    [35, 19, 28],
    [37, 20, 30],
    [40, 21, 32],
    [43, 22, 35],
    [46, 23, 38],
    [50, 25, 40],
    [52, 26, 42],
    [55, 27, 44],
  ]),
  nsTarget: 'member',
  nsSoul: 5,
  ps: D.makeTable([['rate'],[30],[33],[36],[39],[42],[45],[48],[52],[56],[60],[63],[66]]),
  psSoul: 5,
  us: D.makeTable([['bonusAll'],[20],[23],[26],[29],[32],[35],[38],[42],[46],[50],[53],[56]]),
  usTarget: 'member',
  usSoul: 3,
  es: [ '驻晴', '止厄', '亨通' ],
  attributes: [
    {atkRate: 4.0}, {atkRate: 4.0}, {atkRate: 6.0}, {atkRate: 6.0}, {atkRate: 8.0},
    { bonusThunder: 3.2 }, { bonusThunder: 4.8 }, { defRate: 5.0 }, { defRate: 7.5 }, { defRate: 10.0 },
  ],
  defaultJson: {
    weapon:'过往未来', name4: '骇域漫游的信使', name2: '太空封印站',
    body: 'atkRate', foot: 'speed', link:'enRate', ball:'hpRate',
    hp: [1, 0, 0],
  },
  aiConditions: [{value:'c_ns_comm',text:'战技剩余'}],
  ai:{
    na: ai.na_default,
    ns: ai.ns_buff_noT("停云$战技$赐福."),
    us:{
      disable:false,
      rules:[[{t:"target",v:["selected"]},{t:"en",v:["t","absolute","gtm",0]}]]
    }
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      atk:[10, 2000, 2400],
      speed:[50, 0, 99999],
    },
    main: {
      body: 'atkRate',
      foot: 'speed',
      link: 'enRate',
      ball: 'atkRate',
    },
    set4: ['骇域漫游的信使', '骇域漫游的信使'],
    set2: '生命的翁瓦克',
  },
};

const buffNsKey = Buff.getKey(baseData.name,'战技','赐福');

class BuffAtk extends Buff {
  static info() {
    return {
      name: '赐福',
      short: '赐福',
      source: '战技',
      desc: '攻击提高，且攻击后额外造成一次雷属性附加伤害',
      show: true,
      maxValue: 1,
      target: 'member',
      tags: ['buff', 'report', '加攻', '附加伤害'],
    }
  }
  init() {
    const { member, target} = this;
    this.listen({e:'C_DMG_E', t:'member', f:(buff, unit, data)=>{
      const t = D.sample(data.targets.filter(t=>t.checkAlive()));
      if(t)A.newAddDmg(target, target, [t], target.getAttr('atk') * member.skillData.ns.rate * 0.01, false, 'Thunder');
    }})
    if(member.checkSoul(1)) {
      this.listen({e:'ACT_E', t:'member', f:(buff, unit, data)=>{
        if(D.checkType(data.type,'US')) member.addBuff(Buff.getKey(member.name, '战技', '赐福[加速]'), target, 1);
      }})
    }
    if(member.checkSoul(2)) {
      this.listen({e:'C_KILL', t:'member', f:(buff)=>{
        if(buff.updateCD(target, 1))target.addEn(5);
      }})
    }
  }
  getDesc() {
    const atk = this.member.getBonusAtk(this.target);
    return `攻击力提升${Math.floor(atk)}，并且攻击后附带一次雷属性附加伤害`;
  }
  getAttributes() {
    return { atk: this.member.getBonusAtk(this.target) }
  }
  getReportData() {
    const enemy = this.target.getEnemy();
    const report = this.member.getBuffTargetDamageReport(this.target, enemy);
    if(this.member.checkSoul(2)) {
      report.push({ type:'energy', name:'赐福[回能]', labels:['击杀'], en0: 0.05 * this.target.attr.data.enRate});
    }
    return report;
  }
  checkSameBuff( buff ){
    return this.key === buff.key;
  }
}

class SrTingyun extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('止厄')) list.push({bonusNA:40});
    return list;
  }
  getCharacterBuffList(){
    const list = [
      Buff.getListJson(this, BuffAtk, [Buff.simpleListener()]),
      Buff.getListJson(this, BuffDamage, [Buff.simpleListener()], '', {
        bonusAll: this.skillData.us.bonusAll,
        name: '增伤', source:'终结技',
        target: 'member', maxValue: 1,
      }),
    ];
    if(this.checkES('驻晴')) {
      list.push(Buff.getListJson(this, BuffSpeedRate,[Buff.simpleListener()], '', {
        speedRate: 20,
        name: '驻晴[加速]', source:'天赋', target:'self', maxValue: 1,
      }));
    }
    if(this.checkSoul(1)) {
      list.push(Buff.getListJson(this, BuffSpeedRate, [Buff.simpleListener()],'', {
        speedRate: 20,
        name: '赐福[加速]', source:'战技',
        target: 'member', maxValue: 1,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getActionReport(this),
        ...this.getEnergyReport({ ns:30, us:5 }),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this,enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const buff = this.findBuff({key:buffNsKey}, null, false);
    if(!buff) return '无赐福目标';
    return `${buff.target.name}(${buff.state.count})`;
  }
  getStateExData() {
    const buff = this.findBuff({key:buffNsKey}, null, false);
    return buff? buff.state.count: 0;
  }
  castNS(target) {
    super.castNS(target);
    A.actionBase({type:'NS', member:this, target}, ()=>{
      this.addBuff(buffNsKey, target, 1, { count: 3 });
      if(this.checkES('驻晴')) this.addBuff(Buff.getKey(this.name, '天赋', '驻晴[加速]'), this, 1);
    });
    this.addEn(30);
  }
  castUS(target) {
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(Buff.getKey(this.name, '终结技', '增伤'), target, 1, { count: 2});
      target.addEn(this.checkSoul(6)? 60 : 50, true);
    });
    this.addEn(5);
  }
  castSP() {
    this.changeSp(-1);
    this.addEn(this.checkSoul(6)? 60 : 50, true);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);

    if(e==='C_DMG_E' && D.checkType(data.type,'NA')) {
      const buff = this.findBuff({key:buffNsKey}, null, false);
      if(buff) A.newAddDmg(buff.target, this, data.targets, buff.target.getAttr('atk')*this.skillData.ps.rate*0.01, false, 'Thunder');
    }
    if(e==='TURN_S' && this.checkES('亨通')) {
      this.addEn(5);
    }
    super.onEvent(e, unit, data);
  }
  // 获取角色伤害报告数据
  getDamageReport(enemy) {
    const base = this.getAttr('atk') * 0.01;
    const { na, ps } = this.skillData;
    const buffObj = this.findBuff({key:buffNsKey}, null, false);
    
    const damages = [Object.assign({ type: 'damage', name: '普攻', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(base * na.rate, ['Thunder', 'NA'], this, enemy))];
    if(buffObj) {
      const dmg = buffObj.target.getAttr('atk') * ps.rate * 0.01;
      damages.push(Object.assign({type: 'damage', name: `${buffObj.target.name}[追伤]`}, buffObj.target.getAdditionDamage(dmg, enemy, 'Thunder')));
    }
    damages.push(R.getBreakReport(this, enemy));
    return damages;
  }
  // 获取角色能量报告数据
  getEnergyReport(options) {
    const list = R.getEnergyReport(this, options);
    if(this.checkES('亨通')) {
      list.push({ type:'energy', name:'亨通[回能]', labels:['每回合'], en0: C.calEnergy(5, this)});
    }
    return list;
  }
  // 获取被赐福目标的伤害报告
  getBuffTargetDamageReport(target, enemy) {
    const rate = this.skillData.ns.rate * 0.01 + (this.checkSoul(4)? 0.2 : 0);
    const base = target.getAttr('atk') * rate;
    return [Object.assign({ type:'damage', name: `赐福[追伤]`, }, target.getAdditionDamage(base, enemy, 'Thunder'))];
  }
  // 获取赐福提供的攻击力数据
  getBonusAtk(target) {
    const { atkRate, limitRate } = this.skillData.ns;
    const atk = Math.min(target.baseAtk * atkRate * 0.01, this.getAttr('atk') * limitRate * 0.01);
    return atk;
  }
}

module.exports = {
  data: baseData,
  character: SrTingyun,
};