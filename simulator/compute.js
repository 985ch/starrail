// 伤害计算脚本
'use strict';

const D = require('./data');

// 把概率数值转化为对应概率
function n2r(n) {
  return 1.0 - n * 0.01;
}
// 限制值的最大最小值
function between(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// 计算防御效果,参数为攻击者等级(level)，受击者防御(def)，受击者防御下降率(defDown)
function calDefEffect(aLevel, dDef, dDown) {
  return (aLevel * 10 + 200) / (aLevel * 10 + 200 + Math.max(0, dDef * n2r(dDown)));
}

// 计算击破伤害
function calBreakDamage(attacker, defender, damageType, options = {}) {
  const aLevel = attacker.level;
  const dShield = options.maxShield? Math.min(options.maxShield, defender.shield): defender.shield;
  const { aData, dmgRate, dmgDown, defEffect, weak, defend} = calDmgData([damageType,'BRK'], attacker, defender);
  const { brkRate, dotRate, max, late, count } = D.breakInfo[damageType]

  const base = D.breakBase[aLevel-1]; // 基数
  const breakRate = (1.0 + aData.breakRate * 0.01 ); // 击破特攻加成
  const rate = breakRate * (1 + aData.bonusBRK * 0.01) * weak * defend * dmgRate * dmgDown * defEffect; // 伤害倍率
  const shieldRate = ((dShield + 2) * 0.25); // 韧性系数
  const isBreak = defender.findBuff({tag:'破韧'}) ? true: false;
  const damage = base * brkRate * shieldRate * rate * (isBreak ? 0.9: 1); // 击破伤害

  let dotDamage = 0; // 持续伤害
  if(damageType === 'Physical') {
    dotDamage = Math.min(damage, defender.getAttr('hp') * (defender.isElite()?0.07:0.16)); // 物理伤害按生命上限算
  } else {
    dotDamage = base * dotRate * rate / (isBreak ? 1: 0.9);
  }
  
  const lateRate = 25.0 + late * breakRate; // 行动延迟率
  return { damage, dotDamage, max, lateRate, count };
}
// 计算破韧值
function calBrkDmg(attacker, defender, base) {
  const aData = attacker.getAttributesT(defender);
  return base * (1.0 + aData.breakBonus*0.01);
}
// 计算超击破伤害
function calSuperBrkDmg(attacker, defender, damageType, brkDmg, rate, bonus) {
  const base = D.breakBase[attacker.level-1]; // 基数
  const { aData, dmgRate, dmgDown, defEffect, weak, defend} = calDmgData([damageType,'BRK'], attacker, defender);
  const isBreak = defender.findBuff({tag:'破韧'}) ? true: false;
  const r = (1.0 + aData.breakRate*0.01) * (1 + aData.bonusBRK * 0.01) * weak * defend *dmgRate * dmgDown * defEffect;
  return base * brkDmg * (rate*0.01) * (1+bonus*0.01)  * r * (isBreak ? 0.9: 1);
}
// 计算各个乘区的数值并返回
function calDmgData(types, attacker, defender, options = null, fixed = null){
  options = options || {};
  fixed = fixed || {};
  const aData = attacker.getAttributesT(defender);
  const dData = defender.getAttributesB(attacker);

  let crit = aData.criRate + (fixed.crit || 0); // 暴击
  let criDmg = aData.criDamage + (fixed.criDmg || 0); // 暴伤
  let defDown = dData.defDown + aData.defThrough + (fixed.defDown || 0);
  let bonus = aData.bonusAll + (fixed.bonus || 0); // 增伤区
  let weak = dData.weakAll + (fixed.weak || 0); // 易伤区
  let defend = dData.defendAll - aData.throughAll + (fixed.defend || 0); // 抵抗区

  for(let i = 0; i < types.length; i++) {
    const type = types[i];
    crit += aData['crit' + type] || 0;
    criDmg += aData['criDmg' + type] || 0;
    defDown += aData['arp' + type] || 0;
    bonus += aData['bonus' + type] || 0;
    weak += dData['weak' + type] || 0;
    defend += (dData['defend' + type] || 0) - (aData['through' + type] || 0);
  }

  crit = between(crit, 0, 100) * 0.01;
  criDmg *= 0.01;
  bonus = 1 + bonus * 0.01; // 增伤区倍率
  weak = 1 + (Math.min(250.0, weak) * 0.01); // 易伤区倍率
  defend = between(n2r(defend), 0.1, 2.0); // 抵抗区倍率
  const dmgDown = n2r(aData.damageDown); // 虚弱区，攻击者伤害下降率
  const defEffect = calDefEffect(attacker.level, dData.def, defDown); // 防御区，受击者防御减伤效果
  const dmgRate = dData.damageRate; // 减伤区，受击者承受的伤害倍率

  return { aData, crit, criDmg, bonus, weak, defend, dmgRate, dmgDown, defEffect }
}
// 根据乘区数值计算伤害
function calDmgByData(base, d, options = null ) {
  options = options || {};
  const damage = base * d.bonus * d.weak * d.defend * d.dmgRate * d.dmgDown * d.defEffect;
  return options.simpleMode ? damage : {
    damage,
    criRate: d.crit,
    criDamage: damage * (1 + d.criDmg),
    expDamage: damage * (1 + d.crit * d.criDmg),
  }
}
// 快速计算常规伤害和DOT伤害，参数为基数，属性类型数组，进攻者和防御者
function calDmg(base, types, attacker, defender, options = null, fixed = null) {
  const d = calDmgData(types, attacker, defender, options, fixed);
  return calDmgByData(base, d, options);
}
// 计算治疗量
function calHealData(base, speller, target, bonus = 0 ) {
  const aData = speller.getAttributesT(target);
  return base * (1 + ( aData.healRate + bonus ) * 0.01) * (1 + target.attr.data.healBonus * 0.01);
}
// 计算护盾量
function calShieldData(base, speller, target ) {
  const aData = speller.getAttributesT(target);
  return base * (1 + aData.shieldRate * 0.01);
}

// 计算实际命中率
function calHitRate(baseRate, attacker, defender, count = 1, isControl = false, isDot = false, hitFix = 0) {
  const aData = attacker.getAttributesT(defender);
  const dData = defender.getAttributesB(attacker);
  const hit = baseRate * ((aData.hit + hitFix)*0.01+1) * n2r(dData.dodge*(isControl? n2r(dData.dodgeCtrl): 1.0)*(isDot ? n2r(dData.dodgeDot): 1.0));
  // 计算连续n次不命中的概率
  const miss = Math.pow(1.0 - Math.min(1.0, hit), count);
  return (1.0 - miss) * 100.0;
}

// 计算额外抵抗
function calDodgeRate(...dodges) {
  let x = 1.0;
  for(let i = 0; i < dodges.length; i++) {
    x *= n2r(dodges[i]);
  }
  return (1.0 - x) * 100.0;
}

// 计算行动间隔
function calActionTime(speed, bonusRate = 0) {
  speed = Math.max(speed, 0.01);
  const wait = 10000.0 / speed;
  return Math.max(wait - wait * bonusRate * 0.01, 0);
}

// 计算回能
function calEnergy(base, character) {
  const { enRate } = character.attr.data;
  return base * enRate * 0.01;
}

module.exports = {
  between,
  calDefEffect,
  calBrkDmg,
  calBreakDamage,
  calSuperBrkDmg,
  calDmgData,
  calDmgByData,
  calDmg,
  calHitRate,
  calActionTime,
  calEnergy,
  calDodgeRate,
  calHealData,
  calShieldData,
}