const D = require('./data');
const { setsClass, setsData } = require('./equipments/index');
const WordSearcher = require('../utils/wordsearcher');

// 构造快速索引
const equipDict = new WordSearcher();
const attrsDict = new WordSearcher();
// 计算达到目标属性需要的最大词条数和最小词条数
function countNeedWords(rarity, key, n, max, acceptZero = false) {
  if(acceptZero && n<=0) return {min:0, max:0};
  n -= 0.005;

  const wArr = D.EquipSubData[rarity][key];
  const base = wArr[0];
  if(n<base) { //处理过小的数字
    return { min:1, max:1};
  }
  const add = wArr[1] - wArr[0];
  let cMin = Math.floor(n/(base+2*add));
  if(cMin*(base+2*add)<n + 0.01) cMin++;
  if(cMin>max) {
    return {min:max, max};
  }
  let cMax = Math.floor(n/base);
  const left = n - cMax*base;
  let cMaxNeed = left/add;
  if(cMaxNeed>cMax*2 + 0.01) cMax++;

  return {min:cMin, max:cMax};
}
// 根据目标值和指定的词条数获取具体词条
function value2words(rarity, key, n, count) {
  n -=0.005;
  const wArr = D.EquipSubData[rarity][key];
  const base = wArr[0];
  const add = wArr[1] - wArr[0];
  const avg = n/count;
  if(avg<=base) {
    return repeat([count, 0, 0]);
  }
  if(avg>=base+add+add) {
    return repeat([0, 0, count]);
  }
  if(avg<=base+add) {
    let left = Math.ceil((n - base*count)/add);
    return repeat([count-left, left, 0]);
  }
  let left = Math.ceil((n-(base+add)*count)/add);
  return repeat([ 0, count-left, left]);
}
// 根据词条数组获取词条值
function getSubValue(data, attr, rarity) {
  return Array.isArray(data)? data.reduce((v, i) => v + D.EquipSubData[rarity][attr][i], 0) : data;
}
function repeat(arr) {
  const result = new Array(arr[0]+arr[1]+arr[2]);
  let i = 0;
  for(let j=0; j<3; j++) {
    for(let k=0; k<arr[j]; k++) {
      result[i++] = j;      
    }
  }
  return result;
}
// 对一组词条进行分组并且返回分组结果，为null表示无法分组
function getGroups(list, value, idx = 0, result = []) {
  const cur = list[idx];
  if(idx === list.length-1) {
    if(value >= cur.min && value<= cur.max) {
      result.push(value);
      return result;
    }
    return null;
  }
  for(let i=cur.min; i<=cur.max; i++) {
    const next = getGroups(list, value-i, idx+1, result);
    if(next) {
      result.unshift(i);
      return result;
    }
  }
  return null;
}
// 把属性值转换为具体词条
function attr2words(rarity, main, level, attrJson) {
  // 计算每个属性需要的词条数量
  let count = 0;
  let wordsList = []
  for(let key in attrJson) {
    if(key===main) return {msg:'子词条和主词条重复'};
    count++;
    if(count>4) return {msg: '词条数量不符合要求'};
    const value = attrJson[key];
    const cInfo = countNeedWords(rarity, key, value, 6);
    if(value>0)wordsList.push({key, value, min: cInfo.min, max: cInfo.max});
  }
  // 拆分每个属性的词条，确保其词条数量符合要求
  const totalWords = Math.floor(level/3) + (rarity==='SSR'?3:2);
  if((totalWords>=4 && wordsList.length!==4) || (totalWords<4 && wordsList.length!==totalWords && wordsList.length!==totalWords+1)) return {msg:'词条数量不符合要求'};
  const groups = getGroups(wordsList, totalWords) || getGroups(wordsList, totalWords + 1);
  if(!groups) {
    const needMin = wordsList.reduce((v, obj)=>obj.min+v, 0);
    if( needMin>totalWords + 1) {
      return {msg:'需要词条数过多(' + needMin + ')，请适当减少词条的值'}
    }
    const needMax = wordsList.reduce((v, obj)=>obj.max+v, 0);
    return {msg:'词条数不足('+needMax+')，请适当增加词条的值'}
  }
  // 计算每个属性的具体词条并返回
  const newJson = {};
  for(let i=0; i<wordsList.length; i++){
    const cur = wordsList[i];
    const words = value2words(rarity,cur.key,cur.value, groups[i]);
    newJson[cur.key] = words;
  }
  return newJson;
}
// 根据配置JSON生成遗器
function json2equip(json) {
  const {name, part, rarity, level, main, data} = json;
  if(!D.EquipPartWords[part] || D.EquipPartWords[part].findIndex((v)=>v.k===main)<0) return '无效的主词条';
  const words = attr2words(rarity,main,level,data);
  if(words.msg) return words.msg;
  return {
    name, part, rarity, level, main,
    data: words,
  }
}
// ------------------遗器序列化---------------------
// 将遗器输出成文本
function stringifyEquip(equip, strict = true) {
  if(!equip) return '';
  const {name, part, rarity, level, main, data} = equip;
  if(!setsClass[name]) {
    getApp().onError('无效的遗器名称', '/simulator/equip_generator(stringifyEquip)','编辑失败', JSON.stringify(equip));
    return;
  }
  let text = `${setsClass[name].getDesc().short}${rarity==='SSR'?'金':'紫'}${D.EquipPartNames[part]}${level}${D.AttributeText[main].short}-`;
  const nList = strict? ['atk','hp','def']: ['atk','hp','def','speed'];
  for(let key in data) {
    const arrV = D.EquipSubData[rarity][key];
    const arrC = data[key];
    text += D.AttributeText[key].short;
    const value = arrC.reduce((v, c)=>v+arrV[c], 0);
    text += nList.indexOf(key)>=0? Math.floor(value) : (Math.floor(value*10)*0.1).toFixed(1);
  }
  return text;
}
// 从文本中解析出遗器
function parseEquip(text) {
  if(typeof text==='object') return text;
  // 构造查找链
  if(equipDict.isEmpty) {
    for(let i=0;i<2;i++) {
      for(let j=0;j<setsData[i].length;j++) {
        const cur = setsData[i][j];
        equipDict.addWord(cur.short, cur.name);
      }
    }
  }
  if(attrsDict.isEmpty) {
    for(let key in D.AttributeText) {
      if(!D.AttributeText[key].short || ['atkRate','defRate','hpRate','speedRate'].indexOf(key)>=0 )continue;
      attrsDict.addWord(D.AttributeText[key].short, key);
    }
  }
  // 逐词条录入并解析
  const json = {};
  text = text.replace(/[\r\n,\:-]/g, '');
  try{
    let idx = readWord(text, 0, equipDict, 'name', json);
    idx = readChar(text, idx, {金:'SSR',紫:'SR'}, 'rarity', json);
    idx = readChar(text, idx, D.EquipPartNames, 'part', json);
    idx = readNum(text, idx, 'level', json);
    idx = readWord(text, idx, attrsDict, 'main', json);
    if(['head','hand'].indexOf(json.part) < 0 && ['atk','def','hp'].indexOf(json.main) >= 0) {
      json.main += 'Rate';
    }
    const data = {};
    while(idx<text.length) {
      const temp = {}
      idx = readWord(text, idx, attrsDict, 'key', temp);
      idx = readNum(text, idx, 'value', temp, true);
      if(['atk','hp','def'].indexOf(temp.key)>=0 && temp.sign) {
        temp.key += 'Rate'; 
      }
      data[temp.key] = temp.value;
    }
    json.data = data;
  }catch(e) {
    return e.message;
  }
  // 构造遗器并返回
  return json2equip(json);
}
// 读取一个字符串并返回其对应的值
function readChar(text, idx, dict, key, json) {
  const cur = dict[text[idx]];
  if(!cur) throw new Error('字符串解析失败:' + text.substring(start, text.length));
  json[key] = cur;
  return idx + 1;
}
function readWord(text, idx, dict, key, json) {
  const result = dict.check(text, idx);
  if(!result) throw new Error('字符串解析失败:' + text.substring(start, text.length));
  json[key] = result.value;
  return result.word.length + idx;
}
// 读取一组数字并返回，若需要可标记是否浮点数
function readNum(text, idx, key, json, signFloat) {
  const digits = '0123456789';
  let sign = false;
  let numText = '';
  while(idx<text.length) {
    if(digits.indexOf(text[idx])>=0) {
      numText += text[idx];
    }else if(text[idx]==='.') {
      if(!sign) {
        sign = true;
        numText += text[idx];
      } else {
        throw new Error('一个数字中出现多个小数点');
      }
    } else {
      break;
    }
    idx++;
  }
  if(numText.length===0) {
    throw new Error('无效的数值:' + numText);
  };
  if(numText[0]==='0' && numText.length>1 && numText[1]!=='.') {
    throw new Error('无效的数值:' + numText);
  }
  json[key] = sign? parseFloat(numText): parseInt(numText);
  if(signFloat && sign) json.sign = true;
  return idx;
}
// 获取指定词条在指定范围内的所有可能取值
function getValues(rarity, key, max) {
  const list = [0];
  const wArr = D.EquipSubData[rarity][key];
  const base = wArr[0];
  const add = wArr[1] - wArr[0];
  for(let i=1; i<=max; i++) {
    for(let j=0; j<=i*2; j++) {
      const value = base*i + add*j;
      if(value > list[list.length-1]+0.002) {
        list.push(value);
      }
    }
  }
  return list;
}
// 批量导入遗器
function importEquips(text) {
  const list = text.split(';');
  const equips = [];
  for(let e of list) {
    e = e.replace(/\s/g, '')
    if(!e || e.length < 1) continue;
    const equip = parseEquip(e);
    if(typeof equip ==='string') return { equips, msg: equip };
    equips.push(equip);
  }
  return { equips };
}
// -----------------处理OCR文本---------------------
module.exports = {
  getSubValue,
  getValues,
  json2equip,
  stringifyEquip,
  parseEquip,
  countNeedWords,
  value2words,
  importEquips,
}