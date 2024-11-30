const { equipments, equipParts } = require('./mihomo_data');
const D = require('./data');
const WordSearcher = require('../utils/wordsearcher');
const { json2equip } = require('./equip_generator');

let equipDict = new WordSearcher();
let attrsDict = new WordSearcher();

// 初始化词典
function initDicts() {
  for(let key in equipParts) {
    equipDict.addWord(key, {
      name: equipments[equipParts[key][0]],
      part: equipParts[key][1],
    })
  }
  for(let key in D.AttributeText) {
    const cur = D.AttributeText[key];
    if(!cur.fullText) continue;
    attrsDict.addWord(cur.fullText, key);
  }
}

// 清洗字符串，处理特殊字符并清空空字符
function cleanString(str) {
  str = str.replace(/[暂未装备遗器|》|>|»|\r]/g, '').replace(/[\x20|\t]+/g, ' ');
  // 清除空行
  while (str.indexOf('\n\n') > -1) {
    str = str.replace('\n\n', '\n');
  }
  return str;
}
// 返回从指定位置跳过所有空格后的下一个字符的索引
function skipSpace(str, idx) {
  while (idx < str.length && str[idx] === ' ') {
    idx++;
  }
  return idx;
}
// 读取数值
function readNumber(str, idx) {
  let i = idx;
  while(i<str.length) {
    const char = str[i];
    if ((char<'0' || char>'9') && char !== '.') break;
    i++;
  }
  const num = parseFloat(str.substring(idx, i));
  if(Object.is(num, NaN)) throw new Error('解析失败:' + str);
  const isPercent = str[i] === '%';
  return {
    value: num,
    isPercent,
    idx: isPercent ? i + 1: i,
  }
}
// 修正某些特殊属性
function fixAttr(key, value, isPercent) {
  switch(key) {
    case 'atk':
    case 'hp':
    case 'def':
      if(isPercent) {
        return {
          key: key+'Rate',
          value,
        }
      }
      break;
    default:
      break;
  }
  return { key, value };
}
// 根据属性和数值推测稀有度
function guessRarity(key, value, level) {
  const md = D.EquipMainData;
  let ssrVal = md.SSR[key][0] + md.SSR[key][1]* level;
  let srVal = md.SR[key][0] + md.SR[key][1]* level;
  if(key==='speed') {
    ssrVal = Math.floor(ssrVal);
    srVal = Math.floor(srVal);
  }
  if(Math.abs(value - ssrVal)<Math.abs(value - srVal)) return 'SSR';
  return 'SR';
}
// 从微信导入内容
function importEquipsFromWX(text) {
  try {
    const equips = readWX(text);
    const msg = equips.find(e => typeof e==='string');
    return { equips: equips.filter(e => typeof e !== 'string'), msg }
  }catch(e){
    return { equips: [], msg: e.message }
  }
}
// 解析微信识别的图片文本
function readWX(text) {
  if(equipDict.isEmpty || attrsDict.isEmpty) {
    initDicts();
  }
  text = cleanString(text);
  const lines = text.split('\n');
  let i = 0;

  const equips = [];
  while(i < lines.length) {
    const line = lines[i];
    const info = equipDict.check(line);
    if(info) {
      i = readWXEquip(lines, i, equips);
    } else {
      i ++;
    }
  }
  return equips;
}
// 解析微信图片上的遗器文本
function readWXEquip(lines, i, equips) {
  const list = readWXEquipName(lines[i]);
  readWXEquipMain(lines[++i], list);
  while(readWXEquipSub(lines[++i], list));
  list.forEach(json => {
    const e = json2equip(json);
    equips.push((typeof e === 'string')? `${e}(${json.title})`: e);   
  })
  return i;
}
// 解析微信图片的遗器名称行
function readWXEquipName(text) {
  const list = [];
  let idx = 0;
  while(idx < text.length) {
    const info = equipDict.check(text, idx);
    if(info) {
      idx = text.indexOf('+', idx + info.word.length);
      if(idx < 0) throw new Error('解析失败:' + text);
      const nInfo = readNumber(text, idx+1);
      list.push({
        title: info.word,
        name: info.value.name,
        part: info.value.part,
        level: nInfo.value,
      });
      idx = skipSpace(text, nInfo.idx);
    }
  }
  return list;
}
// 解析微信图片的遗器主属性
function readWXEquipMain(text, list) {
  let idx = 0;
  for(let i=0; i<list.length; i++) {
    const json = list[i];
    const wInfo = attrsDict.check(text, idx);
    if(!wInfo) throw new Error('解析失败:' + text);
    const nInfo = readNumber(text, skipSpace(text, idx + wInfo.word.length));
    const fixed = fixAttr(wInfo.value, nInfo.value, nInfo.isPercent);
    json.main = fixed.key;
    json.rarity = guessRarity(fixed.key, fixed.value, json.level);
    json.data = {};
    idx = skipSpace(text, nInfo.idx);
  }
}
// 解析微信图片的遗器副属性
function readWXEquipSub(text, list) {
  if(!text) return false;
  let idx = 0;
  for(let i=0; i<list.length; i++) {
    const data = list[i].data;
    const wInfo = attrsDict.check(text, idx);
    if(!wInfo) {
      if(idx === 0){
        return false;
      } else {
        throw new Error('解析失败:' + text)
      }
    };
    let nInfo = readNumber(text, skipSpace(text, idx + wInfo.word.length));
    idx = skipSpace(text, nInfo.idx);
    if(text[idx]>='0' && text[idx]<='9') {
      nInfo = readNumber(text, idx);
      idx = skipSpace(text, nInfo.idx);
    }
    const fixed = fixAttr(wInfo.value, nInfo.value, nInfo.isPercent);
    data[fixed.key] = fixed.value;
  }
  return true;
}

module.exports = {
  importEquipsFromWX,
}