const computers = require('./computer');
const filter = require('./filter');
const { mergeAttrs, getTransJson, getSetInfo, fillValidKeys } = require('./base');
// 组合词条配置
const partGroups = [
  { key:'头手', parts:['head','hand'], needKey:'身脚'},
  { key:'头身', parts:['head','body'], needKey:'手脚'},
  { key:'头脚', parts:['head','foot'], needKey:'手身'},
  { key:'手身', parts:['hand','body'], needKey:'头脚'},
  { key:'手脚', parts:['hand','foot'], needKey:'头身'},
  { key:'身脚', parts:['body','foot'], needKey:'头手'},
]
// 筛选最优遗器
function selectEquips(scheme, data) {
  const state = {
    tt: Date.now(),
    count: 0,
    skip: 0,
    results: [],
  }
  // 筛选遗器，将其分为套件和散件
  const set4Info = scheme.set4? Object.keys(scheme.set4).map(k=> ({k, v: scheme.set4[k]}) ): [];
  const sets = filterSetEquips(data, scheme);
  // 初始化，计算2件套组合总数和4件套组合总数
  const eInfo = initEquips(state, data.equips, scheme, data, sets, scheme.set2, set4Info);
  //console.log(eInfo);
  worker.postMessage({type:'initComplete', count:eInfo.count});
  // 穷举套装并比较结果
  const keys = Object.keys(eInfo.equips2).sort((a, b)=>(a==='散件'?-1:(b==='散件'?1:0))); // 确保2+2时散件最先计算，以简化去重判断
  let sameGroups = null;
  for(let keyNQ in eInfo.equipNQ) { // 抽取链球（含散件）
    const nqList = eInfo.equipNQ[keyNQ];
    if(!nqList) continue;
    for(let key in eInfo.equips4) { // 抽取4件套（含散件4）
      const wqList = eInfo.equips4[key];
      if(!wqList) continue;
      const setInfo = getSetInfo(data, key, key, keyNQ);
      pick24(nqList, wqList, scheme, data, state, setInfo);
    }
    for(let i=0; i<keys.length - 1; i++) { // 抽取2+2（含2+散件）
      const wqListA = eInfo.equips2[keys[i]];
      if(!wqListA) continue;
      if(keys[i]==='散件') sameGroups = new Set();
      for(let j=i+1; j<keys.length; j++) {
        if(!checkGroupValid(set4Info, keys[i], keys[j]))continue;
        const wqListB = eInfo.equips2[keys[j]];
        if(!wqListB) continue;
        const setInfo = getSetInfo(data, keys[i], keys[j], keyNQ);
        const groupName = keys[i]==='散件'? keys[j]: null; // 需排除去重的2件套名称
        partGroups.forEach(partInfo => {
          pick222(nqList, wqListA[partInfo.key], wqListB[partInfo.needKey], scheme, data, state, setInfo, groupName, sameGroups);
        })
      }
      //if(sameGroups)console.log(sameGroups.size);
      sameGroups = null;
    }
  }
  postUpdateMsg(state, 'complete');
}
// 筛选出特效有用的套装效果，其他皆视为散件
function filterSetEquips({setBuffs, equips}, {attrKeys, setAttrs, set4, set2}) {
  const set2List = [];
  const freeEquips = {};
  const set4List2 = [];
  const set4List4 = [];
  const attrs = [];
  fillValidKeys(attrs, attrKeys);
  fillValidKeys(attrs, setAttrs);

  for(let name in setBuffs) {
    if(!equips[name]) continue;
    const info = setBuffs[name];
    if(info.set4) {
      if(set4[name] || checkSetAttrs(info.set4, attrs)) {
        set4List4.push(name);
        if(set4[name] || checkSetAttrs(info.set2, attrs)) {
          set4List2.push(name);
        }
      }
    }else if(set2===name || checkSetAttrs(info.set2, attrs)) {
      set2List.push(name);
    }
    // 所有遗器都会被加入散件列表
    for(let part in equips[name]) {
      equips[name][part].forEach(item =>{
        item.name = name;
        freeEquips[part] = filter.pushItem(item, attrKeys, freeEquips[part]);
      })
    }
  }
  equips['散件'] = freeEquips;
  return {set2List, set4List2, set4List4};
}
// 根据有效词条判断套装效果是否有用
function checkSetAttrs({attrsS, transList}, attrs) {
  for(let key in attrsS) {
    if(attrs.includes(key)) return true;
  }
  for(let i=0; i<transList.length; i++) {
    for(let k in transList[i]) {
      if(attrs.includes(k)) return true;
    }
  }
  return false;
}
// 初始化遗器组合数据，按两两分组的方式再次对遗器进行排除
function initEquips(state, equips, scheme, data, {set2List, set4List2, set4List4}, set2, set4Info) {
  const jsonNQ = {}; // 内圈JSON
  let countNQ = 0; // 内圈数量
  const json2 = {}; // 外圈2件套JSON
  const json4 = {}; // 外圈4件套JSON
  const {scoreFilter, attrKeys} = scheme;
  const fRule = filter.getScoreRule(scheme, data);

  if(!set2) jsonNQ['散件'] = filter.getEquipList(equips['散件'], ['link', 'ball'], scheme, fRule, set2List);
  if(set4Info.length===0 || (set4Info[0].v===2 && set4Info.length===1)) {
    json2['散件']={}
    partGroups.forEach(info =>{
      json2['散件'][info.key] = filter.getEquipList(equips['散件'], info.parts, scheme, fRule, set4List4);
    });
  }
  for(let name in equips) {
    if(name === '散件') {
      continue;
    } else if(set2List.includes(name)) {
      const list = filter.getEquipList(equips[name], ['link', 'ball'], scheme, fRule);
      if(jsonNQ['散件'])list.forEach(item => filter.pushItem(item, attrKeys, jsonNQ['散件'], false));
      if(list.length > 0) {
        jsonNQ[name] = list;
        countNQ += list.length;
      }
    } else if(set4List4.includes(name)) {
      if(set4Info.findIndex(itm => itm.k === name)<0 && (set4Info.length===2 || (set4Info.length===1 && set4Info[0].v === 4)))continue;
      const cur = {};
      let pushCount = 0;
      partGroups.forEach(info =>{
        const list = filter.getEquipList(equips[name], info.parts, scheme, fRule);
        list.forEach(item => {
          const needPush = !set4List2.includes(name);
          if(needPush) {
            item.names = [name, name];
          }
          if(json2['散件'])filter.pushItem(item, attrKeys, json2['散件'][info.key], needPush);
        });
        if(list.length>0) {
          cur[info.key] = list;
          pushCount++;
        }
      })
      if(pushCount > 0) json2[name] = cur;
    }
  }
  if(set4Info.length!==2) {
    for(let key in json2) {
      if(set4Info.length>0 && key!==set4Info[0].k)continue;
      json4[key] = filter.getEquipList(json2[key], ['头手','身脚'], scheme, fRule, key==='散件'? set4List4: null, ()=>postCountMsg(state));
    }
  }
  if(jsonNQ['散件'])jsonNQ['散件'] = filter.filter(jsonNQ['散件'], fRule, scoreFilter);
  if(json2['散件']) {
    for(let key in json2['散件']) {
      json2['散件'][key] = filter.filter(json2['散件'][key], fRule, scoreFilter);
    }
  }
  countNQ += jsonNQ['散件']? jsonNQ['散件'].length: 0;
  return { equipNQ:jsonNQ, equips2:json2, equips4: json4, count: countNumbers(countNQ, json2, json4, set4Info) };
}
// 计算组合数量
function countNumbers(nqCount, json2, json4, set4Info) {
  let count = 0;
  const keys = Object.keys(json2);
  for(let i=0; i<keys.length; i++) {
    const groupA = json2[keys[i]];
    for(let j=i+1; j<keys.length; j++) {
      const groupB = json2[keys[j]];
      if(!checkGroupValid(set4Info, keys[i], keys[j]))continue;
      partGroups.forEach(info => {
        count += nqCount * (groupA[info.key]? groupA[info.key].length : 0) * (groupB[info.needKey]? groupB[info.needKey].length : 0);
      })
    }
    count += json4[keys[i]]? nqCount * (json4[keys[i]].length): 0;
  }
  return count;
}
// 检查外圈是否符合要求
function checkGroupValid(set4Info, key1, key2) {
  const len = set4Info.length;
  if(len===0) return true;
  if(len===1) {
    if(set4Info[0].v === 4) {
      return set4Info[0].k === key1 && key1===key2;
    }
    return set4Info[0].k === key1 || set4Info[0].k === key2;
  }
  return key1!==key2 && ([key1, key2].includes(set4Info[0].k)) && ([key1, key2].includes(set4Info[1].k));
}
// 抽取2+4
function pick24(list2, list4, scheme, data, state, setInfo) {
  const len2 = list2.length;
  const len4 = list4.length;
  for(let i=0; i<len2; i++) {
    for(let j=0; j<len4; j++) {
      const lst = [list2[i], list4[j]];
      const score = getScore(data, scheme, setInfo, lst);
      updateRanking(score, lst, setInfo.buffs, state, scheme.maxResult);
    }
  }  
}
// 抽取2+2+2
function pick222(list2, list4A, list4B, scheme, data, state, setInfo, gName, sameGroups) {
  const len2 = list2.length;
  const len4A = list4A? list4A.length: 0;
  const len4B = list4B? list4B.length: 0;
  for(let i=0; i<len2; i++) {
    for(let j=0; j<len4A; j++) {
     for(let k=0; k<len4B; k++) {
      const lst = [list2[i], list4A[j], list4B[k]];
      if(gName && checkGroupNames([lst[1], lst[2]], gName, sameGroups)) {
        state.skip++;
      } else {
        const score = getScore(data, scheme, setInfo, lst);
        updateRanking(score, lst, setInfo.buffs, state, scheme.maxResult);
      }
     }
    }
  }
}
// 更新排行榜
function updateRanking(score, lst, buffs, state, maxResult) {
  state.count++;
  const ranking = state.results;
  const len = ranking.length;
  if(score<0 || (len >= maxResult && score <= ranking[len-1].score)) {
    postUpdateMsg(state);
    return;
  }
  const ids = lst.reduce((allIds,obj) => allIds.concat(obj.ids), []);
  const obj = {score, ids, buffs};
  if(len < maxResult) {
    ranking.push(obj);
  }
  let i = len-1;
  while(i>=0 && score > ranking[i].score) {
    if(i < maxResult-1) ranking[i+1] = ranking[i];
    i--;
  };
  ranking[i+1] = obj;
}
// 更新初始化信息到主线程
function postCountMsg(state) {
  const nt = Date.now();
  if(nt-state.tt < 1000) return;
  worker.postMessage({type:'countTime'});
  state.tt = nt;
}
// 更新状态信息到主线程
function postUpdateMsg(state, type = 'update') {
  const nt = Date.now();
  if(type==='update' && nt-state.tt < 1000) return;
  const { count, results, skip } = state;
  worker.postMessage({type, count, skip, results});
  //console.log(results);
  state.tt = nt;
}
// 获取遗器得分
function getScore({ member, transList }, { module, config }, setInfo, items) {
  // 计算角色的基础属性
  const baseData = {...setInfo.memberData};
  for(let i=0; i<items.length; i++) {
    mergeAttrs(baseData, items[i].info.data, member);
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
// 排除散件+2件组合中重复的组合
function checkGroupNames(items, gName, sameGroups) {
  if(items[0].names[0]!==gName && items[0].names[1]!==gName) return false;
  const key = [items[0].ids[0], items[0].ids[1], items[1].ids[0], items[1].ids[1] ].sort().join(',');
  if(sameGroups.has(key)) {
    return true;
  }
  sameGroups.add(key);
  return false;
}

module.exports = selectEquips;