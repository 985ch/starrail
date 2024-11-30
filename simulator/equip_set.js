'use strict';

const Attributes = require('./attributes');
const Buff = require('./buff');

class EquipSet {
  constructor(character) {
    this.character = character;
    this.count = 1;
  }
  // 获取套装基本描述
  static getDesc() {
    return {
      name: '未配置名称',
      short: '未配置',
      set2: '无描述',
      set4: '无描述，两件套无该字段',
      image: 'atk4_kqs',
      needAttrs: [],
      buffs: [],
      evt: null,
    }
  }
  // 获取套装属性
  getAttributes() {
    return {};
  }
  // 获取套装的增益列表
  getBuffList() {
    return [];
  }
  // 获取额外报告内容
  getReportData(/* target, options */) {
    return [];
  }
  // 获取描述列表
  getDescList() {
    if(this.count<2) return [];
    const info = this.constructor.getDesc()
    const list = [`${info.name}(2):${info.set2}`];
    if(this.count>=4) {
      list.push(`${info.name}(4):${info.set4}`);
    }
    return list;
  }
  // 获取不同情形下的套装属性和套装buff效果组合，用于快速筛选装备
  getSetInfo(maxCount, enemy, aInfo) {
    // 记录不同套装下激活的BUFF
    const info = {};
    this.count = 2;
    info.set2 = this.getAttrData(enemy, aInfo);
    if(maxCount===4 && this.constructor.getDesc().set4) {
      this.count = 4;
      info.set4 = this.getAttrData(enemy, aInfo);
    }
    return info;
  }
  // 获取当前参数下的固定属性和转换属性
  getAttrData(enemy, aInfo) {
    const member = this.character;
    const attrS = new Attributes();
    const attrE = new Attributes();
    const transList = [];
    const buffs = {};
    attrS.mergeAttributes(this.getAttributes());
    const buffList = this.getBuffList();
    buffList.forEach(json =>{
      const bInfo = json.buffClass.info(json.data, json.character);
      const value = bInfo.maxValue>0? (aInfo && aInfo[bInfo.name]) || 0: 1;
      if(value === 0) return;
      if(bInfo.maxValue>0) buffs[json.key] = { value, target:bInfo.target };
      let tar = member;
      switch(bInfo.target) {
        case 'enemies':
        case 'members':
          tar = bInfo.target;
          break;
        case 'enemy':
          tar = enemy;
          break;
        case 'member':
        case 'self':
          break;
        default:
          break;
      }
      const buff = member.team.buffManager.addBuff(json, tar, value, null, false);
      if(buff) {
        if(tar === this.character || tar === 'members') {
          member.getShadowBuffData(buff, enemy, attrS);
          member.getShadowBuffTrans(buff, attrS, transList);
        } else {
          enemy.getShadowBuffData(buff, member, attrE);
        }
      }
    });
    return {
      attrsS: attrS.getData(),
      attrsE: attrE.getData(),
      buffs,
      transList,
    }
  }
  onEvent(/*evt, unit, data*/){}
}

module.exports = EquipSet;