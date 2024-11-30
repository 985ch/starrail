'use strict';
const D = require('./equipdata');
// 比较词条优劣
function compareValue(a = 0, b = 0, key) {
  if(Math.abs(a-b)<=0.0001) return 0;
  const r = a>b? 1: -1;
  return key==='damageRate'? -r: r;
}
// 比较遗器优劣，a所有词条均优于b返回1，a所有词条均劣于b返回-1，词条互有优劣返回0
function compareItem(a, b, keys) {
  let result = 0;
  for(let i=0;i<keys.length;i++){
    const key = keys[i];
    const r = compareValue(a.data[key], b.data[key], key);
    if(r !== 0){
      if(r !== result && result !== 0) {
        return 0;
      }
      result = r;
    }
  }
  return result===0? (a.score>=b.score? 1: -1): result;
}
// 尝试把新的遗器加入优选遗器列表
function pushItem(item, keys, list = null, needPush = true) {
  if(!list) return [item];
  for(let i=0;i<list.length;i++){
    const r = compareItem(item.info, list[i].info, keys);
    if(r>0) {
      if(needPush) {
        list[i] = item;
        needPush = false;
      } else {
        list.splice(i, 1);
        i--;
      }
    } else if(r<0) {
      return list;
    }
  }
  if(needPush) list.push(item);
  return list;
}
// 计算遗器二二组合的最佳分组
function getEquipList(equips, parts, scheme, rule, names = null, msgFunc = null) {
  const lst = [ equips[parts[0]], equips[parts[1]] ];
  if(!lst[0] || !lst[1] || lst[0].length === 0 || lst[1].length === 0) return [];
  let list = [];
  for(let i = 0; i < lst[0].length; i++) {
    for(let j = 0; j < lst[1].length; j++) {
      if(msgFunc) msgFunc();
      const itm = [ lst[0][i], lst[1][j] ]
      if(names) { //排除和其他组中同名组合
        if(itm[0].name && itm[0].name === itm[1].name && names.includes(itm[0].name)) continue;
        if(itm[0].names) {
          if((itm[0].names[0]===itm[1].names[0] || itm[0].names[0]===itm[1].names[1]) && names.includes(itm[0].names[0])) continue;
          if((itm[0].names[1]===itm[1].names[0] || itm[0].names[1]===itm[1].names[1]) && names.includes(itm[0].names[1])) continue;
        }
      }
      const group = mergeEquipAttrs(itm[0], itm[1], names);
      list = pushItem(group, scheme.attrKeys, list);
    }
  }
  return filter(list, rule, scheme.scoreFilter);
}
// 合并遗器词条
function mergeEquipAttrs(a, b, names = null) {
  const ids = a.id? [a.id, b.id]: [...a.ids, ...b.ids];
  const data = {...a.info.data};
  for(let key in b.info.data) {
    data[key] = (data[key] || 0) + b.info.data[key];
  }
  const result = { ids, info:{ data, score: a.info.score + b.info.score } }
  if(a.fScore && b.fScore) result.fScore = a.fScore + b.fScore;
  if(names) { // 散件需要记录名称以便后续快速排除操作
    if(a.name) {
      result.names = [a.name, b.name];
    } else if(a.names) {
      result.names = [...a.names, ...b.names];
    }
  }
  return result;
}
// 过滤分数较低的遗器或组合
function filter(list, rule, scoreFilter) {
  if(scoreFilter===0) return list;

  let max = 0;
  for(let i=0;i<list.length;i++) {
    const score = getScore(list[i], rule.json);
    list[i].fScore = score;
    max = Math.max(max, score);
  }
  return list.filter(itm => !needScore(itm, rule.minList) || itm.fScore > max * scoreFilter * 0.01);
}
// 获取遗器记分规则
function getScoreRule({module, config, attrKeys}, { member }) {
  let json = {}
  let ext = config.ext || config;
  switch(module) {
    case 'damage':
    case 'dotDamage':
      json['bonus'+member.type] = 0.286;
      if(module==='damage') {
        json.criRate = 0.4;
        json.criDamage = 0.2;
      }
      break;
    default:
      break;
  }
  const minList = [];
  for(let key in ext) {
    if(ext[key].score) json[key] = ext[key].score * 0.01;
    if(ext[key].min) minList.push(key);
  }
  attrKeys.forEach(key => {
    if(json[key] || !D.EquipSubData.SSR[key]) return;
    if(['atk','def','hp'].includes(key)) {
      json[key] = getMainScore(member, key);
    } else {
      json[key] = 1/D.EquipSubData.SSR[key][1];
    }
  })
  return { json, minList };
}
// 获取记分值
function getScore(item, json) {
  if(item.fScore) return item.fScore;
  let score = 0;
  const data = item.info.data;
  for(let key in data) {
    if(json[key]) score += data[key]*json[key];
  }
  return score;
}
// 计算三大主词条记分规则
function getMainScore(member, key) {
  let baseKey = 'base' + key[0].toUpperCase() + key.slice(1);
  let base = D.EquipSubData.SSR[key+'Rate'][1] * member[baseKey] * 0.01;
  return 1/ base;
}
// 判断遗器或组合是否有限制最低值的词条
function needScore(item, minList) {
  const data = item.info.data;
  for(let i=0; i<minList.length; i++) {
    if(data[minList[i]]) return false;
  }
  return true;
}
module.exports = {
  pushItem,
  getEquipList,
  getScoreRule,
  filter,
};