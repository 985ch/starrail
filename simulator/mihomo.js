'use strict';
// 解码mihomo接口的数据并将其解析为本系统支持的格式
const D = require('../simulator/data');
const mihomo = require('./mihomo_data');

const parts = ['head','hand','body','foot', 'ball', 'link'];
const subWords = [
  'hp','atk','def','hpRate','atkRate','defRate',
  'speed','criRate','criDamage','hit','dodge','breakRate',
];
function read(json) {
  const list = []
  if(!json || !json.detailInfo) return '内容解析失败';
  const info = json.detailInfo;
  list.push(...(info.assistAvatarList || []), ...(info.avatarDetailList ||[]));
  return list.map(raw => decodeRaw(raw));
}
function  decodeRaw(raw) {
  return {
    name: mihomo.characters[raw.avatarId],
    level: raw.level,
    upgraded: raw.level%10===0 && raw.level/10-10 === (raw.promotion || 0),
    soul: raw.rank || 0,
    weapon: decodeWeapon(raw.equipment),
    skills: decodeSkills(raw.avatarId, raw.skillTreeList),
    equip: !raw.relicList? [] : raw.relicList.map(r=>decodeEquip(r)).filter(r=>r),
  }
}
function decodeSkills(avatarId, skillTreeList) {
  const skillKeys = ['na','ns','us','ps'];
  const attrIds = mihomo.idsMap[avatarId] || [0,7,1,5,2,8,3,6,9,4];
  const skills = {na:1, ns:1, us:1, ps:1, ex:[0,0,0], attr:[0,0,0,0,0,0,0,0,0,0]}
  for(let i = 0; i < skillTreeList.length; i++) {
    const skill = skillTreeList[i];
    const pid = skill.pointId;
    const level = skill.level || 0;
    const sid = pid-avatarId*1000;
    const group = Math.floor(sid/100);
    if(group === 0) {
      const key = skillKeys[sid-1];
      if(key) skills[key] = level;
    } else if(group === 1) {
      const idx = sid-100-1;
      if(idx>=0 && idx<3)skills.ex[idx] = level;
    } else {
      const idx = sid-200-1;
      if(idx>=0 && idx<10)skills.attr[attrIds[idx]] = level;
    }
  }
  return skills;
}
function decodeWeapon(raw) {
  return {
    name: mihomo.weapons[raw.tid],
    level: raw.level || 0,
    upgraded: raw.level%10===0 && raw.level/10-10 === raw.promotion,
    star: raw.rank,
  }
}
function decodeEquip(relic) {
  const tid = mihomo.spEquipsId[relic.tid] || relic.tid;
  const rarity = checkRarity(tid);
  const part = parts[relic.type-1]
  if(!rarity) return null;
  return {
    name: mihomo.equipments[Math.floor((tid%10000)*0.1)],
    part,
    level: relic.level || 0,
    rarity,
    main: D.EquipPartWords[part][relic.mainAffixId-1].k,
    data: getSubWords(relic.subAffixList),
  }
}
function checkRarity(tid) {
  const n = Math.floor(tid/10000);
  return n===6?'SSR':(n===5?'SR':null);
}
function getSubWords(list) {
  const data = {};
  for(let i = 0; i < list.length; i++) {
    const cur = list[i]
    let step = cur.step || 0;
    const words = [];
    for(let j = 0; j < cur.cnt; j++) {
      const cost = Math.min(2, step);
      words.unshift(cost);
      step-=cost;
    }
    data[subWords[cur.affixId-1]] = words;
  }
  return data;
}

module.exports = {
  read,
}