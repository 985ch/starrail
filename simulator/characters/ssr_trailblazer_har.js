'use strict';

const { Buff, A, C, D, R } = require('../index');
const Character = require('../character');
const { BuffBreakRate, BuffEnRate } = require('../buff_simple');

const baseData = {
  name: '开拓者(同谐)',
  image: 'trailblazer_har.jpg',
  rarity: 'SSR',
  job: '同谐',
  type: 'Void',
  damages: ['NS','NA'],
  hp: D.levelData['147_1086'],
  atk: D.levelData['60_446'],
  def: D.levelData['92_679'],
  speed: 105,
  criRate: 5,
  criDamage: 50,
  hate: 100,
  enMax: 140,
  na: D.makeTable([['rate'],[50],[60],[70],[80],[90],[100],[110]]),
  naHits: [1],
  naSoul: 5,
  ns: D.makeTable([['rate'],[25],[27.5],[30],[32.5],[35],[37.5],[40.62],[43.75],[46.88],[50],[52.5],[55],[57.5],[60],[62.5]]),
  nsTarget: 'enemy',
  nsHits: [1],
  nsSoul: 3,
  ps: D.makeTable([['en'],[5],[5.5],[6],[6.5],[7],[7.5],[8.125],[8.75],[9.375],[10],[10.5],[11],[11.5],[12],[12.5]]),
  psSoul: 3,
  us: D.makeTable([['breakRate'],[15],[16.5],[18],[19.5],[21],[22.5],[24.37],[26.25],[28.12],[30],[31.5],[33],[34.5],[36],[37.5]]),
  usTarget: 'members',
  usSoul: 5,
  es: [ '卫我起舞', '随波逐流', '剧院之帽' ],
  attributes: [
    { breakRate: 5.3 }, { breakRate: 5.3 }, { breakRate: 8.0 }, { breakRate: 8.0 }, { breakRate: 10.7 },
    { dodge: 4.0 }, { dodge: 6.0 }, { bonusVoid: 3.2 }, { bonusVoid: 4.8 }, { bonusVoid: 6.4 },
  ],
  defaultJson: {
    weapon:'为了明日的旅途', name4: '机心戏梦的钟表匠', name2: '盗贼公国塔利亚',
    body: 'atkRate', foot: 'speed', link:'breakRate', ball:'bonusVoid',
    hp: [1, 0, 0]
  },
  equipSetting: {
    rule: 'dmgBRK',
    main: {
      foot: 'speed',
      link: 'breakRate',
    },
    set4: ['机心戏梦的钟表匠', '机心戏梦的钟表匠'],
    set2: '盗贼公国塔利亚'
  },
};

class BuffBW extends Buff {
  static info() {
    return {
      name: '伴舞',
      short: '伴舞',
      source: '终结技',
      desc: '击破特攻提高，可触发超击破伤害',
      show: true,
      maxValue: 1,
      target: 'members',
      tags: ['buff', '击破', '超击破'],
    };
  }
  getDesc() {
    return `击破特攻提高${this.data.breakRate}%。攻击弱点击破状态的目标时，将削韧伤害转化为1次超击破伤害`;
  }
  init(){
    this.listen({e:'B_DMG_E', t:'enemies', f:(buff, unit, data)=>{
      if(!unit.checkAlive() || unit.state.shield>0) return;
      const bonus = this.member.getSuperBrkBonus();
      const tInfo = data[unit.name];
      if(tInfo.brkDmgEx) data.member.castSuperBrkDmg(unit, tInfo.brkDmgEx, 100, bonus);
    }})
  }
  getAttributes() {
    return { breakRate: this.data.breakRate }
  }
}
class BuffTrailblazerHar extends Buff {
  static info() {
    return {
      name: '监听用buff',
      short: '监听',
      source: '天赋',
      desc: '开拓者（同谐）',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['report'],
    };
  }
  init() {
    const m = this.member;
    this.listen({e:'B_BREAK', t:'enemies', f:(buff, unit)=>{
      m.addEn(this.data.en);
      if(m.checkES('剧院之帽'))unit.changeWaitTime(30);
    }});
  }
  getReportData(target) {
    return [R.getSuperBrkDmgReport(target, target.getEnemy(), 100, this.member.getSuperBrkBonus(), target.base.brkList, '同谐主')];
  }
}
class BuffSoul4 extends Buff {
  static info() {
    return {
      name: '冠冕',
      short: '击破',
      source: '星魂',
      desc: '除开拓者外所有队友击破特攻提升',
      show: false,
      maxValue: 0,
      target: 'members',
      tags: ['buff', '击破'],
    };
  }
  getDesc() {
    return `除开拓者（同谐）外，我方成员击破特攻提高${D.toPercent(this.getData())}。`;
  }
  init() {
    this.listen({e:'UPDATE_DATA', t:'self', f:()=>{
      this.markTargets(true, this.member);
    }})
  }
  getAttributes(target) {
    return target===this.member? {}: { breakRate: this.getData() }
  }
  getData() {
    return this.member.getAttr('breakRate') * 0.15;
  }
}

class SsrTrailblazerHar extends Character {
  getBaseData() { return baseData; }
  getCharacterBuffList(){
    const {ps, us} = this.skillData;
    const list = [
      Buff.getListJson(this, BuffBW, [Buff.eventListener('TURN_S', 'self')], '',us),
      Buff.getListJson(this, BuffTrailblazerHar, [],'',ps),
      Buff.getListJson(this, BuffBreakRate, [Buff.simpleListener()],'',{
        breakRate: 30, name: '击破特攻', source:'秘技', maxValue: 1, target: 'member'
      }),
    ];
    if(this.checkSoul(2)){
      list.push(Buff.getListJson(this, BuffEnRate, [Buff.simpleListener()],'',{
        enRate: 25, name: '回能效率', source:'星魂', maxValue: 1,
      }));
    }
    if(this.checkSoul(4)){
      list.push(Buff.getListJson(this, BuffSoul4));
    }
    return list;
  }
  updateReport(enemy){
    const report = {
      reportList: [
        ...this.getDamageReport(enemy),
        ...R.getEnergyReport(this,{others:[['天赋回能', this.skillData.ps.en]]}),
        ...R.getActionReport(this),
        ...R.getDefendReport(this, enemy),
        ...R.getAdditionReport(this, enemy),
      ]
    }
    return report;
  }
  getStateExText() {
    const count = this.getStateExData();
    return count > 0? '伴舞:' + count: '-';
  }
  getStateExData() {
    const buff = this.findBuff({key:Buff.getKey(this.name, '终结技', '伴舞'), target:'members'});
    return buff? buff.state.count: 0;
  }
  castNS(target) {
    super.castNS(target);
    const count = this.checkSoul(6)? 5: 7;
    const firstBrkDmg = this.checkES('随波逐流')? 2: 1;
    this.actionAttack(cb=>cb(), 'NS', target, 'random', 6, this.rawRandFunc(firstBrkDmg, 1, 'ns'), count, null, {hitAliveOnly:true});
    if(this.checkSoul(1) && !this.state.soul1Activated) {
      this.state.soul1Activated = true;
      this.changeSp(1);
    }
  }
  castUS(target){
    super.castUS(target);
    A.actionBase({type:'US', member:this, target}, ()=>{
      this.addBuff(Buff.getKey(this.name, '终结技', '伴舞'), this, 1, { count: 3 })
      this.addEn(5);
    });
  }
  castSP() {
    super.changeSp(-1);
    this.state.spActivated = true;
  }
  _onSP() {
    this.team.getAliveUnits('members').forEach(member => {
      this.addBuff(Buff.getKey(this.name, '秘技', '击破特攻'), member, 1, { count: 2 })
    })
  }
  getSuperBrkBonus() {
    if(!this.checkES('卫我起舞')) return 0;
    const count = C.between(this.team.getAliveUnits('enemies').length, 1, 5);
    return 70 - (count * 10);
  }
  onEvent(e, unit, data) {
    if(unit!==this) return super.onEvent(e, unit, data);
    if(e==='BTL_S') {
      if(this.state.spActivated)this.onSP();
      if(this.checkSoul(2)) this.addBuff(Buff.getKey(this.name, '星魂', '回能效率'), this, 1, { count: 3 })
    }
    super.onEvent(e, unit, data);
  }
  getDamageReport(enemy) {
    const base = this.getAttr('atk')*0.01;
    const { na, ns } = this.skillData;

    const brkDmg = C.calBrkDmg(this, enemy, 1);
    const list = [
      Object.assign({ type: 'damage', name:'普攻', brkDmg }, C.calDmg(base * na.rate,['Void','NA'], this, enemy)),
      Object.assign({ type: 'damage', name:'战技', tip:`${this.checkES('随波逐流')?'首次削韧'+(brkDmg*2).toFixed(1)+',后续':'每次'}削韧${brkDmg.toFixed(1)},共${this.checkSoul(6)? 7: 5}次。`}, C.calDmg(base * ns.rate, ['Void', 'NS'], this, enemy)),
    ];
    list.push(R.getBreakReport(this, enemy));
    return list;
  }
}

module.exports = {
  data: baseData,
  character: SsrTrailblazerHar,
};