'use strict';
const { getRank } = require('../utils/util');

const defaultAttributeData = {
  Fire: 0, // 火
  Ice: 0, // 冰
  Wind: 0, // 风
  Thunder: 0, // 雷
  Void: 0, // 虚数
  Quantum: 0, // 量子
  Physical: 0, // 物理
  //Real: 0, // 真实伤害
}

const defaultTypeData = {
  NA: 0, // 普通攻击
  NS: 0, // 战技
  US: 0, // 终结技
  AA: 0, // 追加攻击
  DOT: 0, // 持续伤害
  AD: 0, // 附加伤害
  BRK: 0, // 击破伤害
}

const defaultAttributes = {
  // 基础数据
  hp: 0, // 生命值
  hpRate: 0, // 生命百分比加成
  atk: 0, // 攻击值
  atkRate: 0, // 攻击百分比加成
  def: 0, // 防御值
  defRate: 0, // 防御百分比加成

  hate: 0, // 嘲讽值
  hateRate: 0, // 嘲讽百分比加成

  speed: 0, // 速度
  speedRate: 0, // 速度百分比加成

  breakRate: 0, // 击破特攻
  breakBonus: 0, // 击破效率加成
  healRate: 0, // 提供治疗时获得加成
  healBonus: 0, // 受到治疗时获得加成
  shieldRate: 0, // 护盾加成
  hit: 0, // 效果命中
  dodge: 0, // 效果抵抗
  dodgeCtrl: 0, // 抵抗控制
  dodgeDot: 0, // 抵抗持续伤害

  enMax: 0, // 最大能量
  enRate: 0, // 能量恢复效率
  enTurn: 0, // 每回合回能

  damageRate: 1.0, // 受击时受伤比例
  damageDown: 0, // 攻击时伤害降低
  defDown: 0, // 受击时防御降低
};
fillExAttributes(defaultAttributes, 'bonus', 2); // 各类增伤
fillExAttributes(defaultAttributes, 'weak', 2); // 各类易伤
fillExAttributes(defaultAttributes, 'through', 2); // 各类穿透
fillExAttributes(defaultAttributes, 'defend', 1); // 各类抵抗
fillExAttributes(defaultAttributes, 'arp', 0, 'defThrough'); // 无视防御
fillExAttributes(defaultAttributes, 'crit', 0, 'criRate'); // 各类暴击
fillExAttributes(defaultAttributes, 'criDmg', 0, 'criDamage'); // 各类暴伤

class Attributes {
  constructor(attributes) {
    this.data = Object.assign({}, attributes || defaultAttributes);
  }
  // 重置数据
  reset() {
    this.data = Object.assign({}, defaultAttributes);
  }
  // 合并属性
  mergeAttributes(list) {
    if(!Array.isArray(list)) {
      list = [ list ];
    }
    for (let i = 0; i < list.length; i++) {
      for (const key in list[i]) {
        if (!this.data.hasOwnProperty(key)) {
          throw new Error('属性不存在:' + key);
        }
        if (key === 'damageRate') {
          this.data[key] *= list[i][key];
        } else {
          this.data[key] += list[i][key];
        }
      }
    }
  }
  // 根据等级计算属性角色或武器的三项基础属性
  fillBaseAttributes(baseData, level, upgraded = true) {
    const rank = getRank(level, upgraded);
    this.data.hp = getAttributes(baseData.hp, level, rank);
    this.data.atk = getAttributes(baseData.atk, level, rank);
    this.data.def = getAttributes(baseData.def, level, rank);
    return rank;
  }
  // 更新攻防生命速度
  updateBaseAttributes(key, base) { 
    this.data[key] += base * this.data[key + 'Rate'] * 0.01;
  }
  // 修正有限制的属性
  fixLimit() {
    this.data.def = Math.max(0, this.data.def);
    this.data.damageRate = Math.max(0.01, this.data.damageRate);
    this.data.damageDown = Math.min(20, this.data.damageDown);
  }
  // 获取属性JSON
  getData() {
    const json = {};
    for (const key in this.data) {
      const val = this.data[key];
      if(val && (key!=='damageRate' || Math.abs(val - 1) > 0.0001)) {
        json[key] = val;
      }
    }
    return json;
  }
}

// 计算单项属性
function getAttributes(data, level, rank) {
  if (rank === 0) {
    return data[0] + ((data[1][0] - data[0]) / 19) * (level - 1);
  }
  if (rank === 6) {
    return data[6][1] + ((data[7] - data[6][1]) / 10) * (level - rank * 10 - 10);
  }
  return data[rank][1] + ((data[rank + 1][0] - data[rank][1]) / 10) * (level - rank * 10 - 10);
}

// 复制属性数据
function fillExAttributes(obj, key, fillType, allKey) {
  obj[allKey || key + 'All' ] = 0;
  if(fillType !== 0) {
    for(let sKey in defaultAttributeData) {
      obj[key + sKey ] = defaultAttributeData[sKey];
    }
  }
  if(fillType !== 1) {
    for(let sKey in defaultTypeData) {
      obj[key + sKey ] = defaultTypeData[sKey];
    }
  }
}

module.exports = Attributes;