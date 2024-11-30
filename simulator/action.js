// 行动配置
'use strict';

const C = require('./compute');
const D = require('./data');

// 根据攻击类型和选中对象来获取目标列表
function getTargets(member, type, target, count = 1) {
  if(type === 'single') return [target];
  const faction = (!target || typeof target === 'string')? target: (target? target.faction: 'enemies');
  const units = member.team.getAliveUnits(faction);
  switch(type) {
    case 'all':
      return units;
    case 'adj':
      return getAdjTargets(units, target);
    case 'diff':
      return getDiffTargets(units, target);
    case 'random':
      {
        const targets = target? [target] : [D.sample(units)];
        for(let i=1; i<count; i++) {
          targets.push(D.sample(units));
        }
        return targets;
      }
    default:
      throw new Error('无效的攻击类型');
  }
}
// 根据中心目标选择扩散攻击的完整目标
function getDiffTargets(units, target) {
  const list = [null, null, null];
  for(let i=0; i<units.length; i++) {
    const unit = units[i];
    if(unit === target) {
      list[0] = unit;
    } else if(!list[0]) {
      list[1] = unit;
    } else {
      list[2] = unit;
      break;
    }
  }
  return list.filter(unit => unit);
}
// 选择指定目标的相邻目标
function getAdjTargets(units, target) {
  if(units.length === 0) return [];
  const list = [null, null];
  const index = target.index;
  for(let i=0; i<units.length; i++) {
    const unit = units[i];
    if(unit.index < index) {
      list[0] = unit;
    } else if(unit.index > index) {
      list[1] = unit;
      return list;
    }
  }
  return list.filter(unit=>unit);
}
// 默认的获取攻击段数据的方法
function defaultHitInfo(index, targets, data) {
  const { atkType, target, hits } = data;
  switch(atkType) {
    case 'single':
      return [{t: target, r: hits[index]}];
    case 'all':
      return targets.map(t => ({t, r: hits[index]}));
    case 'diff':
      return getDiffTargets(targets, target).map((t, i) => ({t, r: i===0? hits[index]: data.diffHits[index]}));
    case 'random':
      {
        if(index===0) return [{ t: target, r: 1 }];
        const allTargets = getTargets(data.member, 'all', target);
        return [{ t: D.sample(allTargets) || target, r: 1 }]
      }
    default:
      throw new Error('无效的攻击类型');
  }
}
// 实施一次行动
// {type: 'NA'/'NS'/'US'/'SP'/'AA'/'OTH', ?keepTurn: false, member:unit, target:unit/string, ?options:any}
// keepTurn标记为true时，该行动不会导致当前回合无法继续行动
function actionBase(data, func) {
  const m = data.member;
  m.triggerEvent('ACT_S', data);
  if(!data.keepTurn && D.checkType(data.type,['NA','NS'])) m.team.state.acted = true; // 让角色在当前回合无法继续行动
  if(func){
    func();
  }
  m.triggerEvent('ACT_E', data);
  m.team.forEachUnit(false, unit => unit.doActions())
}
// 实施一次攻击
// { type, ?keepTurn, member:unit, target:unit/string, *actType:'attack', atkType:'single'/'random'/'diff'/'all', ?count:1, *targets:[unit,...], ?options:any }
// count参数当且仅当atkType为'random'时有效
// rawDmgFunc返回 { attrType, rawDmg, hits, en, ?diffDmg, ?diffHits }
function actionAttack(data, func, rawDmgFunc, dmgFunc = null) {
  actionBase(data, () =>{
    func(()=>triggerAttack(data, rawDmgFunc, dmgFunc));
  });
}
// 实施一次治疗
// { type, ?keepTurn, member, target, tarType, *targets, ?count, ?options:any}
function actionHeal(data, func, healFunc) {
  const { member, target, count } = data;
  const targets = getTargets(member, data.tarType, target, count || 1);
  data.targets = targets;
  actionBase(data, () => {
    func(()=>triggerHeal(data, healFunc));
  });
}
// 返回一个简单的伤害对象
function simpleDmg(attrType, en, rawDmg) {
  return { attrType, rawDmg, en};
}
// 为攻击和命中事件追加目标对象数据
function fillTargetState(data, target) {
  data[target.name] = {
    brkDmg: 0, // 破韧值
    brkDmgEx: 0, // 溢出破韧值
  }
}
// 实施一次追加攻击
// { *type:'AA', member:unit, target:unit/string, *actType:'attack', *targets, atkType:'single'/'random'/'diff'/'all', ?count:1, ?options:any }
// count参数当且仅当atkType为'random'时有效
// rawDmgFunc返回 { attrType, rawDmg, hits, en, ?diffDmg, ?diffHits }
function triggerAttack(data, rawDmgFunc = null, dmgFunc = null) {
  data.type = data.type || 'AA';
  data.actType = 'attack';
  data.member.triggerEvent('C_ATK_S', data);
  // targets.forEach(target => target.triggerEvent('B_ATK_S', data)); // 取消该事件，用B_DMG_S代替
  triggerDmg(Object.assign(data, rawDmgFunc? rawDmgFunc(): {}), dmgFunc);
  data.targets.forEach(target => target.triggerEvent('B_ATK_E', data))
  data.member.triggerEvent('C_ATK_E', data);
}
// 伤害行动
// { type:'NA'/'NS'/'US'/'AA'/'SP', atkType:'single'/'random'/'diff'/'all', member:unit, targets:[unit, ...], attrType:'Fire', ?options,
// rawDmg:(idxTarget, idxHit, hitInfo)=>{raw: Number, brkDmg: Number}, ?en:0, ?hits:[1], ?diffHits:[0], ?count:1, *target:unit, *damage, *expDamage}
function triggerDmg(data, dmgFunc) {
  const { type, attrType, member, en, target, rawDmg } = data;
  data.options = data.options || {};
  const { getHitInfo, fixed, spBrkDmg } = data.options;
  data.hits = data.hits || [1];
  const count = data.count || data.hits.length;
  const types = attrType!=='Real' ? [attrType] : [];
  if(Array.isArray(type)){
    types.push(...type)
  } else {
    types.push(type);
  }
  data.damage = 0;
  data.expDamage = 0;
  data.brkDmg = 0;
  data.targets = [];
  const targets = getTargets(member, 'all', target);

  // 触发伤害前事件
  member.triggerEvent('C_DMG_S', data);
  // 计算每段伤害
  const lastHit = count - 1;
  for(let i=0; i <= lastHit; i++ ) {
    const hitInfo = getHitInfo? getHitInfo(i, targets, data) : defaultHitInfo(i, targets, data);
    if(hitInfo.length===0) continue;
    if(en>0 && member.faction==='members')member.addEn(en * hitInfo[0].r);
    const lastTarget = hitInfo.length - 1;
    for(let j=0; j<= lastTarget; j++) { // 逐目标触发受击开始事件
      const target = hitInfo[j].t;
      if(data.targets.indexOf(target) < 0) {
        data.targets.push(target);
        data.curTarget = target;
        fillTargetState(data, target);
        target.triggerEvent('B_DMG_S', data)
      }
    }
    if(i === 0 && spBrkDmg) castBrkDmg(member, spBrkDmg, data.options);
    for(let j=0; j<= lastTarget; j++) { // 逐目标结算
      const info = hitInfo[j];
      const target = info.t;
      const rate = info.r;
      const { raw, brkDmg } = rawDmg(j, i, info);
      
      const { damage, criRate, criDamage, expDamage } = dmgFunc ? dmgFunc(raw * rate, data, types, info) : C.calDmg(raw * rate, types, member, target, null, fixed || null);
      const isCri = Math.random() < criRate;
      const dmg = isCri? criDamage: damage;
      data.damage += dmg;
      data.expDamage += expDamage;
      const breakDamage = brkDmg * rate * (1 + member.attr.data.breakBonus*0.01);
      data.brkDmg += breakDamage;
      const dmgData = {
        [target.name]: data[target.name],
        type, attrType, member, attacker:member, target, options: data.options,
        raw: raw*rate, damage: dmg, expDamage, brkDmg: breakDamage, rate, isCri,
        idxT: j, idxMT: lastTarget, idxH: i, idxMH: lastHit,
      }
      triggerHit(member, member, target, dmgData, false);
    }
  }
  // 触发伤害后事件
  member.triggerEvent('C_DMG_E', data);
  data.targets.forEach(target => {
    data.curTarget = target;
    target.triggerEvent('B_DMG_E', data);
    if(en > 0 && member.faction==='enemies' && target.addEn){
      target.addEn(en);
    }
    if(!target.checkAlive({ member, target, type })) {
      member.triggerEvent('C_KILL', { member, target, type });
      target.triggerEvent('B_KILL', { member, target, type });
    }
  })
}
function triggerHit(attacker, m, t, data, checkKill) {
  data.options = data.options || {};
  if(!data[t.name])fillTargetState(data, t);
  if(data.damage===0 && data.brkDmg===0) return;
  m.triggerEvent('C_HIT_S', data);
  t.triggerEvent('B_HIT_S', data);
  t.triggerEvent('B_HIT_E', data);
  m.triggerEvent('C_HIT_E', data);
  const json =  { member: attacker, target: t, type: data.type }
  if(checkKill && !t.checkAlive(json)) {
    m.triggerEvent('C_KILL', json);
    t.triggerEvent('B_KILL', json);
  }
}
// 添加一段附加伤害，注意attacker是计算伤害的成员，member则是触发了附加伤害的成员，击杀归属attacker
// type:'DOT'/'AD'/'BRK'/'NA'/'NS'/'US'/'AA'/'SP'
function newAddDmg(attacker, member, targets, base, checkKill=false, attrType = null, type='AD', options= {}, dmgFunc = null) {
  attrType = attrType || attacker.base.type;
  targets.forEach((target, idxT)=>{
    if(!target.checkAlive()) return;
    const types = [attrType, type];
    const { criRate, damage, criDamage, expDamage } = dmgFunc ? dmgFunc(types, member, target):C.calDmg(base, types, attacker, target, options);
    const canCri = !D.checkType(type,['DOT','BRK']) && !options.noCrit;
    const isCri = canCri && Math.random() < criRate;
    const dmg = isCri? criDamage: damage;
    const dmgData = {
      type, attrType, member, target, attacker,
      raw: base, damage: dmg, expDamage: canCri? expDamage: dmg, rate: 1, brkDmg: 0, isCri,
      options, idxT, idxMT: targets.length-1, idxH: -1, idxMH: -1,
    }
    triggerHit(attacker, member, target, dmgData, checkKill);
  });
}
// 进战削韧攻击和秘技攻击
function startBattleDmg(member, brkDmg = 1, rawDmg = null, atkType='all', target='enemies', attrType = null, hitsOrCount=0,  options = null) {
  attrType = attrType || member.base.type;
  options = options || {};
  if(rawDmg) {
    if(brkDmg) options.spBrkDmg = brkDmg;
    const hits = Array.isArray(hitsOrCount)? hitsOrCount: null;
    const count = hits? hits.length : hitsOrCount;
    const data = { type: 'SP', member, atkType, target, hits, count, attrType, options, rawDmg}
    triggerDmg(data);
  } else if(brkDmg) {
    castBrkDmg(member, brkDmg, options);
  }
  member.team.forEachUnit(false, unit => unit.doActions())
}
// 进行一次没有伤害的削韧行动
function castBrkDmg(member, brkDmg, options) {
  const targets = member.team.getAliveUnits('enemies');
    targets.forEach((t,idxT) => {
      const brkDmgData = {
        type: 'SP', attrType: member.base.type, member, attacker:member, target: t,
        raw: 0, damage: 0, expDamage: 0, rate: 1, brkDmg, isCri: false,
        options, idxT, idxMT: targets.length-1, idxH: -1, idxMH: -1,
      }
      triggerHit(member, member, t, brkDmgData, true);
    })
}

// 治疗行动
// { type:'NA'/'NS'/'US'/'AH'/'HOT', member:unit, targets:[unit, ...], *heal:0, *idx, ?options }
function triggerHeal(data, healFunc = null) {
  const member = data.member;
  
  let heal = 0;
  member.triggerEvent('CURE_S', data);
  data.idxMax = data.targets.length-1;
  for(let i=0; i < data.targets.length; i++) {
    const target = data.targets[i];
    data.idx = i;
    data.heal = healFunc(data, target);
    heal += data.heal;
    member.triggerEvent('C_HEAL_S', data);
    target.triggerEvent('B_HEAL_S', data);
    target.triggerEvent('B_HEAL_E', data);
    member.triggerEvent('C_HEAL_E', data);
  }
  data.heal = heal;
  member.triggerEvent('CURE_E', data);
}

module.exports = {
  getTargets,
  getDiffTargets,
  actionBase,
  actionAttack,
  actionHeal,
  triggerAttack,
  triggerDmg,
  triggerHit,
  triggerHeal,
  simpleDmg,
  newAddDmg,
  startBattleDmg,
}
