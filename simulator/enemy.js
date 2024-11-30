'use strict';

const Buff = require('./buff');
const D = require('./data');
const BattleUnit = require('./battle_unit');
const { DebuffWeak } = require('./debuff_simple');

const typeParseJson = {
  '火':'Fire',
  '冰':'Ice',
  '风':'Wind',
  '雷':'Thunder',
  '物':'Physical',
  '量':'Quantum',
  '虚':'Void',
}
const valueParseInfo = [
  ['level', 1, 95],
  ['hp', 1, 999999],
  ['isPig', 0, 1],
  ['shield', 1, 50],
  ['atk', 0, 99999],
  ['speed', 1, 250],
  ['dodge', 0, 50],
  ['def', 0, 99999],
  ['first', 0, 100],
];
// 破韧的debuff
class DebuffBreak extends Buff {
  static info() {
    return {
      name: '破韧',
      short: '破韧',
      source: '击破',
      desc: '护盾被击破，失去10%减伤',
      show: true,
      maxValue: 1,
      target: 'self',
      tags: ['破韧'],
    };
  }
  getAttributes(){
    return { damageRate: 1.0/0.9 };
  }
}

class Enemy extends BattleUnit {
  constructor(team, idx, json, state) {
    json = json || { level: 75, dodge: 20, shield: 8, hp: 200000, atk: 500, speed: 100, weakList:['Physical', 'Quantum', 'Void'] };
    const name = '木人桩' + (idx + 1);
    const rarity = json.shield>=8?'SSR':(json.shield<3?'R':'SR');
    super(team, idx, name, json.level, 'enemies', state);
    this.baseAttr = {
      hp: json.hp,
      atk: json.atk,
      def: json.def>0? json.def: (json.isPig? 300 + json.level * 15 : 200 + json.level * 10),
      speed: json.speed,
      dodge: json.dodge,
      damageRate: 0.9,
      defendAll: 20,
    };
    this.base = {
      name,
      rarity,
      type: 'Physical',
      speed: json.speed,
      image: 'enemy.jpg'
    },
    this.shield = json.shield;
    this.weakList = json.weakList;
    this.template = json.template || null;
    this.isPig = json.isPig || 0;
    this.firstAction = json.first || 0;
    this.def = json.def || 0;
    this.reset();
  }
  // 重置数据
  resetBaseAttributes(){
    this.attr.mergeAttributes(this.baseAttr);
  }
  // 重置状态
  resetState() {
    super.resetState();
    this.state.shield = this.shield;
  }
  // 是否精英
  isElite() { return this.shield >= 8}
  // 获取敌人可以提供的所有增益和减益效果
  getBuffList(){
    return this.weakList.map(
        weak => Buff.getListJson(this, DebuffWeak, [], weak, { weak })
      ).concat([
        Buff.getListJson(this, DebuffBreak, [Buff.eventListener('TURN_S', 'self')])
      ]);
  }
  // 获取战斗阶段可以执行的行动
  getBattleActions(isMyTurn) {
    if(!isMyTurn || this.baseAtk === 0 )return [];
    return [{
      text: '随机攻击',
      key: 'na',
      target: 'members',
      tarRaw: 'dmg',
      disable: !this.canAction(),
    }];
  }
  // 响应敌人的行动
  onAction(data) {
    let { key, target } = data;
    if(key === 'na') {
      if(target === 'members') {
        target = this.randomMember();
      }
      const atk = this.getAttr('atk');
      const en = atk < 3000 ? 5 : 10;
      this.actionAttack(cb=>cb(), 'NA', target, 'single', en, ()=>{ return { brkDmg:0, raw:atk}}, [1]);
    }
    super.onAction(data);
  }
  // 根据仇恨值随机选中一个成员
  randomMember(){
    const debuff = this.findBuff({tag:'嘲讽'});
    if(debuff && debuff.member.checkAlive()) return debuff.member;

    const members = this.team.members;
    let maxHate = members.reduce( (max, member) => (member && member.checkAlive() && !member.checkHide()) ? member.attr.data.hate + max : max, 0);
    let value = Math.random() * maxHate;
    for(let i = 0; i < members.length; ++i){
      const member = members[i];
      if(!member || !member.checkAlive() || member.checkHide()) continue;
      value -= member.attr.data.hate;
      if(value <= 0) return member;
    }
    return null;
  }
  // 响应受到攻击事件
  onHit(data) {
    super.onHit(data);
    const { attrType, member, target, brkDmg, options, idxT } = data;
    if(target!==this)return;

    const shield = this.state.shield;
    const isWeak = this.findBuff({tag:'weak' + attrType});
    const canBrk = isWeak || (
      options && options.forceBreak && (!Array.isArray(options.forceBreak) || options.forceBreak[idxT])
    );    
    if(brkDmg > 0 && shield > 0 && canBrk) {
      const rate = isWeak? 1: options.forceBreak[idxT] || options.forceBreak;
      const brk = brkDmg * rate;
      const brkData = { member, target, brkDmg: brk, shield, options };
      member.triggerEvent('C_BRKDMG', brkData);
      this.triggerEvent('B_BRKDMG', brkData);
      if(shield - brk < 0.005) {
        this.state.shield = 0;
        member.triggerEvent('C_BREAK', data);
        this.triggerEvent('B_BREAK', data);
      } else {
        this.state.shield -= brk;
      }
    }
  }
  // 恢复护盾
  restoreShield(){
    this.state.shield = this.shield;
    this.triggerEvent('SHIELD_RES', { member: this });
  }
  // 响应事件
  onEvent(e, unit, data) {
    switch(e) {
      case 'BTL_S':
        if(this.firstAction) this.changeWaitTime(-this.firstAction);
        break;
      case 'B_BREAK':
        this.addBuff(Buff.getKey(this.name, '击破', '破韧'), this, 1);
        break;
      case 'TURN_S':
        if(this.state.shield<=0) {
          this.restoreShield();
        }
        if(this.baseAtk <= 0) {
          this.team.state.acted = true;
        }
        break;
      default:
        break;
    }
    super.onEvent(e, unit, data);
  }
  // 把数据保存到JSON
  toJSON(){
    return {
      level: this.level,
      dodge: this.baseAttr.dodge,
      shield: this.shield,
      weakList: this.weakList,
      hp: this.baseHp,
      atk: this.baseAtk,
      def: this.def,
      speed: this.baseSpeed,
      state: this.state,
      template: this.template,
      isPig: this.isPig? 1: 0,
      first: this.firstAction,
    }
  }
  // 序列化输出
  stringify() {
    const info = D.DamageTypeInfo;
    const { weakList, level, hp, shield, atk, speed, dodge, isPig, def, first } = this.toJSON();
    return `${weakList.map(weak => info[weak].text[0]).join('')},${level},${hp},${isPig?1:0},${shield},${atk},${speed},${dodge},${def},${first}`
  }
  // 序列化输入
  static parse(text) {
    if(typeof text !== 'string') return null;
    const list = text.split(',');
    const len = list.length;
    if(len !== 8 && len!==10) return null;
    const json = {}
    let weakList = [];
    for(let i=0; i<list[0].length; i++) {
      const weak = typeParseJson[list[0][i]];
      if(!weak || weakList.includes(weak)) return null;
      weakList.push(weak);
    }
    json.weakList = weakList;
    for(let i=0; i<len-1; i++) {
      const value = parseInt(list[i+1]);
      const info = valueParseInfo[i];
      if(isNaN(value) || value < 0) return null;
      json[info[0]] = Math.max(info[1], Math.min(info[2], value));
    }
    return json;
  }
}

module.exports = Enemy;