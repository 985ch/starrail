
function checkValidWords(subs, count, wordMax) {
  if(count<wordMax*6) return true;
  return fastCheck(subs, wordMax);
}

// 用贪心算法寻找一个符合条件的组合，当找不到时无论实际是否存在可行解都当做无解处理
function findEquipsByWords(main, subs, wordMax) {
  const subInfo = Object.keys(subs).map(key => ({
    key,
    count: subs[key].count,
    sel: subs[key].pos.reduce((n,v)=>n+v,0)
  })).filter(o => o.count > 0).sort((a,b)=> b.count-a.count);
  const results = []
  for(let part in main) {
    const sub = subInfo.find(o => o.key === main[part])
    results.push({
      part, key:main[part], count:0, keys:0, data:{},
      sort: sub? sub.sel: 99999,
    })
  }
  results.sort((a,b)=>b.sort-a.sort);
  for(let i=0; i<subInfo.length; i++) {
    let sub = subInfo[i];
    for(let j=0; j<results.length; j++) {
      let r = results[j];
      if(r.count>=wordMax+3 || r.keys>=4 || sub.key===r.key) continue;
      const used = Math.min(sub.count, (wordMax+3)-r.count-(3-r.keys));
      sub.count -= used;
      r.count += used;
      if(used>0)r.keys ++;
      r.data[sub.key] = used;
    }
    if(sub.count>0) return null;
  }
  return results;
}
// 快速确定不可能的组合
function fastCheck(subs, wordMax) {
  // 把词条按从高到底的顺序排列
  const list = Object.keys(subs).map(key => subs[key].count).sort((a,b)=>b-a);
  let total = list[0];
  let max = Math.min(4, list.length);
  const a = 6 * wordMax;
  for(let i=1; i<max; i++) {
    total += list[i];
    if(total>=a+i*wordMax) return false;
  }
  return true;
}

module.exports = {
  checkValidWords,
  findEquipsByWords,
}