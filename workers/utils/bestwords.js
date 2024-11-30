const computers = require('./computer');
const D = require('./equipdata');
const { mergeAttrs, getTransJson, getSetInfo, parseValue } = require('./base');
const { checkValidWords, findEquipsByWords } = require('./words2groups');
// 查找最佳词条组合
function findBestWords(scheme, data) {
  // 初始化数据
  const state = {
    tt: Date.now(),
    minScore: getScore(scheme, data, getSetInfo(data), data.member.attr, null, 0).score,
    count: 0,
    total: 0,
    results: [],
    sets:{}
  }
  // 初始化数据
  const {set4List, set2List, attrs} = initData(scheme, data);
  state.total=set2List.length * (set4List.length<=2? 1: countGroups(set4List.length)) + ( set4List.length<=2? 0:set2List.length);
  for(let set2Key of set2List) {
    if(set4List.length>2) {
      updateState(state, [set2Key, '外圈散件'], findBestSet([set2Key, '外圈散件'], attrs, scheme, data, state), scheme.maxResult, scheme.wordIdx);
    }
    for(let i=0; i<set4List.length;i++) {
      for(let j=i; j<set4List.length; j++) {
        if(scheme.setList[0].length===2 && i===j) continue;
        const sets = i===j? [set2Key, set4List[i]]: [set2Key, set4List[i], set4List[j]];
        const result = findBestSet(sets, attrs, scheme, data, state);
        updateState(state, sets, result, scheme.maxResult, scheme.wordIdx);
      }
    }
  }
}
// 阶乘
function countGroups(n) {
  let m = 1;
  for(let i=2;i<=n;i++) {
    m+=i;
  }
  return m;
}
// 初始化数据
function initData({ config, setAttrs, attrKeys, setList, wordIdx }, { member, setBuffs, transList }) {
  // 获取最小值限制
  const attrJson = config.ext || config;
  const attrsInfo = {};
  [...attrKeys, ...setAttrs].forEach(key => {
    const min = attrJson[key]? (attrJson[key].min || 0) : 0;
    const subInfo = D.EquipSubData.SSR[key];
    attrsInfo[key] = { min, steps:[min], val: subInfo? subInfo[wordIdx]: 0};
    if(['atk','def','hp'].includes(key)) {
      const rKey = key + 'Rate';
      const rateInfo = D.EquipSubData.SSR[rKey];
      attrsInfo[rKey] = { tar:key, val: parseValue(rKey, rateInfo[wordIdx], member).value}
    }
  });
  fillAttrs(attrsInfo, transList, wordIdx);
  ['atkRate','hpRate','defRate'].forEach((rKey)=>{
    const sKey = smallAttr(rKey);
    if(attrsInfo[sKey] && !attrsInfo[rKey]) attrsInfo[rKey] = { tar:sKey, val: parseValue(rKey, D.EquipSubData.SSR[rKey][wordIdx], member).value}
  });
  // 筛选套装组合
  const key = setList[0].length===2? 'set2': 'set4';
  const set4List = setList[0].length<=2? setList[0]: setList[0].filter(name => checkSetAttrs(setBuffs[name][key], attrsInfo));
  const set2List = setList[1].length===1? setList[1]: ['内圈散件'].concat(setList[1].filter(name => checkSetAttrs(setBuffs[name].set2, attrsInfo)));
  return { set4List, set2List, attrs: attrsInfo };
}
// 根据有效词条判断套装效果是否有用
function checkSetAttrs({attrsS, transList}, attrs) {
  for(let key in attrsS) {
    if(attrs[smallAttr(key)]) return true;
  }
  for(let i=0; i<transList.length; i++) {
    for(let k in transList[i]) {
      if(attrs[smallAttr(k)]) return true;
    }
  }
  return false;
}
// 在指定配装中查找最佳词条
function findBestSet(sets, attrs, scheme, data) {
  const { wordIdx, main, noSmallWord } = scheme;
  // 根据当前配装补充词条
  const { setBuffs } = data;
  const validAttrs = {};
  for(let key in attrs) {
    const raw = attrs[key];
    if(raw.tar) {
      validAttrs[key] = { tar: raw.tar, val:raw.val}
    } else {
      validAttrs[key] = { min: raw.min, steps:[...raw.steps], val: raw.val}
    }
  }
  fillAttrs(validAttrs, setBuffs[sets[0]]? setBuffs[sets[0]].set2.transList: null, wordIdx);
  if(sets.length===2) {
    fillAttrs(validAttrs, setBuffs[sets[1]]? setBuffs[sets[1]].set4.transList: null, wordIdx);
  } else {
    fillAttrs(validAttrs, setBuffs[sets[1]]? setBuffs[sets[1]].set2.transList: null, wordIdx);
    fillAttrs(validAttrs, setBuffs[sets[2]]? setBuffs[sets[2]].set2.transList: null, wordIdx);
  }
  // 分部位筛选有用的主词条
  const partWords = {
    head: [['hp'],[]],
    hand: [['atk'],[]],
  }
  const parts = ['body','foot','link','ball'];
  parts.forEach(part => {
    if(main[part]) {
      partWords[part] = [[main[part]],[]];
      return;
    }
    const keys = [[],[]]
    D.EquipPartWords[part].forEach(obj => {
      if(validAttrs[smallAttr(obj.k)]) {
        keys[0].push(obj.k);
      } else {
        keys[1].push(obj.k);
      }
    })
    partWords[part] = keys[0].length>0? keys: [['hpRate'],[]];
  })
  // 统一筛选有用的子词条，即需要用贪心算法计算的对象
  const subWords = [[],[]];
  for(let key in D.EquipSubScore) {
    if(noSmallWord && ['atk','def','hp'].includes(key))continue;
    if(validAttrs[smallAttr(key)]) {
      subWords[0].push(key);
    } else {
      subWords[1].push(key);
    }
  }
  // 计算套装基准属性
  const setInfo = getSetInfo(data, sets[1], sets[2] || sets[1], sets[0])
  // 按部位词条遍历
  const idx = [0, 0, 0, 0, 0, 0];
  let complete = false;
  let bestResult = null;
  do{
    complete = pickAndFind(idx, validAttrs, partWords, subWords, setInfo, scheme, data, (main, result)=>{
      if(!bestResult || result.score > bestResult.score) {
        bestResult = result;
        bestResult.main = main;
        bestResult.useless = subWords[1];
        bestResult.buffs = setInfo.buffs;
      }
    });
  }while(!complete);
  return bestResult;
}
// 根据转模数据来补充有效词条
function fillAttrs(json, transList, wIdx) {
  if(!transList) return;
  for(let i=0; i<transList.length; i++) {
    for(let key in transList[i]) {
      const cur = transList[i][key];
      if(!json[smallAttr(key)]) continue;
      const steps = getTransSteps(cur);
      const sKey = smallAttr(cur.raw);
      if(!json[sKey]) {
        const subInfo = D.EquipSubData.SSR[sKey];
        json[sKey] = { min: cur.min || 0, steps, val:subInfo? subInfo[wIdx]: 0 }
      } else {
        json[sKey].steps = json[sKey].steps.concat(steps).sort();
      }
    }
  }
}
function smallAttr(key) {
  switch(key) {
    case 'atkRate':
    case 'defRate':
    case 'hpRate':
    case 'speedRate':
      return key.slice(0, -4);
    default:
      return key;
  }
}
// 计算转模的阶段数组
function getTransSteps({ min, max, step, rate, add }) {
  const steps = [];
  if(!steps || !max) return [ min || 0 ];
  let val;
  let i = 0;
  do {
    val = i* (rate || 0) + (add || 0);
    steps.push(min + i*step);
    i++;
  }while(val < max-0.0001);
  return steps;
}
// 获取一组主词条，并在这个主词条下对副词条进行穷举比较
function pickAndFind(idx, validAttrs, partWords, subWords, setInfo, scheme, data, func) {
  const main = {};
  const subs = {};
  const mainData = {...setInfo.memberData}
  subWords[0].forEach(key => subs[key]=[1,1,1,1,1,1])
  for(let i=0; i<D.partList.length; i++) {
    const part = D.partList[i];
    const key = partWords[part][0][idx[i]];
    const wordData =D.EquipMainData.SSR[key];
    main[part] = key;
    if(subs[key]) subs[key][i] = 0;
    mergeAttrs(mainData, { [key]: wordData[0] + 15* wordData[1]}, data.member);
  }
  const result = findBestSubWords(main, validAttrs, subs, mainData, setInfo, scheme, data, scheme.wordCount);
  func(main, result);
  for(let j=0; j<D.partList.length; j++) {
    if(idx[j] < partWords[D.partList[j]][0].length - 1) {
      idx[j]++;
      return false;
    }
    idx[j] = 0;
  }
  return true;
}
// 计算当前套装和组词条组合下的最佳子词条配比
function findBestSubWords(main, validAttrs, subs, mainData, setInfo, scheme, data, wordCount) {
  // 初始化词条选择数据
  let leftCount = wordCount;
  const subState = {}; // 每个副词条选择情况
  let newData = {...mainData}; // 额外属性
  for(let key in subs) {
    const info = {
      pos: subs[key],
      min: validAttrs[smallAttr(key)].min, // 属性最小值
      maxCount: subs[key].reduce((n, v)=>n + v*(scheme.only8Words? 5: 6), 0), // 最大词条数
      val: validAttrs[key].val,
      count: 0, // 已使用词条数
      left: 0, // 剩余词条数
    }
    info.count = Math.min(leftCount, info.maxCount, initSubCount(key, info.min, validAttrs, mainData));
    info.left = info.maxCount - info.count;
    leftCount -= info.count;
    subState[key] = info;
    mergeAttrs(newData, { [smallAttr(key)]: info.count * validAttrs[key].val }, data.member);
  }
  let isComplete;
  let bestResult = null;
  do {
    // 计算最优词条得分
    const score = getScore(scheme, data, setInfo, newData, null, 0);
    const result = trySubWords(main, subState, newData, setInfo, scheme, data, leftCount, score);
    if(!result) break;
    if(!bestResult || result.score > bestResult.score) bestResult = result;
    // 重置词条选择数据并判断是否需要进行下一次穷举
    isComplete = true;
    leftCount = wordCount;
    newData = {...mainData};
    for(let key in subState) {
      const cur = subState[key];
      const sKey = smallAttr(key);
      const steps = validAttrs[sKey].steps;
      const minIdx = steps.findIndex(v => v > cur.min);
      cur.min = minIdx<0? steps[steps.length-1]: steps[minIdx];
      cur.count = initSubCount(key, cur.min, validAttrs, mainData)
      cur.left = cur.maxCount - cur.count;
      leftCount -= cur.count;
      if(cur.left<0 || leftCount<0) return result;
      if(minIdx>=0) isComplete = false;
      mergeAttrs(newData, { [sKey]: cur.count *cur.val }, data.member);
    }
  } while(!isComplete);
  return bestResult || findBestSubWords(main, validAttrs, subs, mainData, setInfo, scheme, data, wordCount - 1);
}
// 计算初始化时副词条的数量
function initSubCount(key, min, attrs, data) {
  if(['hp','atk','def'].includes(key)) return 0;
  const info = attrs[key];
  if(info.tar) key = info.tar;
  return Math.max(0, Math.ceil((min - data[key]) / info.val));
}
// 尝试穷举
function trySubWords(main, subs, attrs, setInfo, scheme, data, leftCount, score, locked = {}) {
  if(!checkValidWords(subs, scheme.wordCount, scheme.only8Words? 5: 6)) return null;
  const results = [];
  const wordMax = scheme.only8Words? 5: 6;
  let canAdd = false;
  if(leftCount>0) {
    for(let key in subs) {
      const cur = subs[key];
      if(cur.left > 0 && !locked[key]) {
        canAdd = true;
        results.push(getScore(scheme, data, setInfo, attrs, key, cur.val))
      }
    }
  }
  if(leftCount<=0 || !canAdd) return getResult(main, subs, score, wordMax);
  results.sort((a, b)=>b.score - a.score);
  const nextLocked = {...locked}
  for(let i=0; i<results.length; i++) {
    const cur = results[i];
    if(cur.key.left<=0) continue;
    subs[cur.key].count++;
    subs[cur.key].left--;
    attrs[smallAttr(cur.key)] += subs[cur.key].val;
    const res = trySubWords(main, subs, attrs, setInfo, scheme, data, leftCount-1, cur.score, nextLocked)
    if(res) return res;
    attrs[smallAttr(cur.key)] -= subs[cur.key].val;
    subs[cur.key].count--;
    subs[cur.key].left++;
    nextLocked[cur.key] = 1;
  }
  return getResult(main, subs, score, wordMax);
}
// 获取计算结果
function getResult(main, subs, score, wordMax) {
  const equips = findEquipsByWords(main, subs, wordMax);
  if(!equips) return null;

  const selected = {}
  for(let key in subs) {
    selected[key] = { pos: subs[key].pos, count: subs[key].count};
  }
  return { score, selected, equips }
}
// 计算得分
function getScore({module, config}, {member, transList}, setInfo, attrs, key, val) {
  // 计算角色的基础属性
  const baseData = {...attrs};
  if(key) baseData[smallAttr(key)]+=val || 0;
  // 计算角色的完整属性
  const fullData = {...baseData};
  for(let i=0; i<transList.length; i++) {
    mergeAttrs(fullData, getTransJson(baseData, transList[i]), member);
  }
  for(let i=0; i<setInfo.transList.length; i++) {
    mergeAttrs(fullData, getTransJson(baseData, setInfo.transList[i]), member);
  }
  return { key, score: computers[module](fullData, setInfo.enemyData, config) }
}
// 更新查询结果
function updateState(state, sets, result, resultsCount, wIdx) {
  state.count++;
  const obj = {
    sets,
    useless: result.useless,
    buffs: result.buffs,
    score: result.score,
    wIdx,
    equips: result.equips.map(e =>({main:e.key, data:e.data, part: e.part}))
  }
  // 更新最优结果
  const ranking = state.results;
  const len = ranking.length;
  if(len < resultsCount || ranking[len-1].score < obj.score) {
    let i = len-1;
    while(i>=0 && obj.score > ranking[i].score) {
      if(i < resultsCount-1) ranking[i+1] = ranking[i];
      i--;
    };
    ranking[i+1] = obj
  }
  // 更新套装最优结果
  for(let set of sets) {
    if(!state.sets[set] || state.sets[set].score < obj.score) state.sets[set] = obj;
  }
  // 发送通知
  const nt = Date.now();
  if(nt-state.tt < 1000 && state.count<state.total) return;
  state.results.forEach(res => {
    const wordJson = {};
    for(let key in res.equips) {
      const e = res.equips[key];
      for(let k in e.data) {
        if(e.data[k]>0) wordJson[k] = (wordJson[k] || 0) + e.data[k];
      }
    }
    res.ranking = Object.keys(wordJson).map(k => [k, wordJson[k]]).sort((a, b) => b[1]-a[1]);
  });
  worker.postMessage(state);
  state.tt = nt;
}

module.exports = findBestWords;