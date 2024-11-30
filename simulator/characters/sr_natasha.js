'use strict';

const { Buff, A, C, D, R, ai } = require('../index');
const Character = require('../character');
const { DebuffDamage } = require('../debuff_simple');
const { BuffHeal } = require('../buff_simple');

const baseData = {
  name: '娜塔莎',
  image: 'natasha.jpg',
  rarity: 'SR',
  job: '丰饶',
  type: 'Physical',
  damages: ['NA','NS'],
  hp: D.levelData['158_1164'],
  atk: D.levelData['64_476'],
  def: D.levelData['69_507'],
  speed: 98,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 90,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 3,
  ns: D.makeTable([
    ['healR','heal','hotR','hot'],
    [7.0, 70, 4.8, 48],
    [7.4, 112, 5.1, 76],
    [7.8, 143, 5.4, 98],
    [8.3, 175, 5.7, 120],
    [8.7, 196, 6.0, 134],
    [9.1, 217, 6.2, 148],
    [9.4, 232, 6.4, 159],
    [9.8, 248, 6.7, 170],
    [10.1, 264, 6.9, 181],
    [10.5, 280, 7.2, 192],
    [10.8, 295, 7.4, 202],
    [11.2, 311, 7.6, 213],
  ]),
  nsTarget: 'member',
  nsSoul: 3,
  ps: D.makeTable([['healRate'],[25],[27.5],[30],[32.5],[35],[37.5],[40.625],[43.75],[46.875],[50],[52.5],[55]]),
  psSoul: 5,
  us: D.makeTable([['healR','heal'],[9.2, 92],[9.7, 147],[10.3, 188],[10.9, 230],[11.5, 257],[11.9, 285],[12.4, 305],[12.8, 326],[13.3, 347],[13.8, 368],[14.2, 388], [14.7, 409]]),
  usTarget: 'members',
  usSoul: 5,
  es: [ '舒缓', '医者', '调理' ],
  attributes: [
    { hpRate: 4.0 }, { hpRate: 4.0 }, { hpRate: 6.0 }, { hpRate: 6.0 }, { hpRate: 8.0 },
    { defRate: 5.0 }, { defRate: 7.5 }, { dodge: 4.0 }, { dodge: 6.0 },{ dodge: 8.0 },
  ],
  defaultJson: {
    weapon:'一场术后对话', name4: '云无留迹的过客', name2: '不老者的仙舟',
    body: 'healRate', foot: 'speed', link:'enRate', ball:'hpRate',
    atk: [1, 0, 0],
  },
  ai:{
    na: ai.na_default,
    ns: ai.ns_heal_target,
    us: ai.us_heal_aoe,
  },
  equipSetting: {
    rule: 'simple',
    attrs: {
      hp:[10, 4000, 99999],
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

class BuffHealRate extends Buff {
  static info() {
    return {
      name: '生机焕发',
      short: '治疗效率',
      source: '天赋',
      desc: '对血量低于30%的我方目标治疗量提升',
      show: false ,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    if(target.faction === 'members' && target.checkHp(30)) {
      return this.member.skillData.ps;
    }
    return {};
  }
}

class SrNatasha extends Character {
  getBaseData() { return baseData; }
  getExtendAttributes() {
    const list = super.getExtendAttributes();
    if(this.checkES('医者')) list.push({ healRate:10 });
    return list;
  }
  getCharacterBuffList(){
    const { ns } = this.skillData;
    const list = [
      Buff.getListJson(this, BuffHealRate),
      Buff.getListJson(this, DebuffDamage, [Buff.simpleListener()], '', { bonusAll: 30, name: '伤害降低', source: '秘技', maxValue: 1 }),
      Buff.getListJson(this, BuffHeal, [Buff.hotListener()], '', {
        baseAttr: 'hp', healR: ns.hotR, heal: ns.hot,
        name: '持续治疗[战技]', source:'战技', target:'member', desc:'回合开始时', maxValue: 1, isHot: true, hideReport: true,
      }),
    ];
    if(this.checkSoul(2)) {
      list.push(Buff.getListJson(this, BuffHeal, [Buff.hotListener()], '', {
        baseAttr: 'hp', healR: 6, heal: 160,
        name: '持续治疗[终结技]', source:'星魂', target:'member', desc:'回合开始时', maxValue: 1, isHot: true, hideReport: true,
      }));
    }
    return list;
  }
  updateReport(enemy){
    const options = this.checkSoul(4)? { others: [['受击额外回能', 5]]}: {};
    const report = {
      reportList: [
        ...this.getLiveReport(enemy),
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this,options),
        ...R.getActionReport(this),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  castNS(target) {
    super.castNS(target);
    this.actionHeal(cb=>{
      if(this.checkES('舒缓'))target.removeABuff('debuff');
      cb();
      this.addBuff(Buff.getKey(this.name, '战技', '持续治疗[战技]'), target, 1, {count:this.checkES('调理')?3:2});
    },'NS', target, 'single', this.getBaseHeal('ns'), 30);
  }
  castUS(target){
    super.castUS(target);
    this.actionHeal(cb=>{
      if(this.checkSoul(2)) {
        this.team.getAliveUnits('members').forEach(m => {
          if(m.checkHp(30)) this.addBuff(Buff.getKey(this.name, '星魂', '持续治疗[终结技]'), m);
        })
      }
      cb();
    },'US', target, 'all', this.getBaseHeal('us'), 5);
  }
  castSP() {
    super.castSP(()=>{
      const debuffKey = Buff.getKey(this.name, '秘技', '伤害降低');
      const enemies = this.team.getAliveUnits('enemies');
      enemies.forEach(e => this.addBuffRandom(debuffKey, e, 1, {count:1}, 1, 1));
      A.startBattleDmg(this, 1, this.rawFuncRate(0, 80), 'single', D.sample(enemies));
    });
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='B_DMG_E') {
      if(this.checkAlive() && this.checkSoul(1) && this.checkHp(30) && !this.state.autoHeal) {
        this.triggerHeal([this], this.getAttr('hp') * 0.15 + 400);
        this.state.autoHeal = true;
      }
      this.addEn(5);
    } else if(e==='C_DMG_E' && this.checkSoul(6) && D.checkType(data.type, 'NA')) {
      A.newAddDmg(this, this, data.targets, this.getAttr('hp')*0.4);
    }
    super.onEvent(e, unit, data);
  }
  getLiveReport(enemy){
    const list = R.getDefendReport(this, enemy);
    list.push({
      type:'heal', name:'战技[回复]', labels:['即时治疗','持续治疗'],
      heal0: C.calHealData(this.getBaseHeal('ns'), this, this),
      heal1: C.calHealData(this.getBaseHeal('ns', 'hot'), this, this),
    },{
      type:'heal', name:'终结技[回复]', labels:['即时治疗'], heal0: C.calHealData(this.getBaseHeal('us'), this, this),
    });
    if(this.checkSoul(2)) {
      const i = list.length-1;
      list[i].labels.push('持续治疗');
      list[i].heal1 = C.calHealData(this.getAttr('hp') * 0.06 + 160, this, this);
    }
    if(this.checkSoul(1)) {
      list.push({
        type:'heal', name:'自救[回复]', tip:'生命值低于30%自动触发', labels:['一次性治疗'], heal0: C.calHealData(this.getAttr('hp') * 0.15 + 400, this, this, this.checkHp(30)?0: 30),
      });
    }
    return list;
  }
  getDamageReport(enemy){
    const list = [Object.assign({ type:'damage', name:'普通攻击', brkDmg: C.calBrkDmg(this, enemy, 1)}, C.calDmg(this.getBaseDmg('na'), ['Physical','NA'], this, enemy))];
    if(this.checkSoul(6)) {
      list.push(Object.assign({ type:'damage', name:'附加伤害'}, C.calDmg(this.getAttr('hp')*0.4, ['Physical','AD'], this, enemy)));
    }
    list.push(R.getBreakReport(this,enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SrNatasha,
};