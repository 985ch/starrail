'use strict';

const Attributes = require('./attributes');
const C = require('./compute');

class BaseWeapon {
  constructor(character, star, level, upgraded) {
    this.character = character;
    this.base = this.getBase();
    this.star = star;
    this.level = level;
    this.upgraded = upgraded;
    this.data = this.base.data[star-1];
    this.attr = new Attributes();
    this.attr.fillBaseAttributes(this.base, level, upgraded);
  }
  // 获取基础数据
  getBase() { return {} }
  // 获取描述文本
  getDesc() { return '' }
  // 获取武器三项基本属性
  getBaseAttributes() {
    return {
      hp: this.attr.data.hp,
      atk: this.attr.data.atk,
      def: this.attr.data.def,
    }
  }
  // 获取武器额外属性
  getExtendAttributes() {
    return {};
  }
  // 获取武器可以提供的所有增益和减益效果
  getBuffList(){
    return [];
  }
  // 获取武器增益或减益效果的数值
  getBuffData( /* buff */ ){
    return {};  // 返回一个对象表示buff已生效，返回null表示buff尚未生效
  }
  // 获取武器的报告数据
  getReportData(/* target, options */) {
    return [];
  }
  // 将武器数据保存为JSON
  toJSON(){
    return {
      name: this.base.name,
      star: this.star,
      level: this.level,
      upgraded: this.upgraded,
    };
  }
  // 检查和角色的类型是否相同
  checkSameJob() {
    return this.base.job === this.character.base.job;
  }
  // 获取自身附加伤害的报告
  getAdditionDamageReport(enemy, data) {
    const member = this.character;
    if(!enemy) return [];

    const { baseAttr, rate, type, isDot, title, turn, baseHit, tip, count } = data;
    const base = member.getAttr(baseAttr);
    const damage = member.getAdditionDamage(base * rate * 0.01, enemy, type || null, isDot || false);
    if(isDot) {
      const hitRate = C.calHitRate(baseHit * 0.01, member, enemy, count || 1, false, true );
      return [{
        type: 'dot', name: title,  tip: tip || '',
        totalDamage: damage.damage * turn, damage: damage.damage, turn, hitRate
      }]
    }
    return [Object.assign({ type:'damage', name: title, tip: tip || '' }, damage)];
  }
  // 添加事件监听(仅用于外部对象，武器持有者的事件无需监听)
  addListens() {}
  // 响应事件
  onEvent( /*evt, unit, data*/ ) {
  }
  // 更新冷却回合信息，并返回是否可以触发事件
  updateCD(count, allTurn = false, trigger = true) {
    const c = this.character;
    const curTurn = allTurn? c.team.state.turn : c.state.turn;
    const ws = c.state.weapon;
    if((ws.cdTurn || ws.cdTurn === 0 ) && curTurn - ws.cdTurn < count) {
      return false;
    }
    if(trigger)ws.cdTurn = curTurn;
    return true;
  }
}

module.exports = BaseWeapon;