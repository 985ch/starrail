// 常用的报告函数
'use strict';

const C = require('./compute');
const D = require('./data');

// 获取击破伤害相关数据的报告
function getBreakReport(character, target) {
  const { damage, dotDamage, max, lateRate } = character.getBreakDamage(target);
  return {
    type: 'breakDamage', name: '击破',
    damage, dotDamage, maxDamage: dotDamage * (max > 1 ? max : 0),
    late: lateRate,
    tip: character.base.type==='Physical'?'持续伤害取的是上限' : '',
  };
}
// 获取超击破伤害相关数据的报告
function getSuperBrkDmgReport(character, target, rate, bonus = 0, list = [1, 2, 3], name = null) {
  name = name || character.name;
  return {
    type:'superBreak', name: `超击破[${name}]`, tip: '削韧越高，伤害越高', char: name, list,
    damage: C.calSuperBrkDmg(character, target, character.base.type, 1, rate, bonus), dotDamage:0, maxDamage:0,
  }
}
// 获取基础的行动数据报告
function getActionReport(character) {
  const wait = character.calActionTime();
  return [
    { type:'action', name:'行动间隔', wait},
  ]
}
// 获取基本的能量数据报告
function getEnergyReport(character, options) {
  options = options || {};
  const na = options.na || 20;
  const ns = options.ns || 30;
  const us = options.us || 5;
  const list = [];
  if(!options.ignoreAction){
    list.push({
      type:'energy',
      name:'行动回能',
      labels: ['普攻', '战技', '终结技'],
      en0: C.calEnergy(na, character),
      en1: C.calEnergy(ns, character),
      en2: C.calEnergy(us, character),
    });
  }
  if(!options.ignoreOther) {
    const other ={
      type: 'energy',
      name: '其他回能',
      labels: ['击杀回能'],
      en0: C.calEnergy(options.kill || 10, character),
    };
    if(options.others) {
      options.others.forEach((o, i)=> {
        other.labels.push(o[0]);
        other['en'+(i+1)] = C.calEnergy(o[1], character);
      })
    }
    list.push(other);
  }
  return list;
}
// 获取承伤比例数据报告
function getDefendReport(character, enemy, ignoreList = []) {
  const keys = Object.keys(D.DamageTypeInfo);
  const hurtJson = {};
  for(let i = 0; i < keys.length; i++) {
    const type = keys[i];
    if(ignoreList.includes(type)) continue;
    const damage = C.calDmg(10000, [type], enemy, character, {simpleMode:true});  
    hurtJson[type] = damage*0.01;
  }
  return [
    {
      type:'defend', name:'承伤', labels:['物伤','火伤','冰伤','雷伤','风伤','量子伤','虚数伤'],
      def0: hurtJson.Physical, def1:hurtJson.Fire, def2:hurtJson.Ice, def3: hurtJson.Thunder,
      def4: hurtJson.Wind, def5: hurtJson.Quantum, def6: hurtJson.Void,
    },
  ]
}
// 获取角色装备，遗器和buff提供的附加报告数据
function getAdditionReport(character, enemy, options) {
  const buffs = character.filterBuffs({
    target: [ character.name, character.faction],
    tag: 'report',
  });
  const reports = [];
  if(character.weapon) {
    reports.push(...character.weapon.getReportData(enemy, options));
  }
  reports.push(...character.equip.getReportData(enemy, options));
  for(let i = 0; i < buffs.length; i++) {
    const buff = buffs[i];
    reports.push(...buff.getReportData(character, options));
  }
  return reports;
}
// 格式化整个报告
function formatReport(raw, backList) {
  const report = {
    damage: { text: raw.damage || '', list: [] },
    action: { text: raw.action || '', list: [] },
    energy: { text: raw.energy || '', list: [] },
    live: { text: raw.live || '', list: [] },
  }
  const sort = [];
  for(let i=0;i<raw.reportList.length;i++) {
    const item = raw.reportList[i];
    const backItem = backList.find(obj => item.type===obj.type && item.name===obj.name);
    switch(item.type) {
      case 'damage':
      case 'dot':
      case 'breakDamage':
      case 'superBreak':
      case 'hit':
        report.damage.list.push(formatDamage(item, backItem));
        if(!sort.includes('damage')) sort.push('damage');
        break;
      case 'action':
      case 'energy':
        report[item.type].list.push(formatDamage(item, backItem));
        if(!sort.includes(item.type)) sort.push(item.type);
        break;
      case 'defend':
      case 'block':
      case 'dodge':
      case 'heal':
      case 'shield':
        report.live.list.push(formatDamage(item, backItem));
        if(!sort.includes('live')) sort.push('live');
        break;
      default:
        console.log(item.type);
        break;
    }
  }
  return { sort, report };
}
// 格式化伤害报告
function formatDamage(item, backItem) {
  const result={};
  for(let key in item) {
    switch(key) {
      case 'type':
      case 'name':
      case 'tip':
      case 'labels':
        result[key]=item[key];
        break;
      case 'wait':
        {
          const val = item[key];
          const bVal = (backItem && typeof backItem[key] !== 'undefined') ? backItem[key] : val;
          result[key] = val;
          result['c_'+key] = val - bVal;
          result.acts = [];
          result.c_acts = [];
          for(let i=0; i<5; i++) {
            const ca = Math.floor((150+i*100)/val);
            const cb = Math.floor((150+i*100)/bVal);
            result.acts[i] = ca;
            result.c_acts[i] = ca-cb;
          }
        }
        break;
      default:
        {
          const value =item[key];
          result[key] = value;
          result['c_'+key] = (backItem && typeof backItem[key] !== 'undefined') ? value - backItem[key] : 0;
        }
        break;
    }
  }
  return result;
}

module.exports = {
  getBreakReport,
  getSuperBrkDmgReport,
  getActionReport,
  getEnergyReport,
  getDefendReport,
  getAdditionReport,
  formatReport,
}