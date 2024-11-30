// 基本可行动单位
'use strict';

class BaseUnit {
  constructor(team, state) {
    this.team = team;
    this.state = state || { wait: 100 }; // 单位状态
    this.actions = [];
  }
  // 重置数据
  reset() {
    this.evtListeners = {};
  }
  // 获取当前状态
  getState() {
    return this.state;
  }
  // 重置状态
  resetState() {
    this.state={ wait: 100, actionRate: 0 };
    this.turnFlags = {};
  }
  // 判断单位是否存活
  checkAlive() {
    return true;
  }
  // 判断单位是否离场，离场后不可行动也不可以被选做攻击目标
  checkHide() {
    return false;
  }
  // 计算行动间隔
  calActionTime() {
    return 100;
  }
  // 修改行动时间
  changeWaitTime(percent, forceChange = false) {
    if(this.checkMyTurn(true) && (!forceChange || (forceChange && this.team.state.acted === true))) {
      this.state.actionRate = (this.state.actionRate || 0) + percent;
    } else {
      this.state.wait = Math.max(0, this.state.wait + this.calActionTime()*percent*0.01);
      this.team.updateActionUnit(this);
    }
  }
  // 指定下次行动间隔时间，多次指定会叠加
  setNextWaitTime(percent) {
    this.state.nextWait = (this.state.nextWait || 0) + this.calActionTime()*percent*0.01;
  }
  // 是否我的回合
  checkMyTurn(igonreBonusTurn = false) {
    if(!igonreBonusTurn && this.team.state.bonusTurn) {
      return this.team.state.bonusTurn === this.name;
    }
    return this.state.wait <= 0 && this.team.actionList[0] === this;
  }
  // 开始奖励回合
  startBonusTurn() {
    this.team.state.bonusTurn = this.name;
  }
  // 检查奖励回合
  checkBonusTurn() {
    return this.team.state.bonusTurn === this.name;
  }
  // 结束奖励回合
  endBonusTurn() {
    if(this.team.state.bonusTurn === this.name) this.team.state.bonusTurn = null;
  }
  // 获取所有可执行的行动
  getActions() {
    return [];
  }
  // 添加待执行行动
  pushAction(data) {
    this.actions.push(data);
  }
  // 执行并移除行动
  doActions() {
    while(this.actions.length > 0) {
      const data = this.actions.shift();
      this.castAction(data);
    }
  }
  // 行动
  castAction(/*data*/) {}
  // 响应行动
  onAction(/*cfg*/) {}
  // 自动行动
  autoAction() {
    const actions = this.getActions();
    if(!actions || actions.length!==1 || actions[0].disable) return;
    const team = this.team;
    const act = actions[0];
    team.onAction(this, act, act.target);
  }
  // 是否可以进行普通操作
  canAction() {
    const s = this.team.state;
    return this.checkAlive() && (!s.acted || s.bonusTurn===this.name);
  }
  // 注册事件监听
  listenEvent(e, obj, unit = null) {
    unit = unit || this;
    this.team.eventManager.newListen(e, unit, obj);
  }
  // 移除事件监听对象
  removeListener(obj) {
    this.team.eventManager.removeListener(obj);
  }
  // 触发事件
  triggerEvent(e, data, func) {
    this.team.eventManager.triggerEvent(e, this, data, func);
  }
  // 响应事件
  onEvent(e, unit /*, data */) {
    if(e === 'TURN_S' && unit === this) {
      this.state.turnFlags = {};
    }
  }
  // 对生存中的指定目标进行批量处理
  eachUnit(faction, func) {
    this.team.getAliveUnits(faction).forEach(func);
  }
}

module.exports = BaseUnit;
