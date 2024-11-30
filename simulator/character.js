'use strict';

const Attributes = require('./attributes');
const BattleUnit = require('./battle_unit');
const Equipment = require('./equipment');
const equipStore = require('./equip_store');
const { stringifyEquip } = require('./equip_generator');
const { createWeapon } = require('./weapons/index');
const Buff = require('./buff');
const BreakDebuff = require('./debuff_break');
const C = require('./compute');
const A = require('./action');
const { clone, pick } = require('../utils/util')
const { setsClass } = require('./equipments/index');

const baseKeys = ['baseHp', 'baseAtk', 'baseDef', 'baseSpeed', 'baseHate'];

class Character extends BattleUnit {
  constructor(team, index, { level = 80, upgraded = false, soul = 0, skills = null, weapon = null, equip = null, state = null, ai = null, v = 1 }) {
    super(team, index, '', level, 'members', state);
    this.name = this.base.name;
    this.upgraded = upgraded;
    this.soul = soul;
    this.skills = skills || { na:1, ns:1, ps:1, us:1, ex:[1, 1, 1], attr:[ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] };
    this.skillData = this.getSkillData();
    this.setWeapon(weapon);
    if(v === 1) this.updateEquipID(equip);
    this.equip = new Equipment(this, equip);
    this.report = null;
    this.ai = ai || clone(this.base.ai) || null;
    this.fixedSpeed = 0;
  }
  // 配置武器
  setWeapon(json) {
    if(!json){
      this.weapon = null;
    } else {
      this.weapon = createWeapon(this, json);
    }
  }
  // 获取技能数值
  getSkillData() {
    const { base, skills, soul } = this;
    return {
      na: base.na[skills.na - 1 + (soul >=base.naSoul? base.naAdd || 1 : 0 )],
      ns: base.ns[skills.ns - 1 + (soul >=base.nsSoul? base.nsAdd || 2 : 0 )],
      us: base.us[skills.us - 1 + (soul >=base.usSoul? base.usAdd || 2 : 0 )],
      ps: base.ps[skills.ps - 1 + (soul >=base.psSoul? base.psAdd || 2 : 0 )],
    }
  }
  // 获取技能等级数据
  getSkillLevels() {
    const { base, skills, soul } = this;
    return [
      [skills.na, (soul >=base.naSoul? base.naAdd || 1 : 0 )],
      [skills.ns, (soul >=base.nsSoul? base.nsAdd || 2 : 0 )],
      [skills.us, (soul >=base.usSoul? base.usAdd || 2 : 0 )],
      [skills.ps, (soul >=base.psSoul? base.psAdd || 2 : 0 )],
    ]
  }
  // 检查星魂是否达标
  checkSoul(n) { return this.soul >= n }
  // 检查额外技能是否开启
  checkES(val) {
    if(typeof val==='number') {
      return this.skills.ex[val] !== 0;
    }
    const idx = this.base.es.indexOf(val);
    return this.skills.ex[idx] !== 0;
  }
  // 获取敌人
  getEnemy() { return this.team.enemies[this.team.curEnemy] }
  // 获取当前生效中的最大护盾
  getMaxShield() {
    let max = 0;
    this.filterBuffs({ tag: 'shield'}).forEach(buff => {
      max = Math.max(max, buff.state.shield);
    });
    return max;
  }
  // 重置数据
  reset(){
    super.reset();
    this.report = null;
  }
  updateData() {
    super.updateData();
    this.report = null;
  }
  // 重置角色基本属性
  resetBaseAttributes() {
    this.attr.mergeAttributes([{
      enRate: 100,
      speed: this.base.speed,
      criRate: this.base.criRate,
      criDamage: this.base.criDamage,
      enMax: this.base.enMax,
      hate: this.base.hate,
    }]);
    this.attr.fillBaseAttributes(this.base, this.level, this.upgraded);
    if(this.weapon) {
      this.attr.mergeAttributes(this.weapon.getBaseAttributes());
    }
  }
  // 获取额外属性
  getExtendAttributes() {
    // 计算角色额外属性（技能，光锥，遗器）
    const attributes = this.base.attributes.filter((obj, idx)=> {
      return this.skills.attr[idx] > 0;
    });
    if(this.weapon && this.weapon.checkSameJob()) {
      attributes.push(this.weapon.getExtendAttributes());
      this.weapon.addListens();
    }
    attributes.push(this.equip.getAttributes(), { speed: this.fixedSpeed });
    this.equip.addListens();
    return attributes;
  }
  // 获取当前状态
  getState() {
    return Object.assign({
      hpMax: this.getAttr('hp'),
      enMax: this.base.enMax,
      shield: this.getMaxShield(),
    }, this.state);
  }
  // 重置状态
  resetState(isReborn = false) {
    super.resetState();
    this.state.weapon = {}; // 武器状态
    this.state.en = isReborn ? 0 : this.base.enMax * 0.5; // 能量
  }
  // 获取基础伤害
  getBaseDmg(key1, key2 = 'rate', attr='atk') {
    return this.getAttr(attr)*this.skillData[key1][key2]*0.01;
  }
  // 获取源伤害函数
  rawFunc(brkDmg, key1, key2, attr) {
    return ()=>{ return { brkDmg, raw: this.getBaseDmg(key1, key2, attr) }};
  }
  // 固定倍率源伤害函数
  rawFuncRate(brkDmg, rate, attr = 'atk') {
    return ()=>{ return { brkDmg, raw: this.getAttr(attr)*rate*0.01 }};
  }
  // 获取扩散伤害函数
  rawDiffFunc(brkDmgC, brkDmgD, keyS, keyC, keyD, attr) {
    return (i)=>{ return {
      brkDmg: i===0? brkDmgC : brkDmgD,
      raw: this.getBaseDmg(keyS, i===0? keyC: keyD, attr),
    }}
  }
  // 获取随机攻击伤害函数
  rawRandFunc(brkDmgA, brkDmgB, key1, key2, attr) {
    return (idxT, idxH)=>{ return { brkDmg: idxH===0? brkDmgA : brkDmgB, raw: this.getBaseDmg(key1, key2, attr)}};
  }
  // 获取基础治疗
  getBaseHeal(key1, key2 = 'heal', attr='hp') {
    return this.getAttr(attr)*this.skillData[key1][key2+'R']*0.01 + this.skillData[key1][key2];
  }
  // 获取角色特殊状态文本
  getStateExText() {
    return '-';
  }
  getStateExData() {return 0};
  // 能量增加
  addEn(en, ignoreBonus = false) {
    //console.trace();
    //console.log(this.name, en);
    en = ignoreBonus? en : C.calEnergy(en, this);
    const before = this.state.en;
    this.state.en = Math.max(0, Math.min(this.state.en + en, this.base.enMax));
    this.triggerEvent('EN_CHANGE', {before, after: this.state.en, en});
  }
  // 修改技能点数
  changeSp(sp) {
    const ts = this.team.state;
    const before = ts.sp;
    ts.sp = Math.max(0, Math.min(ts.sp + sp, ts.spMax));
    if(ts.inBattle)this.triggerEvent('SP_CHANGE', {member: this, before, after: ts.sp, sp})
  }
  // 按百分比消费生命，最多消费到只剩1点
  costHp(percent) {
    let change = Math.min(this.getAttr('hp')*percent*0.01, this.state.hp - 1);
    this.team.logger.logDamage(null, this, change, 0, 'COST');
    this.changeHp(-change, this, 'cost');
    return change;
  }
  // 获取准备阶段的行动
  getReadyActions() {
    return [{
      text: '进战',
      key: 'start',
      target: 'enemies',
    },{
      text: '秘技',
      key: 'sp',
      target: this.base.psTarget || 'enemies',
      disable: this.team.state.sp <= 0,
    }];
  }
  // 获取战斗中角色可以执行的行动
  getBattleActions(isMyTurn) {
    return isMyTurn ? [{
      text: '普攻',
      key: 'na',
      target: 'enemy',
      disable: this.checkDisableNA(),
    },{
      text: '战技',
      key: 'ns',
      target: this.base.nsTarget || 'enemy',
      disable: this.checkDisableNS(),
    }] : [];
  }
  // 获取终结技数据
  getUsAction() {
    return {
      text: '终结技',
      key: 'us',
      target: this.base.usTarget || 'enemy',
      disable: !this.checkAlive() || this.checkDisableUS(),
    }
  }
  // 响应行动
  onAction(data) {
    const t = data.target;
    if(!t) return;
    switch(data.key) {
      case 'na':
        this.castNA(t);
        break;
      case 'ns':
        this.castNS(t);
        break;
      case 'us':
        this.castUS(t);
        break;
      case 'sp':
        this.triggerEvent('SP_CAST', { member: this })
        this.castSP();
        break;
      case 'start':
        this.castStartBattle();
        break;
      default:
        break;
    }
    super.onAction(data);
  }
  // 角色禁用自动行动
  autoAction(){}
  // 进入战斗并完成1点破韧
  castStartBattle() {
    this.team.enterBattle(this, false, ()=> A.startBattleDmg(this));
  }
  // 进入战斗并完成破韧
  castSP(func) {
    this.team.enterBattle(this, true, ()=>{
      if(!func) return;
      A.actionBase({type:'SP', member: this}, func);
    });
  }
  // 响应SP触发事件
  onSP() {
    if(this._onSP)A.actionBase({type:'SP', member: this}, ()=>this._onSP());
  };
  // 普攻
  castNA(target, attr = 'atk', func) {
    func = func || (cb => cb());
    this.actionAttack(func, 'NA', target, 'single', 20, this.rawFunc(1, 'na', 'rate', attr), this.base.naHits);
    this.changeSp(1);
  }
  checkDisableNA() {
    return !this.canAction()
  };
  // 战技
  castNS(target) { this.changeSp(-1) }
  checkDisableNS() {
    return !this.canAction() || this.team.state.sp <= 0
  };
  // 终结技
  castUS(target) { this.state.en = 0;}
  checkDisableUS() {
    return  !this.checkAlive() || this.state.en < this.base.enMax || this.findBuff({tag:'freeze'})
  };
  // 获取角色可以提供的所有增益和减益效果
  getBuffList(){
    const list = [];
    if(this.weapon && this.weapon.checkSameJob()) {
      list.push(...this.weapon.getBuffList());
    }
    list.push(...this.equip.getBuffList());
    list.push(...this.getCharacterBuffList());
    const breakData = BreakDebuff[this.base.type];
    list.push(Buff.getListJson(this, breakData.Debuff, breakData.listens, '', {attr: this.base.type }));
    return list;
  }
  // 获取角色增益或减益效果
  getCharacterBuffList(){
    return [];
  }
  // 响应造成击破事件
  onCastBreak(data) {
    const { target } = data;
    const { damage, lateRate } = this.getBreakDamage(target);
    // 追加击破伤害
    A.newAddDmg(this, this, [target], damage, false, this.base.type, 'BRK', {}, ()=>{
      return { damage, expDamage: damage };
    });
    // 添加击破效果
    const breakData = BreakDebuff[this.base.type];
    const key = Buff.getKey(this.name, '击破', breakData.Debuff.info().name);
    this.addBuff(key, target, breakData.getValue(target));
    //console.log('AddBreakBuff', lateRate);
    // 追加击破延迟
    if(target.checkMyTurn() && !target.team.state.acted){
      target.team.state.acted = true;
      target.setNextWaitTime(lateRate);
    } else {
      target.changeWaitTime(lateRate);
    }
  }
  // 响应事件
  onEvent(e, unit, data) {
    if(unit===this){
      switch(e) {
        case 'C_KILL':
          this.addEn(10, false, false, true);
          break;
        case 'C_BREAK':
          this.onCastBreak(data);
          break;
        default:
          break;
      }
    }
    super.onEvent(e, unit, data);
    if(this.weapon)this.weapon.onEvent(e, unit, data);
  }
  // 获取角色评价报告数据
  getReportData(){
    if(this.report) return this.report;
    const enemy = this.getEnemy();
    if(!enemy) return { reportList:[] };
    this.report = this.updateReport(enemy);
    return this.report;
  }
  // 更新角色评价报告数据
  updateReport(/*enemy*/){
    return { reportList:[] };
  }
  // 获取角色击破伤害相关数据
  getBreakDamage(target, options) {
    return C.calBreakDamage(this, target,  this.base.type, options);
  }
  // 获取角色追加伤害相关数据
  getAdditionDamage(base, enemy, type = null, isDot = false){
    const types = [ type || this.base.type ];
    types.push(isDot?'DOT' : 'AD');
    return C.calDmg(base, types, this, enemy);
  }
  // 触发一次超击破造成伤害
  castSuperBrkDmg(target, brkDmg, rate, bonus = 0, type = null) {
    const damage = C.calSuperBrkDmg(this, target, type || this.base.type, brkDmg, rate, bonus);
    A.newAddDmg(this, this, [target], damage, false, this.base.type, 'BRK', {}, ()=>{
      return { damage, expDamage: damage };
    });
  }
  
  // 将角色数据保存为JSON
  toJSON(){
    return {
      name: this.name,
      level: this.level,
      upgraded: this.upgraded,
      soul: this.soul,
      skills: this.skills,
      weapon: this.weapon ? this.weapon.toJSON() : null,
      equip: this.equip ? this.equip.toJSON() : null,
      state: this.state,
      ai: this.ai || null,
      v: 2,
    }
  }
  // 序列化数据
  stringify() {
    const { na, ns, us, ps, ex, attr } = this.skills;
    let text = `${this.name}[${this.soul}]${this.level}${this.upgraded? '+':'-'}${na-1}${ns-1}${us-1}${ps-1}${ex.join('')}${attr.join('')};`;
    const weapon = this.weapon;
    if(weapon) {
      text += `${weapon.base.name}[${weapon.star}]${weapon.level}${weapon.upgraded? '+':'-'};`;
    } else {
      text +="无;"
    }
    const equipments = this.equip.equipments;
    for(let key in equipments) {
      const equip = equipments[key];
      if(equip) {
        text += stringifyEquip(equip) + ';';
      }else{
        text +="无;"
      }
    }
    return text;
  }
  // 获取当前的遗器buff并记录
  getActivatedEquipBuffs() {
  }
  // 获取影子数据，用于配装
  getShadowData(enemy, activatedBuffs, setList) {
    const shadowData = {};
    const removedBuffs = {};
    const oldAttr = clone(this.attr.data);
    // 清空遗器以避免遗器数据影响计算
    this.equip = new Equipment(this, null);
    this.reset();
    // 处理buff数据
    this.attr = new Attributes(this.staticAttr.data); // 复制静态面板
    this.attr.data.hp = this.staticHp;
    this.attr.data.atk = this.staticAtk;
    this.attr.data.def = this.staticDef;
    this.attr.data.speed = this.staticSpeed;
    this.attr.data.hate = this.staticHate;
    // 计算固定增益效果，同时获取所有转换属性配置并记入转换列表
    const transList = [];
    const buffs = this.filterBuffs({ target: [this.name, this.faction]});
    for(let i=0; i<buffs.length; i++) {
      const buff = buffs[i];
      if(buff.member === this && buff.getInfo().source === '遗器'){
        if(buff.value > 0)removedBuffs[buff.getInfo().short] = buff.value;
      } else {
        this.getShadowBuffData(buffs[i], enemy, this.attr);
      }
    }
    this.updateBaseAttributes(this.attr);
    shadowData.member = Object.assign(pick(this, baseKeys), {
      main: this.base.mainAttr || 'atk',
      type: this.base.type,
      oldAttr: oldAttr,
      attr: clone(this.attr.data),
    });
    shadowData.enemy = pick(enemy, baseKeys);
    shadowData.enemy.attr = {...enemy.getAttributesB(this)};

    // 获取转换属性配置并记入转换列表
    const attrTrans = new Attributes();
    for(let i=0; i<buffs.length; i++) {
      if(buffs[i].member !== this || buffs[i].getInfo().source !== '遗器') this.getShadowBuffTrans(buffs[i], attrTrans, transList);
    }
    shadowData.member.attrT = clone(attrTrans.data);

    shadowData.transList = transList;
    // 计算套装数据
    const setBuffs = {};
    for(let setNames of setList) {
      for(let key of setNames) {
        const set = new setsClass[key](this);
        const sInfo = set.getSetInfo(4, enemy, activatedBuffs? activatedBuffs[key]: removedBuffs);
        setBuffs[key] = {
          set2: sInfo.set2,
          set4: sInfo.set4 || null
        };
      }
    }
    shadowData.setBuffs = setBuffs;
    return shadowData;
  }
  /* TODO: 计算依赖词条，用于提高配装精准性，目前是人为划定转换范围来实现，但有效词条的增加仍会带来计算量大幅度增加的问题
    理想情况是对遗器进行筛选的时候多筛选出一些遗器并且这些遗器并确保这些遗器仅在特定情况下参与计算
  */
  fillNeedAttrs(data, attrs, attrKeys, setList, main) {
    const cData = new Attributes(data);
    cData.mergeAttributes([
      Equipment.getMainWordValue('hp','SSR',15),
      Equipment.getMainWordValue('atk','SSR',15),
    ]);
    for(let key in main) {
      if(main[key])cData.mergeAttributes(Equipment.getMainWordValue(main[key],'SSR',15));
    }
    const newAttrs = this._fillNeedAttrs(cData, attrKeys, this.base.needAttrs);
    for(let setNames of setList) {
      const ignoreMin = (setNames.length===1);
      for(let key of setNames) {
        const needAttrs = setsClass[key].getDesc().needAttrs;
        const setAttrs = this._fillNeedAttrs(cData, attrKeys, needAttrs, ignoreMin);
        setAttrs.forEach(attr => {
          if(!newAttrs.includes(attr)) newAttrs.push(attr);
        });
      }
    }
    const list =[...attrKeys, ...newAttrs].filter(key => {
      const ignore = attrs[key] && (attrs[key][0]===0 && cData[key]>attrs[key][1] || cData[key]>attrs[key][2]);
      return !ignore;
    });
    return list;
  }
  // 尝试填充依赖词条
  _fillNeedAttrs(data, attrs, needAttrs, ignoreMin = false) {
    const newAttrs = [];
    if(!needAttrs) return newAttrs;
    for(let i=0; i<needAttrs.length; i++) {
      const info = needAttrs[i];
      if(attrs.includes(info.raw)) continue;
      let ignore = true;
      for(let j=0; j<info.tar.length; j++) {
        if(attrs.includes(info.tar[j])) {
          ignore = false;
          break;
        }
      }
      if(ignore) continue;
      const val = data.data[info.raw];
      if((ignoreMin || val>=info.range[0]-0.0001) && val<=info.range[1]+0.0001) {
        newAttrs.push(info.raw);
      }
    }
    return newAttrs;
  }
  // 为旧版本遗器数据添加遗器ID
  updateEquipID(list) {
    for(let equip of list) {
      if(equip.id) continue;
      const index = equipStore.findIndex(equip, false);
      if(index<0) continue;
      const e = equipStore.getList(equip.part)[index];
      equip.id = e.id;
      equip.locked = e.locked;
    }
    return list;
  }
}

module.exports = Character;