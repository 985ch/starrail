const data = require('./yas_data');
const { json2equip } = require('./equip_generator');
// 从JSON中加载遗器数据
function readEquips(json, needLv) {
  try{
    const result = {};
    for(let key in data.parts) {
      const part = data.parts[key];
      result[part] = [];
      for(let info of json[key]) {
        const equip = transEquip(info, needLv);
        if(equip && (typeof equip !== 'string')) result[part].push(equip);
      }
    }
    return result;
  }catch(e) {
    console.log(e);
    return '文件解析失败';
  }
}
// 转换遗器数据
function transEquip(info, needLv) {
  const name = data.sets[info.setName];
  if(!name) {
    console.log('unknown setName:'+info.setName);
    return null;
  }
  if(info.omit || info.discard || info.star<4 || info.level < needLv) return null;
  const json = {
    name,
    part: data.parts[info.position],
    rarity: (info.star===5 || info.rarity===5)? 'SSR': 'SR',
    level: info.level,
    main: data.tags[info.mainTag.name][0],
    data: transAttrs(info.normalTags),
  }
  return json2equip(json);
}
// 转换子词条
function transAttrs(tags) {
  const attrs = {}
  for(let tag of tags) {
    const attr = data.tags[tag.name];
    attrs[attr[0]] = tag.value *attr[1];
  }
  return attrs;
}

module.exports = readEquips;