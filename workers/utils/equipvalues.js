const D = require('./equipdata');

const resultList = [
  {'1000': 0.25}, {'2000':0.0625, '1100':0.125},
  {'3000': 0.015625, '2100':0.046875, '1110':0.09375},
  {'4000': 0.00390625, '3100':0.015625, '2200':0.0234375, '2110':0.046875, '1111': 0.09375 },
  {'5000':0.0009765625,'4100':0.0048828125, '3200':0.009765625, '3110':0.01953125, '2210':0.029296875, '2111':0.05859375 },
]
// 计算指定次数迭代后的结果及其概率
/*function findResults( count = 0, rate = 1, words = [0,0,0,0], result = null) {
  result = result || {};
  if(count===0) {
    const key = words.join('');
    result[key] = (result[key] || 0) + rate;
    return result;
  }
  for(let i=0;i<words.length;i++){
    words[i]++;
    findResults(count-1, rate*0.25, words,  result)
    words[i]--;
  }
  return result;
}*/
// 计算升级后的结果并返回每种结果的概率
function getUpgradeResults({ data, rate }, json, count) {
  // 仅筛选出有效词条进行计算
  let fKey = null; // 失败词条
  const vKeys = [];
  for(let key in data) {
    if(json[key]) {
      vKeys.push(key);
    } else if(!fKey) {
      fKey = key;
    }
  }
  // 计算有效词条的升级结果
  let fRate = rate; // 全部失败概率
  const list = [];
  tryUpgrade(new Array(vKeys.length), count, (words, fCount) => {
    if(fCount===count)return; // 全部失败的情况下不计入列表

    const r = rate * getUpgradeRate(words, count);
    fRate -= r;
    const newData = {};
    const upgrade = [];
    for(let i=0; i<vKeys.length; i++) {
      const k = vKeys[i];
      const v = words[i];
      newData[k] = [ ...data[k], ...new Array(v).fill(1)];
      if(v===0) continue;
      if(upgrade.length>0 && upgrade[0][1]<v) {
        upgrade.unshift([k, v]);
      } else {
        upgrade.push([k, v]);
      }
    }
    if(fKey) {
      for(let key in data) {
        if(key===fKey) {
          newData[key] = [ ...data[key], ...new Array(fCount).fill(1)];
        } else if(!newData[key]) {
          newData[key] = data[key];
        }
      }
    }
    list.push({
      rate: r,
      data: newData,
      upgrade,
    })
  })
  if(fKey) {
    const newData = {...data};
    newData[fKey] = [ ...data[fKey], ...new Array(count).fill(1)];
    list.push({
      rate: fRate,
      data: newData,
    })
  }
  return list;
}
// 根据词条数量通过查表的方式获取其发生的基础概率
function getUpgradeRate(words, count) {
  const tbl = resultList[count-1];
  let rate = 0;
  const word = words.join('');
  for(let key in tbl) {
    const hits = [0,0,0,0]; // 索引字符是否已被命中
    let fail = false;
    // 尝试匹配索引表
    for(let i=0; i<words.length; i++) {
      let idx = -1;
      for(let j=0; j<key.length; j++) {
        if(word[i]===key[j] && !hits[j]) {
          hits[j] = 1;
          idx = j;
          break;
        }
      }
      if(idx===-1) {
        fail = true;
        break;
      }
    }
    if(fail) continue;
    // 匹配成功，累加概率
    rate += tbl[key];
    // 当有效词条数量为4的时候，只会匹配到唯一结果
    if(words.length===4) return rate;
  }
  //console.log(count, word, rate);
  return rate;
}
// 计算把N个词条放入N个位置的所有可能组合，并对每种组合执行指定方法
function tryUpgrade(list, max, func, idx = 0) {
  if(idx>=list.length) {
    return func(list, max);
  } else if(idx===3) {
    list[idx] = max;
    return func(list, 0);
  }
  for(let count=max; count>=0; count--) {
    list[idx] = count;
    tryUpgrade(list, max - count, func, idx+1);
  }
}

// 获取遗器潜力分
function computeScores(equip, json, withResults, func, rate = 1) {
  // 把遗器原始属性处理为带权重的原始属性数组
  const {list, count} = getEquipDataList(equip, json, rate);
  let avg = 0;
  let max = 0;
  let win = 0;
  const results = [];
  for(let i=0;i<list.length;i++) {
    // 计算升级之后的结果并得到分数
    const uList = getUpgradeResults(list[i], json, count);
    for(let j=0;j<uList.length;j++) {
      const cur = uList[j];
      const newEquip = {
        name: equip.name,
        part: equip.part,
        rarity: equip.rarity,
        main: equip.main,
        level: 15,
        data: cur.data,
      }
      const score = func({...newEquip});
      avg += score * cur.rate;
      if(score>0) win += cur.rate;
      if(score>max) max = score;
      if(withResults)results.push({
        equip: newEquip,
        rate: cur.rate,
        upgrade: cur.upgrade,
        score: score,
      })
    }
  }
  if(!withResults) return { win, avg, max};
  
  results.sort((a,b)=>b.score-a.score);
  return { list:results, win, avg, max }
}
// 根据遗器当前词条和级别，以及有效词条配置计算得出所有有效词条的组合及权重
function getEquipDataList({data, main, level}, json, rate = 1) {
  let count = 5 - Math.floor(level/3);
  const wKeys = Object.keys(data);
  const needWords = Math.max(0, 4 - wKeys.length);
  if(needWords===0) return { list: [{data: {...data}, rate}], count};
  if(wKeys.length===0) count += Math.random()<0.2? 4: 3;
  // 处理需要补充词条的情况
  count -= needWords;
  const list = fillWords(data, main, json, needWords, rate);
  return { list, count };
}
// 递归填充词条直至填满，返回每种词条组合出现的概率
function fillWords(data, main, json, count, rate) {
  // 计算总权重
  let other = null;
  let total = 0;
  const kList = D.EquipSubWeights.filter(cur => {
    if(data[cur.k] || main===cur.k) return false;
    total += cur.w;
    if(json[cur.k]) return true
    // 无效词条无论有多少种都将其视为同一种，并累加其权重
    if(other) {
      other.w += cur.w;
      return false;
    }
    other = {k: cur.k, w: cur.w};
    return true;
  });
  // 逐词条计算
  const list = [];
  for(let i=0; i<kList.length; i++) {
    const cur = kList[i];
    const r = (cur.k===other.k? other.w: cur.w) * rate/total;
    const newData = {...data, [cur.k]:[1] };
    if(count === 1) {
      list.push({ data: newData, rate: r })
    } else {
      const subList = fillWords(newData, main, json, count-1, r);
      subList.forEach(sub => {
        // 查找现有列表里是否有相同的词条
        const index = list.findIndex(o => {
          for(let key in sub.data) {
            if(!o.data[key]) return false;
          }
          return true;
        });
        // 有相同的词条，累加其权重
        if(index>=0) {
          list[index].rate += sub.rate;
        } else { // 没有相同的词条，添加到列表
          list.push(sub);
        }
      })
    }
  }
  return list;
}

module.exports = {
  computeScores,
}