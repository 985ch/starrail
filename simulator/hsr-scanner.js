const data = require('./hsr-scanner-data');
const { json2equip } = require('./equip_generator');
const mihomo = require('./mihomo_data');
function readData(json) {
  try {
    const charInfo = {}
    readWeapons(json.light_cones, charInfo);
    const equips = readEquips(json.relics, charInfo);
    const characters = readCharacters(json.characters, charInfo);
    const eGroups = { head:[], hand:[], body:[], foot:[], link:[], ball:[]};
    equips.forEach(e => eGroups[e.part].push(e));
    return { equips: eGroups, characters };
  } catch(e) {
    console.log(e)
    return '数据解析失败'
  }
}
function readWeapons(light_cones, charInfo) {
  light_cones.forEach(wpn => {
    const name = mihomo.weapons[wpn.id];
    if(!name) {
      console.log('unkonw hsr weapon id:' + wpn.id);
      return;
    };
    if(!wpn.location || wpn.location==='') return;
    setCharInfo(charInfo, 'weapon', wpn.location, {
      name: name,
      star: wpn.superimposition,
      level: wpn.level,
      upgraded: checkUpgraded(wpn.level, wpn.ascension),
    })
  })
}
function readEquips(relics, charInfo) {
  const equips = [];
  relics.forEach(relic => {
    const name = mihomo.equipments[relic.set_id];
    if(!name) {
      console.log('unkonw hsr set id:' + relic.set_id);
      return;
    };
    const part = data.partMap[relic.slot];
    if(relic.rarity<4 || (relic.discard && relic.location===''))return;
    const equip = json2equip({
      name,
      part,
      level: relic.level,
      rarity: relic.rarity===5? 'SSR': 'SR',
      main: getMainWord(relic.mainstat, part),
      data: getSubWords(relic.substats),
    });
    equips.push(equip);

    if(relic.location && relic.loaction!=='') {
      const eList = getCharInfo(charInfo, 'equip', relic.location);
      if(eList) {
        charInfo[relic.location].equip.push(equip);
      } else {
        setCharInfo(charInfo, 'equip', relic.location, [equip]);
      }
    }
  })
  return equips;
}
function getMainWord(key, part) {
  if(['HP','ATK','DEF'].includes(key) && part!=='head' && part!=='hand') {
    return data.attrMap[key+'_'];
  }
  return data.attrMap[key];
}
function getSubWords(substats) {
  const json = {}
  substats.forEach(sub => {
    json[data.attrMap[sub.key]] = sub.value;
  })
  return json;
}
function checkUpgraded(level, rank) {
  return level%10===0 && level/10-10 === (rank || 0)
}
function setCharInfo(charInfo, type, id, value) {
  if(!charInfo[id]) {
    charInfo[id] = { [type]: value }
  } else {
    charInfo[id][type] = value;
  }
}
function getCharInfo(charInfo, type, id) {
  return charInfo[id]? charInfo[id][type] || null : null;
}
function readCharacters(characters, charInfo) {
  const allCharacters = [];
  characters.forEach(c => {
    const name = mihomo.characters[c.id];
    if(!name) {
      console.log('Unknown character: ' + c.id);
      return;
    }
    const json = {
      name,
      level: c.level,
      upgraded: checkUpgraded(c.level, c.ascension),
      soul: c.eidolon || 0,
      weapon: getCharInfo(charInfo, 'weapon', c.id),
      skills: readSkills(c.skills, c.traces, name),
      equip: getCharInfo(charInfo, 'equip', c.id) || [],
    }
    allCharacters.push(json);
  })
  return allCharacters;
}
function readSkills(skills, traces, name) {
  const idsMap = getAttrMap(name);
  const attr = new Array(10);
  for(let i = 0; i< 10; i++) {
    attr[idsMap[i]] = traces['stat_'+ (i+1)]? 1: 0;
  }
  return {
    na: skills.basic,
    ns: skills.skill,
    us: skills.ult,
    ps: skills.talent,
    ex: [
      traces.ability_1? 1: 0,
      traces.ability_2? 1: 0,
      traces.ability_3? 1: 0,
    ],
    attr,
  }
}
function getAttrMap(name) {
  for(let key in mihomo.characters) {
    if(mihomo.characters[key]===name) {
      return mihomo.idsMap[key] || [0,7,1,5,2,8,3,6,9,4];
    }
  }
  return [0,7,1,5,2,8,3,6,9,4];
}

module.exports = readData;