'use strict';

const { ruleFunc, compare } = require('../simulator/ai_rule');

const defaultConfig = {
  na: {
    rules: [[{t:'target', v:['selected']}]],
  },
  ns: {
    disable: false,
    rules: [],
  },
  us: {
    disable: false,
    rules: [],
  },
}

// 检查AI判定规则是否通过
function checkRule(member, target, type, params) {
  const func = ruleFunc[type];
  if(!func) return false;
  return func.check(member, target, params);
}
// 确定行动及目标
function action(member, selMember, selEnemy) {
  const actions = member.getActions();
  if(actions.length===0)return;
  for(let i=actions.length-1; i>=0; i--) {
    const act = actions[i];
    const selUnit = ['enemy','enemies'].includes(act.target)? selEnemy: selMember;
    const target = aiAction(member, selUnit, act);
    if(target || i===0) {
      member.team.onAction(member, act, target || selUnit);
      return;
    }
  }
}
// 未进战行动
function actionReady(team, spList, attacker) {
  if(team.state.inBattle) return;
  let sp = team.state.sp;
  for(let i=0; i<spList.length; i++) {
    if(sp<=0 || team.state.inBattle) break;
    const member = team.getCharacter(spList[i]);
    team.onAction(member, { text: '秘技', key: 'sp' }, member.base.spTarget || 'enemies');
    sp--;
  }
  if(team.state.inBattle) return;
  const m = team.getCharacter(attacker) || team.getAliveUnits('members')[0];
  team.onAction(m, { text: '进战', key: 'start' }, 'enemies');
}
// 确定是否使用终结技
function actionUS(member, selMember, selEnemy) {
  const action = member.getUsAction();
  const target = aiAction(member, ['enemy','enemies'].includes(action.target)? selEnemy: selMember, action);
  if(target) {
    member.team.onAction(member, { text: '终结技', key: 'us' }, target);
    return true;
  }
  return false;
}
// 获取目标
function getTarget(member, actType, selUnit, params) {
  const tarType = params[0];
  if(actType==='self') return member;
  if(['members','enemies'].includes(actType)) return actType;
  if(tarType==='selected') return selUnit;
  
  const faction = selUnit.faction;
  const allUnits = member.team.getAliveUnits(faction);
  if(allUnits.length===0) return null;
  const needWeak = (tarType==='selected' || actType!=='enemy')? false: params[params.length-1]==='yes';
  let units = needWeak? allUnits.filter(e => e.findBuff({tag:'weak'+member.base.type})): allUnits;
  if(units.length===0) units = allUnits;

  switch(tarType) {
    case 'buff':{
      const rule = ['t'].concat(params.slice(1, params[1]==='key'? 4: 5));
      return units.find(u => checkRule(member, u, 'buff', rule)) || selUnit;
    }
    case 'hp':
    case 'en':
    case 'shield': {
      const cmpType = params[1].slice(0, 3);
      const isPercent = params.length === 4; 
      return units.reduce((o, u)=> {
        const value = getUnitValue(u, tarType, isPercent);
        if(!compare(value, params[3], params[2])) return o;
        if(o.limit< 0 || (cmpType==='min' && value<o.limit) || (cmpType==="max" && value>o.limit)) {
          o = {limit:value, unit:u }
        }
        return o;
      }, {limit:-1, unit:null}).unit || selUnit;
    }
    case 'hpMax':
    case 'atk': {
      const cmpType = params[1].slice(0, 3);
      const isBase = params.length === 4; 
      return units.reduce((o, u)=> {
        const value = getUnitValueA(u, tarType, isBase);
        if(!compare(value, params[3], params[2])) return o;
        if(o.limit< 0 || (cmpType==='min' && value<o.limit) || (cmpType==="max" && value>o.limit)) {
          o = {limit:value, unit:u }
        }
        return o;
      }, {limit:-1, unit:null}).unit || selUnit;
    }
    case 'member':
      return member.team.getCharacter(params[1]) || selUnit;
    default:
      return selUnit;
  }
}
// 根据类型和是否百分比取值
function getUnitValue(u, type, isPercent) {
  switch(type) {
    case 'hp':
      return isPercent? u.state.hp*100/u.getAttr('hp'): u.state.hp;
    case 'en':
      if(u.faction!=='members') return 0;
      return isPercent && u.state.enMax>0? u.state.en*100/u.state.enMax: u.state.en;
    case 'shield':
      if(u.faction!=='enemies') return 0;
      return isPercent && u.shield>0? u.state.shield*100/u.shield: u.state.shield;
    default:
      return 0;
  }
}
// 根据类型和是否基础值取值
function getUnitValueA(u, type, isBase) {
  type = type==='hpMax'? 'hp': type;
  return isBase? u.base['base' + type[0].toUpperCase() + type.slice(1)]: u.getAttr(type);
}
// AI判断指定行动是否触发，触发时返回目标对象
function aiAction(member, selUnit, action) {
  if(action.disable) return null;
  const aiCfg = member.ai || {};
  const actCfg = aiCfg[action.key] || defaultConfig[action.key];
  if(actCfg && actCfg.disable) return null;

  let rules = actCfg && actCfg.rules;
  if(!rules || rules.length === 0) rules = [[{t:'target', v:['selected']}]];
  for(let rule of rules) {
    const target = getTarget(member, action.target, selUnit, rule[0]? rule[0].v: 'selected');
    let canAction = true;
    for(let cond of rule) {
      if(cond.t==='target') continue;
      if(!checkRule(member, target, cond.t, cond.v)) {
        canAction = false;
        break;
      }
    }
    //console.log(member.name, action.key, canAction, target.name || target);
    if(canAction) return target;
  }
  return null;
}

module.exports = {
  action,
  actionReady,
  actionUS,
  defaultConfig,
}