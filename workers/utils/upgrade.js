const computers = require('./computer');
const { mergeAttrs, getTransJson, getSetInfo, parseValue, parseAttrData, fillValidKeys, list2value } = require('./base');
const { computeScores } = require('./equipvalues');
const D = require('./equipdata');
// 更新遗器分数
function updateEquipsScore(scheme, data) {
  // 获取完整的有效词条列表
  const validKeys = [];
  const subKeys = {};
  fillValidKeys(validKeys, scheme.attrKeys);
  fillValidKeys(validKeys, scheme.setAttrs);
  validKeys.forEach(k => { if(D.EquipSubScore[k])subKeys[k] = 1 });
  // 为所有遗器补充数值和索引，同时分拣待计算的遗器
  const groups = {};
  data.oldEquips.forEach(e => fillEquipData(e, validKeys, data.setBuffs, data.member));
  data.equips.forEach(e => {
    fillEquipData(e, validKeys, data.setBuffs, data.member);
    if(!groups[e.part])groups[e.part]={};
    if(!groups[e.part][e.name])groups[e.part][e.name]=[];
    groups[e.part][e.name].push(e);
  });
  // 计算初始遗器的各项数据
  const setJson = getSetJson(data.oldEquips);
  const oldSets = getSetList(setJson);
  const oldInfo = getSetInfo(data, oldSets[0], oldSets[1], oldSets[2]);
  const oldScore = getScore(data, scheme, oldInfo, data.oldEquips);
  // 逐个计算遗器分数并更新进度
  const state = {
    tt: Date.now(),
    count: 0,
    skip: 0,
    total: data.equips.length,
    oldScore,
  }
  const single = data.equips.length===1;
  let list = [];
  let checked = {};
  for(let part in groups) {
    for(let setName in groups[part]) {
      const { vEquip, newSets } = readyOldEquips(data.oldEquips, part, setName, setJson, oldSets); // 准备当前部位的旧遗器数据
      const setInfo = getSetInfo(data, newSets[0], newSets[1], newSets[2]);
      const params = {
        setInfo,
        validKeys,
        subKeys,
        vEquip,
        oldScore,
      }
      groups[part][setName].forEach(equip => {
        let equipInfo;
        if(checked[equip.key]) {
          equipInfo = checked[equip.key];
          state.skip++;
        } else {
          equipInfo = getUpgradeData(data, scheme, params, equip, single);
          equipInfo.buffs = setInfo.buffs;
          checked[equip.key] = equipInfo;
          state.count++;
        }
        list.push(equipInfo);
        list = postUpgradeState(state, list);
      })
    }
  }
}
// 得到旧遗器排除掉指定部位之后用于计算的数据
function readyOldEquips(oldEquips, part, setName, setJson, oldSets) {
  const attr = {};
  let newSets = oldSets;
  oldEquips.forEach(e => {
    if(!e)return;
    if(e.part===part) {
      if(e.name!==setName) {
        const names = ['link','ball'].includes(part)? setJson.set2: setJson.set4;
        names[e.name]--;
        names[setName] = (names[setName] || 0) + 1;
        newSets = getSetList(setJson);
        names[setName]--;
        names[e.name]++;
      }
      return;
    }
    for(let key in e.attr) {
      attr[key] = (attr[key] || 0) + e.attr[key];
    }
  });
  return { vEquip: { attr }, newSets };
}
// 计算遗器数值和索引填充到遗器数据中
function fillEquipData(equip, keys, setsInfo, member) {
  if(!equip) return;
  const {main, part, rarity, level, data} = equip;
  // 获得实际属性
  const json = parseAttrData(data, member);
  const mAttr = D.EquipMainData[rarity][main];
  const mInfo = parseValue(main, mAttr[0]+mAttr[1]*level, member);
  json[mInfo.key] = (json[mInfo.key] || 0) + mInfo.value;
  // 获得属性key
  const count = 5 - Math.floor(level/3);
  const name = setsInfo[equip.name]? equip.name: '其他';
  let key = part+':'+main+':'+name+':'+count+'$';
  for(let i=0; i<keys.length; i++) {
    const k = keys[i];
    if(data[k]) {
      key += i.toString() + ':' + list2value(k, data[k]).toFixed(2);
    }
  }
  // 填充遗器数据
  equip.attr = json;
  equip.key = key;
}
// 获取遗器组合
function getSetJson(equips) {
  const json = {set4:{}, set2:{}};
  equips.forEach(e => {
    if(!e) return;
    const key = ['link','ball'].includes(e.part)? 'set2': 'set4';
    json[key][e.name] = (json[key][e.name] || 0) + 1;
  });
  return json;
}
// 把遗器JSON转换成遗器数据
function getSetList(json) {
  const list = [];
  ['set4','set2'].forEach(key => {
    for(let name in json[key]) {
      const value = json[key][name];
      if(value>=4) {
        list.push(name, name);
      } else if(value>=2) {
        list.push(name);
      }
    }
  })
  return list;
}

// 获取遗器得分
function getScore({ member, transList }, { module, config }, setInfo, equips) {
  // 计算角色的基础属性
  const baseData = {...setInfo.memberData};
  for(let i=0; i<equips.length; i++) {
    if(!equips[i]) continue;
    mergeAttrs(baseData, equips[i].attr, member);
  }
  // 计算角色的完整属性
  const fullData = {...baseData};
  for(let i=0; i<transList.length; i++) {
    mergeAttrs(fullData, getTransJson(baseData, transList[i]), member);
  }
  for(let i=0; i<setInfo.transList.length; i++) {
    mergeAttrs(fullData, getTransJson(baseData, setInfo.transList[i]), member);
  }
  return computers[module](fullData, setInfo.enemyData, config);
}
// 获取升级后的数据
function getUpgradeData(data, scheme, {setInfo, validKeys, subKeys, vEquip, oldScore}, equip, single) {
  const result = computeScores(equip, subKeys, single, (tEquip)=>{
    fillEquipData(tEquip, validKeys, scheme.setAttrs, data.member);
    const score = getScore(data, scheme, setInfo, [vEquip, tEquip]);
    return Math.max(0, score-oldScore);
  });
  result.id = equip.id;
  result.part = equip.part;
  return result;
}
// 将计算进度通知到主进程
function postUpgradeState(state, list) {
  const now = Date.now();
  const complete = state.count + state.skip >= state.total;
  if(now-state.tt<500 && !complete) return list;
  state.tt = now;
  worker.postMessage({
    count: state.count,
    skip: state.skip,
    total:state.total,
    oldScore: state.oldScore,
    list: complete? JSON.stringify(list): '[]',
  });
  return list;
}
module.exports = updateEquipsScore;