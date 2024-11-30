'use strict';

const { weaponsJson } = require('../weapons/index')
const Equipment = require('../equipment');
const { parseEquip } = require('../equip_generator');

// 姓名修正配置
const fixJson = {
  '静流':'镜流',
  '丹恒(饮月)':'丹恒•饮月',
  '托帕':'托帕&账账',
}

// 角色一览
const allCharacters = [
  require('./ssr_feixiao'),
  require('./ssr_boothill'),
  require('./ssr_ratio'),
  require('./ssr_topaz'),
  require('./ssr_seele'),
  require('./ssr_yanqing'),
  require('./sr_moze'),
  require('./sr_march7th_sword'),
  require('./sr_danheng'),
  require('./sr_sushang'),
  
  require('./ssr_yunli'),
  require('./ssr_firefly'),
  require('./ssr_jingliu'),
  require('./ssr_danheng_yy'),
  require('./ssr_blade'),
  require('./ssr_clara'),
  require('./ssr_trailblazer_des'),
  require('./sr_misha'),
  require('./sr_xueyi'),
  require('./sr_arlan'),
  require('./sr_hook'),

  require('./ssr_rappa'),
  require('./ssr_jade'),
  require('./ssr_argenti'),
  require('./ssr_jingyuan'),
  require('./ssr_himeko'),
  require('./sr_qingque'),
  require('./sr_serval'),
  require('./sr_herta'),

  require('./ssr_jiaoqiu'),
  require('./ssr_acheron'),
  require('./ssr_black_swan'),
  require('./ssr_kafka'),
  require('./ssr_silver_wolf'),
  require('./ssr_welt'),
  require('./sr_guinaifen'),
  require('./sr_luka'),
  require('./sr_pela'),
  require('./sr_sampo'),

  require('./ssr_robin'),
  require('./ssr_sparkle'),
  require('./ssr_ruanmei'),
  require('./ssr_bronya'),
  require('./ssr_trailblazer_har'),
  require('./sr_hanya'),
  require('./sr_yukong'),
  require('./sr_tingyun'),
  require('./sr_asta'),
  
  require('./ssr_aventurine'),
  require('./ssr_fuxuan'),
  require('./ssr_gepard'),
  require('./ssr_trailblazer_pre'),
  require('./sr_march7th'),

  require('./ssr_lingsha'),
  require('./ssr_huohuo'),
  require('./ssr_luocha'),
  require('./ssr_bailu'),
  require('./sr_gallagher'),
  require('./sr_lynx'),
  require('./sr_natasha'),
]

// 角色分类数据
const charactersData = [
  {
    text: '巡猎',
    data:[],
  },
  {
    text: '毁灭',
    data: [],
  },
  {
    text: '智识',
    data: [],
  },
  {
    text: '虚无',
    data: [],
  },
  {
    text: '同谐',
    data: [],
  },
  {
    text: '存护',
    data: [],
  },
  {
    text: '丰饶',
    data: [],
  }
];

// 角色数据JSON版
const charactersJson = {}

for(let i=0; i < allCharacters.length; i++){
  const char = allCharacters[i];
  charactersJson[char.data.name] = char;
  const typeIdx = charactersData.findIndex(o => o.text===char.data.job);
  if(!char.data.tmp)charactersData[typeIdx].data.push({ name: char.data.name, rarity:char.data.rarity});
}


function createCharacter(team, index, name, json) {
  name = fixJson[name] || name;
  if(charactersJson[name]) {
    return new charactersJson[name].character(team, index, json);
  }
  return null;
}

function readACmd({ text, idx }, func) {
  const endPoint = text.indexOf(';', idx);
  if(endPoint === -1) throw new Error('数据解析失败:'+ idx);
  const cmd = text.substring(idx, endPoint);
  //console.log(cmd);
  func(cmd);
  return { text , idx: endPoint + 1 };
}
function readInt(text, min, max) {
  if(/^[0-9]+$/.test(text) && parseInt(text) >= min && parseInt(text) <= max) {
    return parseInt(text);
  }
  throw new Error(`数值解析失败:${text}(${min}~${max})`);
}
function readCharacter(text, idx) {
  try{
    let info = { text, idx};
    const json = {};
    info = readACmd(info, (cmd) => {
      if(cmd === '无') {
        json.name = null;
        return;
      }
      const idxSL = cmd.indexOf('[');
      if(idxSL < 0) throw new Error('数据解析失败:'+ cmd);
      json.name = cmd.substring(0, idxSL);
      if(!charactersJson[json.name]) throw new Error('角色不存在:'+json.name);
      const idxSR = cmd.indexOf(']', idxSL + 1);
      if(idxSR < 0) throw new Error('数据解析失败:'+ cmd);
      json.soul = readInt(cmd.substring(idxSL+1, idxSR), 0, 6);
      const idxFlag = Math.max(cmd.indexOf('+', idxSR + 1),cmd.indexOf('-', idxSR + 1));
      if(idxFlag < 0) throw new Error('数据解析失败:'+ cmd);
      json.level = readInt(cmd.substring(idxSR+1, idxFlag), 1, 80);
      json.upgraded = (cmd[idxFlag] === '+');
      if(json.upgraded && (json.level % 10 !== 0 || json.level===10 || json.level===80 )) throw new Error('无效的等级:'+ cmd);
      const skills = {ex:[0,0,0],attr:[0,0,0,0,0,0,0,0,0,0]}
      let i = idxFlag + 1;
      skills.na = readInt(cmd[i], 0, 5) + 1;
      skills.ns = readInt(cmd[i+1], 0, 9) + 1;
      skills.us = readInt(cmd[i+2], 0, 9) + 1;
      skills.ps = readInt(cmd[i+3], 0, 9) + 1;
      skills.ex[0] = readInt(cmd[i+4], 0, 1);
      skills.ex[1] = readInt(cmd[i+5], 0, 1);
      skills.ex[2] = readInt(cmd[i+6], 0, 1);
      for(let j=0; j<10; j++){
        skills.attr[j] = readInt(cmd[i+7+j], 0, 1);
      }
      json.skills = skills;
    });
    if(json.name === null) return { json: null, idx: info.idx };
    const weapon = {};
    info = readACmd(info, (cmd) => {
      if(cmd === '无') {
        weapon.name = null;
        return;
      }
      const idxSL = cmd.indexOf('[');
      if(idxSL < 0) throw new Error('数据解析失败:'+ cmd);
      weapon.name = cmd.substring(0, idxSL);
      if(!weaponsJson[weapon.name]) throw new Error('光锥不存在:'+weapon.name);
      const idxSR = cmd.indexOf(']', idxSL + 1);
      if(idxSR < 0) throw new Error('数据解析失败:'+ cmd);
      weapon.star = readInt(cmd.substring(idxSL+1, idxSR), 1, 5);
      const idxFlag = Math.max(cmd.indexOf('+', idxSR + 1),cmd.indexOf('-', idxSR + 1));
      if(idxFlag < 0) throw new Error('数据解析失败:'+ cmd);
      weapon.level = readInt(cmd.substring(idxSR+1, idxFlag), 1, 80);
      weapon.upgraded = (cmd[idxFlag] === '+');
      if(weapon.upgraded && (weapon.level % 10 !== 0 || weapon.level===10 || weapon.level===80 )) throw new Error('无效的等级:'+ cmd);
    });
    json.weapon = weapon.name ? weapon : null;
    const equips = [];
    for(let i = 0; i < 6; i++) {
      info = readACmd(info, (cmd) => {
        if(cmd === '无') return;
        const equip = parseEquip(cmd);
        if(typeof equip ==='string') throw new Error(equip);
        equips.push(equip);
      });
    }
    json.equip = equips;
    return { json, idx: info.idx };
  }catch(e){
    console.log(e);
    return '数据解析失败';
  }
}

function getDefaultJson(name) {
  name = fixJson[name] || name;
  const baseData = charactersJson[name];
  if(!baseData || !baseData.data.defaultJson) return null;
  const info = baseData.data.defaultJson;
  const json = {
    level: 80, upgraded:false, name, soul: 0,
    skills: {na: 5, ns: 8, us: 8, ps: 8, ex:[1,1,1], attr:[1,1,1,1,0,1,1,1,1,0]},
    weapon: { name: info.weapon, star:1, level: 80, upgraded: false },
    equip: Equipment.generateDefaultSet(info),
  };
  return json;
}

module.exports = {
  createCharacter,
  readCharacter,
  getDefaultJson,
  charactersData,
  charactersJson,
  fixJson,
}