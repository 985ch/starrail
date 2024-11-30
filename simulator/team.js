'use strict';

const Enemy = require('./enemy');
const { enemiesJson } = require('./enemy_templates');
const BuffManager = require('./buff_manager');
const EventManager = require('./event_manager');
const TeamLogger = require('./team_logger');
const Timeline = require('./timeline');
const { fixJson, createCharacter, readCharacter, getDefaultJson } = require('./characters/index');
const lzString = require('../utils/lz-string');

const currentVersion = 2;
const currentTeam = ['飞霄','貊泽','知更鸟','砂金'];

// 队伍信息
class Team {
  constructor(json = null) {
    this.state = null; // 队伍状态数据
    this.enemies = [
      new Enemy(this, 0, Enemy.parse(enemiesJson['[75]全属性桩']), null),
      new Enemy(this, 1, Enemy.parse(enemiesJson['[80]全属性桩']), null),
      new Enemy(this, 2, Enemy.parse(enemiesJson['[90]全属性桩']), null),
      new Enemy(this, 3, Enemy.parse(enemiesJson['[75]序列扑满']), null),
      new Enemy(this, 4, Enemy.parse(enemiesJson['[80]序列扑满']), null),
    ]; // 敌人列表
    this.curEnemy = 0; // 当前敌人索引
    this.curMember = 0; // 当前成员索引
    this.members = [null, null, null, null]; // 队伍成员
    this.summons = []; // 召唤物列表
    this.actionList = []; // 行动队列
    this.battleMode = false; // 是否在模拟计算中
    this.aiConfig = { spList: [], usList:[], firstMember:null, aiDelay: 1000 } // AI配置

    this.buffManager = new BuffManager(this); // 增益管理器
    this.eventManager = new EventManager(this); // 事件管理器
    this.logger = new TeamLogger(this); // 日志管理器
    this.timeline = new Timeline(this); // 排轴管理器
    this.timelineB = new Timeline(this); // 对照轴

    this.reset();
    if (json) {
      this.fromJSON(json);
    } else {
      for(let i=0;i<4;i++){
        this.setMember(i, createCharacter(this, i, currentTeam[i], getDefaultJson(currentTeam[i])));
      }
    }
    if(!this.state) this.resetState();
  }
  // 设置角色到指定位置
  setMember(index, member) {
    if(index<0 || index>3) {
      throw new Error('队伍成员索引超出范围：' + index);
    }
    this.members[index] = member;
    if(member) {
      for(let i=0;i<this.members.length;i++) {
        if(i!==index && this.members[i]!==null && this.members[i].name === member.name) {
          this.members[i] = null;
        }
      }
    }
    if(!this.members[this.curMember]) {
      this.curMember = this.members.findIndex(m=>m);
    }
    this.reset(); // 重置数据
    this.updateData(); // 更新数据
    this.resetState(); // 重制状态数据
  }
  // 设置敌人到指定位置
  setEnemy(index, json) {
    if(index<0 || index>=this.enemies.length) return;
    const oldEnemy = this.enemies[index];
    if(oldEnemy) {
      oldEnemy.removeAllBuffs();
      const idx = this.actionList.indexOf(oldEnemy);
      if(idx>=0)this.actionList.splice(idx, 1);
    }
    const enemy = json ? new Enemy(this, index, json, null): null;
    this.enemies[index] = enemy;
    this.reset();
    this.updateData();
    if(enemy) {
      enemy.resetState();
      this.updateActionUnit(enemy);
    } else {
      this.resetState();
    }
    if(!this.enemies[this.curEnemy]) {
      this.curEnemy = this.enemies.findIndex(e=>e);
    }
  }
  // 设置所有的敌人为同一套数据
  setEnemies(json) {
    if(!json)return;
    for(let i=0;i<this.enemies.length;i++) {
      this.enemies[i] = new Enemy(this, i, json, null);
    }
    this.reset();
    this.updateData();
    this.resetState();
  }
  // 获取阵营仍生存的单位
  getAliveUnits(faction) {
    const units = (faction === 'members')? this.members : this.enemies;
    return units.filter(unit => unit && unit.checkAlive());
  }
  // 通过比较条件查找特定的单位
  findUnitByFunc(faction, func) {
    return this.getAliveUnits(faction).reduce((t, m)=> {
      if(!t) return m;
      return func(m, t) ? m : t;
    }, null);
  }
  // 对每个单位执行特定操作
  forEachUnit(withSummon, func) {
    this.enemies.forEach(obj => obj? func(obj): null);
    this.members.forEach(obj => obj? func(obj): null);
    if(withSummon) this.summons.forEach(func);
  }
  // 重置队伍数据
  reset(clearBuffs = false) {
    const buffJson = clearBuffs? [] : this.buffManager.toJSON();
    this.buffManager.clear();
    this.eventManager.clear();
    this.summons = [];
    this.forEachUnit(false, unit => {
      unit.reset();
      this.buffManager.addBuffList(unit.getBuffList());
      this.summons.push(...unit.getSummonList());
    });
    this.buffManager.resetAllBuffs();
    this.buffManager.fromJSON(buffJson);
    this.aiConfig.usList = this.aiConfig.usList.filter(name => this.members.find(m => m && m.name===name));
    this.aiConfig.spList = this.aiConfig.spList.filter(name => this.members.find(m => m && m.name===name));
  }
  // 重置状态数据
  resetState() {
    const state = { t: 0, turn:0, inBattle: false, sp: 5, spMax:5, acted: true, bonusTurn: null }
    this.actionList = [];
    this.tempLog = null;
    this.logger.clear();
    this.timeline.clear();
    this.forEachUnit(true, unit => {
      unit.resetState();
      this.updateActionUnit(unit);
    });
    this.state = state;
  }
  // 清除所有单位对指定目标的缓存属性
  clearTargetCache(target) {
    this.forEachUnit(false, (unit) => { if(unit.cachedTarget===target) unit.cachedTarget=null });
  }
  // 切换到模拟计算模式
  readyBattle() {
    this.reset(true)
    this.resetState();
  }
  // 设置领域
  setField(member) {
    this.members.forEach(m => {
      if(m===member || !m) return;
      if(m.state.fieldActivated) m.state.fieldActivated = false;
    })
    member.state.fieldActivated = true;
  }
  // 进入战斗
  enterBattle(member, sp = false, onBattleS) {
    const s = this.state;
    if(s.inBattle) return;
    s.inBattle = true;
    s.t = 0;
    s.sp = 3;
    s.spMax = 5;
    s.acted = true;
    s.bonusTurn = null;
    this.logger.startActionS(null, '战斗开始');
    this.forEachUnit(true, unit=>{
      unit.triggerEvent('BTL_S', { member, sp }, ()=>{
        if(unit === member && onBattleS) onBattleS();
      });
      this.logger.startActionS(unit, '新波次', true);
      unit.triggerEvent('WAVE_S', { wave: 1, waveMax: 1 });
      this.logger.startActionS(unit, '新轮次', true);
      unit.triggerEvent('RND_S', { round: 0 });
    });
    this.logger.finishAction();
  }
  // 开始一个新的回合
  startTurn(lastUnit = null) {
    if(!this.state.inBattle) return;
    if(lastUnit && lastUnit.checkAlive()) {
      const lus = lastUnit.state;
      this.logger.startActionS(lastUnit, '回合结束', true);
      lastUnit.triggerEvent('TURN_E', { unit:lastUnit, turn: lus.turn, totalTurn: this.state.turn });
      lus.wait = lus.nextWait || lastUnit.calActionTime();
      lus.nextWait = 0;
      lastUnit.changeWaitTime(lus.actionRate || 0, true);
      lus.actionRate = 0;
    }
    this.logger.finishAction();
    this.forEachUnit(false, unit => unit.doActions())
    let unit = this.actionList[0];
    let n = unit.state.wait;
    while(!unit.checkAlive()) {
      this.actionList.shift();
      unit = this.actionList[0];
      n = unit.state.wait;
    }
    if(n > 0) {
      let round = this.getRound().round;
      let need = round * 100 + 150 - this.state.t;
      let add = Math.min(need, n);
      this.state.t += add;
      n -= add;
      while(need === add) {
        this.logger.startActionS(null, '新轮次');
        round ++;
        this.forEachUnit(true, u=>{
          if(u.checkAlive()) u.state.wait = Math.max(0, u.state.wait - add);
        })
        this.forEachUnit(true, u=>{
          this.logger.startActionS(u, '新轮次', true);
          if(u.checkAlive())u.triggerEvent('RND_S', { round });
        });
        this.logger.finishAction();
        need = round * 100 + 150 - this.state.t;
        add = Math.min(need, n);
        this.state.t += add;
        n -= add;
      }
      this.forEachUnit(true, u=>{
        if(u.checkAlive()) u.state.wait = Math.max(0, u.state.wait - add);
      })
    }
    this.state.acted = false;
    unit.state.turn++;
    this.state.turn++;
    this.logger.startActionS(unit, '回合开始', true)
    unit.triggerEvent('TURN_S', { unit, turn: unit.state.turn, totalTurn: this.state.turn } )
    this.logger.finishAction();
    unit.autoAction();
  }
  // 结束当前回合并开始下一个回合
  nextTurn() {
    const s = this.state;
    if(!s.inBattle) return;
    const list = this.actionList;
    const curUnit = s.bonusTurn? this.getCharacter(s.bonusTurn): list[0];
    if(curUnit !== list[0] || curUnit.canAction()) return;
    const unit = list[0].state.wait===0 ? list.shift(): list[0];
    this.startTurn(unit);
  }
  // 获取当前回合信息
  getTurnInfo() {
    const unit = this.actionList[0];
    if(!unit || unit.state.wait > 0) return null;
    return { unit:unit.name, turn:unit.state.turn, totalTurn: this.state.turn };
  }
  // 获取当前轮次
  getRound(t = false) {
    if(t===false) t = this.state.t;
    if(t<150) {
      return { round:0, t };
    }
    return {
      round: Math.floor((t - 150)/100) + 1,
      t: Math.floor(t - 150) % 100,
    }
  }
  // 将目标加入行动队列或移出行动队列
  updateActionUnit(unit) {
    const list = this.actionList;
    const wait = unit.state.wait;
    let i = 0;
    let removed = false;
    let insert = false;
    let alive = unit.checkAlive();
    let hide = unit.checkHide();
    while(i < list.length) {
      if(list[i] === unit) {
        list.splice(i, 1);
        removed = true;
      } else {
        const curWait = list[i].state.wait;
        if(!insert && alive && !hide && (curWait > wait || (curWait === wait && removed))) {
          list.splice(i, 0, unit);
          insert = true;
          i++;
        }
        i++;
      }
    }
    if(alive && !hide && !insert) {
      list.push(unit);
    }
  }
  // 获取当前行动的角色
  getActionUnit(unit) {
    if(!this.state) return unit;
    const { inBattle, bonusTurn } = this.state;
    if(!inBattle) return unit;
    return bonusTurn? this.getCharacter(bonusTurn): this.actionList[0];
  }
  // 获取角色名字一览
  getMemberNameList() {
    const nameList = [];
    for(let i = 0; i < this.members.length; i++) {
      const member = this.members[i];
      if(member) {
        nameList.push(member.name);
      }
    }
    return nameList;
  }
  // 根据名字获取角色
  getCharacter(name) {
    if(!name || name==='') return null;
    const lists = [this.members, this,this.enemies, this.summons];
    for(let list of lists) {
      for(let i=0; i<list.length; i++) {
        if(list[i] && list[i].name===name) return list[i];
      }
    }
    return null;
  }
  // 根据名字获取队伍成员
  getMember(name) {
    for(let i = 0; i < this.members.length; i++) {
      const member = this.members[i];
      if(member && member.name === name) {
        return member;
      }
    }
    return null;
  }
  // 获取队伍成员的基本信息用于展示
  getMembersInfo() {
    const rInfo = this.getRound();
    const round = rInfo.round + (rInfo.t > 0? 1: 0);
    return this.members.filter(m => m).map(m=>{
      const {na, ns, us, ps } = m.skills;
      return {
        name: m.name,
        soul: m.soul,
        skills: `${na}-${ns}-${us}-${ps}`,
        weapon: m.weapon ? m.weapon.base.name : null,
        wStar: m.weapon ? m.weapon.star : null,
        eInfo: m.equip ? m.equip.getSetText().join(' ') : '-',
        speed: m.staticSpeed,
        rDmg: round > 0? Math.floor(m.state.damage / round): 0,
      }
    });
  }
  // 更新整个队伍的数据
  updateData(updateCurMember = false) {
    this.forEachUnit(false, unit=>unit.updateData());
    if(updateCurMember && this.members[this.curMember]) this.members[this.curMember].updateData();
  }
  // 把队伍信息保存为JSON
  toJSON(withLogger = true, withTimeline = true) {
    const summons = {};
    this.summons.forEach(unit => summons[unit.name] = unit.state);
    return {
      enemies: this.enemies.map(enemy=>enemy? enemy.toJSON() : null),
      members: this.members.map(member=>member? member.toJSON() : null),
      summons,
      buffs: this.buffManager.toJSON(),
      actionList: this.actionList.filter(unit=>unit).map(unit=>unit.name),
      state: this.state,
      ai: this.aiConfig,
      selected: [ this.curMember, this.curEnemy ],
      logger: withLogger? this.logger.toJSON(): null,
      timeline: withTimeline? this.timeline.toJSON(): null,
      v: currentVersion,
    }
  }
  // 从JSON恢复队伍信息
  fromJSON({enemies, members, summons, buffs, actionList, state, ai, selected, logger, timeline, v}) {
    this.enemies = enemies.map( (enemy, index) =>enemy? new Enemy(this, index, enemy, enemy.state) : null);
    this.members = members.map( (member, index) => member? createCharacter(this, index, member.name, member) : null);

    this.reset(v!==currentVersion);
    this.buffManager.fromJSON(buffs);
    this.updateData();

    actionList = actionList.map(name => fixJson[name] || name);
    if(selected) {
      this.curMember = selected[0];
      this.curEnemy = selected[1];
    }
    if(v===currentVersion) {
      this.summons.forEach(unit => { if(summons[unit.name])unit.state = summons[unit.name] });
      this.state = state;
      this.actionList = actionList.map(name => this.getCharacter(name) || this.summons.find(u => u.name === name));
      this.logger.fromJSON(logger);
      this.timeline.fromJSON(timeline);
      this.timelineB.clear();
      if(ai) this.aiConfig = ai;
    } else {
      this.resetState();
    }
  }
  // 把队伍序列化为文本(不含敌人数据和状态数据)
  stringify(){
    let text = '';
    for(let i=0; i<this.members.length; i++) {
      const member = this.members[i];
      if(member) {
        text += member.stringify();
      } else {
        text += '无;'
      }
    }
    return text;
  }
  // 从序列化文本恢复队伍数据（不含敌人数据和状态数据)
  parse(text){
    text = text.replace(/\r\n/g, '');
    let idx = 0;
    const result = [];
    for(let i=0; i<4; i++) {
      const info = readCharacter(text, idx);
      idx = info.idx;
      result.push(info.json);
    }
    return result;
  }
  // 把数据转换成JSON之后压缩并处理成base64编码
  toBase64() {
    return lzString.compressToBase64(JSON.stringify(this.toJSON(true, true)));
  }
  // 从Base64字符串还原队伍数据
  fromBase64(base64) {
    const json = JSON.parse(lzString.decompressFromBase64(base64));
    this.fromJSON(json);
  }
  // 复制一个队伍
  clone() {
    return new Team(this.toJSON(true, true));
  }
  // 清空成员日志
  clearUnitLogs() {
    this.forEachUnit(false, unit=>unit.clearLogs())
  }
  // 采取行动
  onAction(unit, action, target) {
    const data = { ...action };
    data.target = target;
    data.tarType = action.target;
    this.clearUnitLogs();
    this.logger.startAction(unit, data);
    unit.onAction(data);
    this.logger.finishAction();
    unit.doActions();
    this.logger.finishAction();
  }
}

module.exports = Team;