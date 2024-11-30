const D = require('./equipdata');
// 转换词条设置
const transMap = {
  atkRate: ['atk','baseAtk'],
  defRate: ['def','baseDef'],
  hpRate: ['hp','baseHp'],
  speedRate: ['speed','baseSpeed'],
  hateRate: ['hate','baseHate'],
}
// 合并属性
function mergeAttrs(base, add, unit) {
  for(let key in add) {
    if(key==='damageRate') {
      base[key] *= add[key];
    } else {
      if(transMap[key]) base[transMap[key][0]] += unit[transMap[key][1]] * add[key] * 0.01;
      base[key] += add[key];
    }
  }
}
// 获取转换属性对象
function getTransJson(base, trans) {
  const data = {};
  for(let key in trans) {
    const { raw, min = 0, step = 0, rate = 0, max = 0, add = 0 } = trans[key];
    const rawVal = base[raw] + 0.0001;
    if(rawVal<min) return 0;
    const val = step? Math.floor((rawVal - min)/step) * rate + add: (rawVal-min) * rate + add;
    data[key] = max? Math.min(val, max): val;
  }
  return data;
}
// 获取当前配装的遗器BUFF数据
function getSetInfo({member, enemy, setBuffs}, set4A, set4B, set2) {
  // 得到套装配置数据
  const list = [];
  if(set2 && setBuffs[set2]) list.push(setBuffs[set2].set2);
  if(set4A || set4B) {
    if(set4A === set4B) {
      if(setBuffs[set4A]) list.push(setBuffs[set4A].set4);
    } else {
      if(set4A && setBuffs[set4A]) list.push(setBuffs[set4A].set2);
      if(set4B && setBuffs[set4B]) list.push(setBuffs[set4B].set2);
    }
  }
  // 将套装buff提供的属性赋给角色和敌人
  const transList = [];
  const buffs = [];
  const memberData = {...member.attr};
  const enemyData = {...enemy.attr};
  for(let i=0; i<list.length; i++) {
    const info = list[i];
    if(info) {
      mergeAttrs(memberData, info.attrsS, member);
      mergeAttrs(enemyData, info.attrsE, enemy);
      if(info.transList.length>0)transList.push(...info.transList);
      for(let key in info.buffs) {
        buffs.push({key, value: info.buffs[key].value, target: info.buffs[key].target});
      }
    }
  }
  return { memberData, enemyData, transList, buffs };
}
// 根据角色基础属性把比率转换为数值
function parseValue(key, value, unit) {
  if(transMap[key]) {
    const obj = transMap[key];
    return { key: obj[0], value: unit[obj[1]] * value * 0.01 };
  }
  return {key, value};
}
// 获取正确的属性和值
function parseAttrData(raw, unit) {
  const json = {};
  for(let key in raw) {
    const value = Array.isArray(raw[key])? list2value(key, raw[key]): raw[key];
    const r = parseValue(key, value, unit);
    json[r.key] = (json[r.key] || 0) + r.value;
  }
  return json;
}
// 根据遗器属性数组获取属性值
function list2value(key, list) {
  return list.reduce((v, i)=>v + D.EquipSubData.SSR[key][i], 0);
}
// 填充有效词条
function fillValidKeys(list, keys) {
  keys.forEach(key => {
    if(list.includes(key)) return;
    list.push(key);
    if(['atk','def','hp','speed','hate'].includes(key))list.push(key + 'Rate');
  })
}
module.exports = {
  mergeAttrs,
  getTransJson,
  getSetInfo,
  parseValue,
  parseAttrData,
  list2value,
  fillValidKeys,
}