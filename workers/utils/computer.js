module.exports = {
  simple(member, enemy, config) {
    let score = 0;
    for(let key in config) {
      const info = config[key];
      if(member[key]<info.min-0.001) return -1;
      const val = member[key] * info.score;
      score += info.max? Math.min(val, info.max * info.score) : val;
    }
    return score;
  },
  damage(member, enemy, config) {
    let score = getExtScore(member, config.ext);
    if(score>=0) score += computeDamage(member, enemy, config);
    return score;
  },
  damageDot(member, enemy, config) {
    let score = getExtScore(member, config.ext);
    if(score>=0) score += computeDamage(member, enemy, config, false);
    return score;
  },
  damageBrk(member, enemy, config) {
    let score = getExtScore(member, config.ext);
    if(score>=0) score += computeBrkDmg(member, enemy, config);
    return score;
  },
  alive(member, enemy, config) {
    let score = getExtScore(member, config.ext);
    if(score>=0) score += computeAlive(member, enemy);
    return score;
  },
  c_firefly(member, enemy, config) {
    let score = getExtScore(member, config.ext);
    const breakRate = Math.min(360, member.breakRate);
    if(score>=0) score += computeDamage(member, enemy, config, true, (0.2*breakRate+200)*member.atk*0.01);
    return score;
  }
}
// 获取额外属性的得分
function getExtScore(member, ext) {
  let score = 0;
  for(let key in ext) {
    if(member[key]<ext[key].min - 0.001) return -1;
    const val = member[key] * ext[key].score;
    score += Math.min(val, (ext[key].max || 99999) * ext[key].score);
  }
  return score;
}
// 计算各个乘区的值
function computeData(aData, dData, types) {
  let defDown = dData.defDown + aData.defThrough;
  let bonus = aData.bonusAll; // 增伤区
  let weak = dData.weakAll; // 易伤区
  let defend = dData.defendAll - aData.throughAll; // 抵抗区
  for(let i=0; i< types.length; i++) {
    defDown += (aData['arp' + types[i]] || 0);
    bonus += (aData['bonus' + types[i]] || 0);
    weak += (dData['weak' + types[i]] || 0);
    defend += (aData['defend' + types[i]] || 0) - (aData['through' + types[i] || 0]);
  }
  bonus = 1 + bonus * 0.01; // 增伤区倍率
  weak = 1 + (Math.min(250.0, weak) * 0.01); // 易伤区倍率
  defend = between(n2r(defend), 0.1, 2.0); // 抵抗区倍率
  const dmgDown = n2r(aData.damageDown); // 虚弱区，攻击者伤害下降率
  const defEffect = 1000 / (1000 + Math.max(0, dData.def * n2r(defDown))); // 防御区，受击者防御减伤效果
  const dmgRate = dData.damageRate; // 减伤区，受击者承受的伤害倍率
  return { bonus, weak, defend, dmgDown, defEffect, dmgRate };
}
// 简单计算角色伤害数据
function computeDamage(aData, dData, {main, types}, canCrit = true, base = null) {
  const { bonus, weak, defend, dmgDown, defEffect, dmgRate } = computeData(aData, dData, types);
  base = base || aData[main];
  const damage = base * bonus * weak * defend * dmgRate * dmgDown * defEffect;
  if(!canCrit) return damage;
  let crit = aData.criRate; // 暴击
  let criDmg = aData.criDamage; // 暴伤
  for(let i=0; i< types.length; i++) {
    crit += (aData['crit' + types[i]] || 0);
    criDmg += (aData['criDmg' + types[i]] || 0);
  }
  crit = between(crit, 0, 100) * 0.01;
  criDmg *= 0.01;
  return damage * (1 + crit * criDmg);
}
// 简单计算角色超击破伤害数据
function computeBrkDmg(aData, dData) {
  const { weak, defend, dmgDown, defEffect, dmgRate } = computeData(aData, dData, ['BRK']);
  const bonus = 1.0 + aData.bonusBRK * 0.01;
  const base = 3767.5533;
  const breakRate = 1.0 + aData.breakRate * 0.01;
  const breakBonus = 1.0 + aData.breakBonus * 0.01;
  return base * breakBonus * breakRate * bonus * weak * defend * dmgRate * dmgDown * defEffect;
}
// 计算角色等效生命
function computeAlive(member, enemy) {
  const defEffect = 1000 / (1000 + member.def); // 防御区，受击者防御减伤效果
  const defend = Math.max(n2r(member.defendAll), 0.1);
  const dmgDown = n2r(enemy.damageDown); // 虚弱区，攻击者伤害下降率
  return member.hp / (defend * member.damageRate * dmgDown * defEffect);
}
// 限制值的最大最小值
function between(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
// 把概率数值转化为对应概率
function n2r(n) {
  return 1.0 - n * 0.01;
}