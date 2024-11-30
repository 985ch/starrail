const lzString = require('../utils/lz-string');
const { createCharacter } = require('./characters/index');

const blockLimit = 100;
class Timeline {
  constructor(team) {
    this.team = team;
    this.members = [];

    this.actList = []; // 行动列表
    this.curAct = 0; // 当前行动索引
  }
  // 判断是否为空
  isEmpty() {
    return this.actList.length === 0;
  }
  // 把排轴数据储存到JSON
  toJSON() {
    this.members = this.team.getMembersInfo();
    return {
      members: this.members,
      list: this.actList,
    }
  }
  // 加载排轴
  fromJSON(json) {
    if(!json) return;
    this.members = json.members;
    this.actList = json.list;
    this.curAct = Math.max(0, this.actList.length - 1);
  }
  // 保存排轴
  save() {
    if(this.actList.length===0) return;
    const members = this.team.members;
    const team = this.team.stringify();
    const state = this.actList[this.actList.length - 1].state;
    return {
      info: {
        m1: members[0] ? members[0].name: null,
        m2: members[1] ? members[1].name: null,
        m3: members[2] ? members[2].name: null,
        m4: members[3] ? members[3].name: null,
        team,
        state,
      },
      list:lzString.compressToBase64(JSON.stringify(this.toJSON()))
    };
  }
  // 加载排轴
  static load(team, members, base64) {
    const raw = lzString.decompressFromBase64(base64);
    const json = JSON.parse(raw);
    // 成员不对不给加载
    const oldCount = members.reduce((count, member)=>member?count+1:count, 0);
    const mCount = team.members.reduce((count, member)=>member?count+1:count, 0);
    if(mCount !== oldCount) return null;
    for(let member of members) {
      if(!member) continue;
      if(!team.getCharacter(member.name)) return null;
    }
    // 加载数据
    const timeline = new Timeline(team);
    team.members = [null, null, null, null];
    for(let i = 0; i < members.length; i++) {
      team.members[i] =  createCharacter(team, i, members[i].name, members[i]);
    }
    timeline.fromJSON(json);

    return timeline;
  }
  // 清空所有排轴
  clear() {
    this.actList = [];
    this.curAct = 0;
  }
  // 在当前行动之后插入一个行动
  push(log) {
    const len = this.actList.length;
    if(len > blockLimit) return false;

    const block = this.newBlock(log);
    if(this.curAct >= len - 1) {
      this.actList.push(block);
      this.curAct ++;
    } else {
      this.actList.splice(this.curAct+1, len - this.curAct - 1, block);
    }
    
    return true;
  }
  // 根据日志生成轴块
  newBlock(log) {
    const ts = this.team.state;
    let damage = 0;
    let expDamage = 0;
    this.team.members.forEach(m=> {
      if(!m) return;
      damage += m.state.damage;
      expDamage += m.state.expDamage;
    })
    const block = {
      unit: log.unit,
      action: log.action,
      actUnit: log.actUnit,
      key: log.key,
      target: log.target,
      state: {
        t: ts.t,
        sp: ts.sp,
        spMax: ts.spMax,
        damage,
        expDamage,
      }
    };
    return block;
  }
  // 删除当前行动
  remove() {
    const idx = this.curAct;
    if(idx===0) return this.clear();
    if(!this.actList[idx]) return;
    this.curAct--;
    this.actList.splice(idx, this.actList.length - idx);
  }
  // 替换当前行动
  replace(log) {
    this.remove();
    this.push(log);
  }
  // 添加或替换一个行动
  addAction(log, replace = false) {
    if(replace) {
      this.replace(log);
    } else {
      this.push(log);
    }
  }
  // 选中一个行动
  selectAction(idx) {
    if(idx<0 || idx>=this.actList.length) return;
    this.curAct = idx;
  }
  // 测试一次排轴结果
  testOnce() {
    const list = this.actList;
    const team = this.team;
    // 重置队伍状态
    //team.resetState();
    team.clearUnitLogs();
    team.reset(true);
    team.updateData();
    team.resetState();
    let state;
    let i = 0;
    do {
      state = this.tryAction(team, list[i]);
      i++;
    } while(state==='success' && i < list.length);
    if(state==='success') state='complete';
    const dmg = team.members.reduce((total, m)=>total+(m? m.state.damage || 0: 0), 0);
    return {
      state,
      dmg,
      step: i,
    }
  }
  // 执行指定排轴行动
  tryAction(team, log) {
    const logUnit = team.getCharacter(log.unit);
    const actUnit = log.actUnit? team.getCharacter(log.actUnit) : null;
    do {
      // 判断战斗是否已结束
      const mAlive = team.members.findIndex(m=> m && m.checkAlive()) >= 0;
      const eAlive = team.enemies.findIndex(e => e && e.checkAlive()) >= 0;
      if(!mAlive) return 'fail';
      if(!eAlive) return 'complete';
      // 优先尝试执行终结技
      if(this.tryActionUS(team, logUnit, actUnit, log)) return 'success';
      // 获取当前行动单位，然后获取行动并尝试执行
      const unit = team.getActionUnit(logUnit);
      if(!unit) return 'fail';

      const actions = unit.getActions() || [];
      const action = actions.find(a=>a.key === log.key);
      const canAction = actions.findIndex(a=>!a.disable) >= 0;
      if(!canAction) { // 当前没有可执行的行动，执行下一步
        team.clearUnitLogs();
        if(team.actionList[0].state.wait===0){
          team.nextTurn();
        } else {
          team.startTurn();
        }
      } else if(unit.faction !== 'members' || (actions.length===1 && (actions[0].noRecord || !actions[0].key))) {
        team.onAction(unit, actions[0], actions[0].target);
      } else if(unit.name===log.unit && action && !action.disable ){
        team.onAction(unit, action, this.getTarget(team, action.target, log));
        return 'success';
      } else if(this.tryActionUS(team, logUnit, actUnit, log, true)){
        return 'success';
      } else {
        return 'fail';
      }
    } while(true);
  }
  // 尝试执行终结技
  tryActionUS(team, unit, actUnit, log, force = false) {
    if(log.key!=='us' || unit.checkDisableUS()) return false;
    if(actUnit && (!force || actUnit.faction==='members') && actUnit.checkAlive() && actUnit !== team.getActionUnit(actUnit)) return false;
    if(!unit || !unit.checkAlive()) return false;
    const action = unit.getUsAction();
    const target = this.getTarget(team, action.target, log);
    team.onAction(unit, action, target);
    return true;
  }
  // 获取目标
  getTarget(team, type, log) {
    switch(type) {
      case 'enemies':
      case 'members':
        return type;
      case 'self':
        return team.getCharacter(log.unit);
      default:
        {
          const target = team.getCharacter(log.target);
          if(!target || !target.checkAlive()) {
            return team.getAliveUnits(log.target.startsWith('木人桩')?'enemies':'members')[0] || null;
          }
          return target;
        }
    }
  }
}

module.exports = Timeline;