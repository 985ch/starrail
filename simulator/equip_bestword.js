const D = require('./data');
const { setNames } = require('./equipments/index');

// 把原始遗器数据处理成正常的遗器数据
function parseEquips({sets, equips, useless, wIdx }) {
  // 生成套装的部位名称
  const names = {
    head: getSetName(sets[1], 0),
    hand: getSetName(sets[1], 1),
    body: getSetName(sets[2] || sets[1], 2),
    foot: getSetName(sets[2] || sets[1], 3),
    link: getSetName(sets[0], 0),
    ball: getSetName(sets[0], 1),
  }
  // 按部位逐个生成遗器，同时计算有效副词条数
  return equips.map(equip => ({
    name: names[equip.part],
    part: equip.part,
    rarity: 'SSR',
    level: 15,
    main: equip.main,
    data: raw2data(equip.data, wIdx, useless),
  }));
}
// 处理套装名称，主要注意处理散件
function getSetName(name, i) {
  if(name==='内圈散件') return setNames[1][i];
  if(name==='外圈散件') return setNames[0][i];
  return name;
}
// 把副词条数量转换成副词条对象
function raw2data(raw, wIdx, useless) {
  const data={};
  let count = 0;
  let i=0;
  let j=0;
  for(let key in raw) {
    if(raw[key]===0) continue;
    i++;
    count += raw[key];
    data[key] = new Array(raw[key]).fill(wIdx);
  }
  while(i<4) {
    const n = i<4-1? 1: Math.max(1, 8 - count);
    data[useless[j]] = [0,n,0];
    count+=n;
    i++;
    j++;
  }
  return data;
}

module.exports = {
  parseEquips
}