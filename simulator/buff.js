'use strict';
const D = require('./data');
const C = require('./compute');
const A = require('./action');
// buff数据模板
const buffTemplate = {
  name: 'buff', // 名称
  short: 'buff', // 短名称
  source: '', // buff来源,来源名包括'普攻','战技','终结技','天赋','秘技','星魂','光锥','遗器','击破'
  desc: '', // 静态描述
  show: true, // 是否展示
  maxValue: 0, // 最大叠加层数，为0表示静态buff，为1表示不可叠加，大于1表示可叠加多层
  target: 'self', //目标类型,可选'self','member','members', 'enemy', 'enemies'
  tags: ['buff'], // 标签
}
// buff基础对象
class Buff {  
  constructor(key, member, target, data, value, state, listens = []) {
    this.key = key;
    this.member =  member;
    this.target =  target;
    this.value = value;
    this.data = data;
    this.state = state || {};
    this.lastTransAttr = {};
    if(!this.state.count) this.state.count = 1;
    this.state.startTurn = this.member.team.getTurnInfo() || {};
    this.listenTargets = [];
    this.listens = [];
    listens.forEach(obj => this.listen(obj));
    this.init();
  }
  // 初始化，触发事件也放在这里
  init() {}
  // 获取基础信息
  getInfo() { return this.constructor.info(this.data, this.member) }
  // 获取buff提供的属性
  getAttributes(/* target*/){
    return null;
  }
  isStatic() { return this.getInfo().maxValue === 0 }
  getTurnText(){ return this.isStatic()?'': `(剩余${this.state.count})`}
  // 添加后操作
  afterAdd() {}
  // 移除前操作
  beforeRemove(newBuff) {}
  // 获取转化类属性
  getTransAttr() {
    return null;
  }
  // 获取buff提供的针对特定目标的属性，这种属性仅在对数据进行计算前结算
  getAttributesT(/* target, self*/){
    return null;
  }
  // 获取buff针对特定目标的属性，这种属性仅在受到特定目标伤害时进行结算
  getAttributesB(/* target, self*/){
    return null;
  }
  // 获取buff是否激活，仅用于静态效果
  isActivated(/* target, self*/) {
    return true;
  }
  // 抵抗一次异常状态，如果抵抗成功返回true，否则返回false
  blockDebuff() { return false }
  // 获取附加报告的数据
  getReportData(/* target, options */) {
    return [];
  }
  // 堆叠层数
  stack(sameBuff) {
    const maxValue = this.getInfo().maxValue;
    if(maxValue === 0) return;
    this.value = Math.max(0, Math.min(sameBuff.value + this.value, maxValue));
  }
  // 检查buff是否包含特定tag
  checkTag(tag) {
    return this.getInfo().tags.includes(tag);
  }
  // 获取buff实时描述信息
  getDesc() {
    return this.getInfo().desc;
  }
  // 判断是否同一个buff
  checkSameBuff( buff ){
    return this.key === buff.key && this.target === buff.target;
  }
  // 判断是否属于特定类
  checkBuffClass( buffClass) {
    return this instanceof buffClass;
  }
  // 标记所有受影响目标为待更新
  markTargets(delay, exclude = null) {
    this.getTargets().forEach(target => {
      if(!target || target===exclude)return;
      if(!delay && this.member.team.battleMode) {
        target.updateData();
      } else {
        target.needUpdate = true;
      }
    });
  }
  // 获取目标名字
  getTargetName() { return this.target.name || this.target }
  // 获取当前buff的所有目标对象
  getTargets(text) {
    text = text || this.getInfo().target;
    return Buff.getBuffTargets(text, this.member, this.target);
  }
  // 获取buff在角色数据上的状态（该状态不会因buff的更新而丢失）
  getBuffState(unit) {
    unit.state[this.key] = unit.state[this.key] || {};
    return unit.state[this.key];
  }
  // 更新冷却回合信息，并返回是否可以触发事件
  updateCD(unit, count, allTurn = false, trigger = true) {
    const curTurn = allTurn? unit.team.state.turn : unit.state.turn;
    const bs = this.getBuffState(unit);
    if((bs.cdTurn || bs.cdTurn === 0 ) && curTurn - bs.cdTurn < count) {
      return false;
    }
    if(trigger)bs.cdTurn = curTurn;
    return true;
  }
  // 触发持续伤害或击破伤害或追加伤害
  triggerDot(type='DOT', percent = 1, options={}) {
    const t = this.target;
    const data = this.getData(t);
    const rawDmg = (typeof data === 'number')? data * percent: data.damage * percent;
    const m = this.member;
    A.newAddDmg(m, m, [t], rawDmg, true, this.data && this.data.type, type, options, (types, member, target)=>{
      const { crit, criDmg } = C.calDmgData(types, member, target);
      return { damage: rawDmg, expDamage: rawDmg * (1 + crit * criDmg), criDamage: rawDmg * (1 + criDmg) };
    });
  }
  // 添加监听事件
  listen({e, t, f}) {
    const targets = this.getTargets(t || 'member');
    for(let i=0; i<targets.length; i++) {
      targets[i].listenEvent(e, this);
      if(this.listenTargets.indexOf(targets[i]) === -1) {
        this.listenTargets.push(targets[i]);
      }
    }
    this.listens.push({ e, t: targets, f });
  }
  // 响应监听事件
  onEvent(e, unit, data) {
    this.listens.forEach(obj => {
      if(e===obj.e || (Array.isArray(obj.e) && obj.e.indexOf(e) >= 0)) {
        if(obj.t.indexOf(unit) >= 0) obj.f(this, unit, data);
      }
    })
    if(this.state.count<=0) this.member.removeBuff(this, true);
  }
  // 获取buff基本信息
  static info(/* data, member */) {
    return buffTemplate;
  }
  // 获取buff类的key
  static getKey(charName, source, buffName, key = '') {
    return `${charName}$${source}$${buffName}.${key}`;
  }
  // 根据目标类型和相关数据获取目标
  static getBuffTargets(tarType, member, target) {
    const team = member.team;
    tarType = (typeof target==='string' && ['member','enemy'].indexOf(tarType)>=0)? target: tarType;
    switch(tarType) {
      case 'all':
        return team.members.concat(team.enemies).filter(u=>u);
      case'members':
        return team.members.filter(u=>u);
      case 'enemies':
        return team.enemies.filter(u=>u);
      case 'self':
        return [ member ]
      default: //'member','enemy'
    }
    return target && typeof target!=='string'? [ target ] : [];
  }
  // 为列表生成一个JSON对象
  static getListJson(character, buffClass, listens = [], key = '', data = null) {
    const { source, name, short } = buffClass.info(data, character);
    return {
      character,
      key: this.getKey(character.name, source, name, key),
      source,
      name,
      short,
      buffClass,
      data,
      listens,
    }
  }
  // 构造一个单属性的buff类
  static createAttrBuff({attr, short, desc = null, tags = [], minus = false, target }) {
    class BuffAttr extends Buff {
      static info(data) {
        const { name, source, hide, maxValue} = data;
        tags = data.tags || tags;
        if(maxValue > 0) tags.push('removable');
        return {
          name: name,
          short,
          source: source,
          desc: D.AttributeText[attr].short + (minus?'降低':'提高'),
          show: hide? false : true,
          maxValue: maxValue || 0,
          target: data.target || target || 'self',
          tags,
        };
      }
      getDesc() {
        const attrInfo = D.AttributeText[attr];
        const n = this.value;
        const value = this.data[attr];
        const valueText = (attrInfo.type==='percent')? D.toPercent( value* n) : Math.floor(value * n);
        return `${this.data.desc || ''}${desc || attrInfo.short}${minus?'降低':'提高'}${valueText}。`;
      }
      getAttributes() {
        const value = minus? -this.data[attr]: this.data[attr];
        return {
          [attr]: value * this.value,
        }
      }
    }
    return BuffAttr;
  }
  // 构造事件监听器，用于监听特定的事件并在事件触发后扣除剩余次数
  static eventListener(e, t) {
    return { e, t, f:buff => buff.state.count-- }
  }
  // 构造伤害监听器，用于监听特定的伤害事件并在特定伤害事件触发后扣除剩余次数
  static damageListener(e, types, t = 'member') {
    return { e, t, f:(buff, unit, data)=> {
      if(D.checkType(data.type, types))buff.state.count--;
    }}
  }
  // 构造一个常规监听器，用于在回合结束后扣除剩余次数，触发回合不计入
  static simpleListener(skipStartTurn = true, t='member') {
    return { e: 'TURN_E', t, f:(buff, u, { unit, turn }) => {
        const st = buff.state.startTurn;
        if(skipStartTurn && st && st.unit===unit.name && st.turn===turn) return; // 触发回合不扣除剩余回合数
        buff.state.count--
      }
    }
  }
  // 构造一个持续伤害监听器
  static dotListener(type='DOT') {
    return { e: 'TURN_S', f:(buff, unit) =>{
      buff.state.count--;
      buff.triggerDot(type, 1, { noCrit: true });
    }}
  }
  // 构造一个持续治疗监听器
  static hotListener(type='HOT') {
    return { e: 'TURN_S', f: (buff, unit)=>{
      buff.member.triggerHeal([unit], buff.getData(unit));
      buff.state.count--;
    }}
  }
  // 返回一个实现禁止行动的监听器
  static freezeListener(isFreeze = true, noCrit = false) {
    return { e: 'TURN_S', f:(buff, unit) => {
      buff.state.count--;
      buff.target.team.state.acted = true;
      if(isFreeze){
        buff.triggerDot('AD', 1, { noCrit });
        unit.setNextWaitTime(50);
      }
    }};
  }
  // 构造一个标记目标的监听器
  static markListener(e, t = 'member') {
    return {e, t, f:(buff)=>buff.markTargets()};
  }
}

module.exports = Buff;