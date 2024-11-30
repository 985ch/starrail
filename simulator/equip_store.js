'use strict';
const D = require('./data');
const {saveData, loadData, pick } = require('../utils/util');
const {stringifyEquip, parseEquip, importEquips, getSubValue} = require('./equip_generator')
const Equipment = require('./equipment')

class EquipStore {
  constructor() {
    this.worker = null;
    this.callback = null;
    this.list = null;
    this.idx = null;
    this.reset();
  }
  // 重置仓库数据，下次重新加载
  reset() {
    this.list = {
      head: null,
      hand: null,
      body: null,
      foot: null,
      link: null,
      ball: null,
    };
    this.idx = {
      head: {},
      hand: {},
      body: {},
      foot: {},
      link: {},
      ball: {},
    };
  }
  // 获取指定部位的遗器列表
  getList(part) {
    return this.list[part] || this.load(part);
  }
  // 更新遗器ID
  updateID(equip) {
    const part = equip.part;
    if(!equip.id) {
      // 生成一个由8位随机字符构成的ID
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let id;
      do {
        id = '';
        for(let i=0; i<8; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while(this.idx[part][id]);
      equip.id = id;
      this.idx[part][equip.id] = equip;
      return;
    }
    // 处理属性和ID不匹配的遗器
    const e = this.idx[part][equip.id];
    if(e && e.key !== equip.key) {
      equip.id = null;
      this.updateID(equip);
      return;
    }
    // 录入遗器
    this.idx[part][equip.id] = equip;
  }
  // 从指定部位的ID库中移除指定ID的遗器
  removeID(equip) {
    const part = equip.part;
    const id = equip.id;
    if(id && this.idx[part][id]) {
      delete this.idx[part][id];
    };
  }
  // 更新遗器状态
  updateStatus(equip) {
    equip.key = equip.key || stringifyEquip(equip);
    const part = equip.part;
    const idx = this.findIndex(equip, true);
    if(idx < 0) {
      equip.id = null;
      equip.locked = 0;
      return;
    };
    const foundEquip = this.list[part][idx];
    equip.id = foundEquip.id;
    equip.locked = foundEquip.locked;
  }
  // 锁定遗器
  lockEquip(equip, name) {
    if(!equip || !equip.id) return;
    const e = this.idx[equip.part][equip.id];
    if(!equip.key) equip.key = stringifyEquip(equip);
    if(!e || e.key!==equip.key) return;
    e.locked = name || 0;
    if(name) { // 同一个角色在同一个部位只能锁定一个遗器
      const list = this.getList(e.part);
      for(let i=0; i<list.length; i++) {
        if(list[i].locked === name && list[i].id !== equip.id) list[i].locked = 0;
      }
    }
    equip.locked = e.locked;
    this.save(equip.part);
  }
  // 解锁遗器
  unlockEquip(equip) {
    this.lockEquip(equip, null);
  }
  // 加载指定部位的遗器列表
  load(part) {
    const list = loadData('equips_' + part) || [];
    Equipment.fixEquipsName(list);
    let needSave = false;
    list.forEach(e => {
      e.key = stringifyEquip(e);
      if(!e.id && !needSave) needSave = true;
      this.updateID(e);
    });
    this.list[part] = list;
    if(needSave) this.save(part);
    return list;
  }
  // 根据部位和ID读取遗器
  getEquip(part, id) {
    this.getList(part);
    return this.idx[part][id] || null;
  }
  // 保存指定部位的遗器列表
  save(part) {
    const list = this.getList(part)
    saveData('equips_' + part, list.map(e => pick(e, ['part','name','level','rarity','main','data', 'id', 'locked'])));
  }
  // 覆盖遗器列表
  overwriteEquips(equips, part) {
    const oldList = this.getList(part);
    const newList = equips.map(e => {
      const idx = this.findIndex(e, false, false);
      const oe = idx>0? oldList[idx]: null;
      if(oe && e.data.speed && getSubValue(e.data.speed, 'speed', e.rarity) > getSubValue(oe.data.speed, 'speed', oe.rarity)){
        e.id = oe.id;
        return e; // 返回速度更高的
      };
      return oe || e;
    });
    this.idx[part] = {};
    newList.forEach(e => this.updateID(e));
    //console.log(newList);
    this.list[part] = newList;
    this.save(part);
    return newList.length;
  }
  // 查找遗器并返回索引
  findIndex(equip, checkID = false, strict = true) {
    const list = this.getList(equip.part);
    const key = equip.key || stringifyEquip(equip);
    if(checkID && strict) {
      if(!equip.id) return -1;
      const idx = list.findIndex(e => e.id === equip.id);
      return (idx >= 0 && list[idx].key === key)? idx: -1;
    }
    if(strict) {
      return list.findIndex(e => e.key === key);
    }
    return list.findIndex(e => this.checkSame(equip, e, false));
  }
  // 比较两件遗器是否相似
  checkSame(e1, e2, strict) {
    if(!e1 || !e2) return false;
    for(let key in e1) {
      if(['name','part','level','rarity','main'].includes(key) && e1[key]!==e2[key]) {
        return false;
      }
    }
    if(Object.keys(e1.data).length!==Object.keys(e2.data).length) return false;
    for(let key in e1.data) {
      if(!e2.data[key]) return false;
      const val1 = getSubValue(e1.data[key], key, e1.rarity);
      const val2 = getSubValue(e2.data[key], key, e2.rarity);
      if(!strict && key === 'speed') {
        if(Math.floor(val1 + 0.001)!==Math.floor(val2 + 0.001)) return false;
      } else {
        if(Math.abs(val1 - val2) > 0.001) return false;
      }
    }
    return true;
  }
  // 添加遗器
  addEquip(equip, ignoreSame = false, autoSave = true) {
    equip = parseEquip(equip);
    if(equip.message) return equip.message;
    const list = this.getList(equip.part);
    if(list.length>=300) return '遗器数量超过限制';
    equip = Object.assign({key: equip.key || stringifyEquip(equip)}, equip);
    if(ignoreSame){
      const index = this.findIndex(equip, false, false);
      //if(index<0) console.log(equip.key);
      if(index>=0) {
        const found = list[index];
        if(!equip.data.speed) return list[index];
        if(getSubValue(equip.data.speed, 'speed', equip.rarity) > getSubValue(found.data.speed, 'speed', found.rarity)) {
          found.data = equip.data;          
        }
        return list[index];
      }
    }
    this.updateID(equip);
    list.push(equip);
    if(autoSave)this.save(equip.part);
    return equip;
  }
  // 批量添加遗器
  addEquips(equips) {
    const parts = {head: 0, hand: 0, body: 0, foot: 0, link: 0, ball: 0}
    equips.forEach(e => {
      const newEquip = this.addEquip(e, true);
      e.id = newEquip.id;
      parts[e.part]++;
    });
    for(let key in parts) {
      if(parts[key]>0) {
        this.save(key)
      }
    }
  }
  // 移除遗器
  removeEquip(part, index) {
    const list = this.getList(part);
    if(index<0 || index>=list.length) return null;
    const key = list[index].key;
    this.removeID(list[index]);
    list.splice(index, 1);
    this.save(part);
    return key;
  }
  // 编辑遗器（遗器ID不变)
  setEquip(index, equip) {
    const part = equip.part;
    const list = this.getList(part);
    if(index<0 || index>=list.length) return;

    const oldEquip = list[index];
    equip.key = stringifyEquip(equip);
    if(oldEquip) {
      if(oldEquip.key === equip.key) return;
      equip.id = oldEquip.id;
      this.idx[part][equip.id] = equip;
    }
    list[index] = equip;
    this.save(part);
  }
  // 清空同样的遗器
  cleanSameEquips(part) {
    const list = this.getList(part);
    const set = new Set();
    this.list[part] = list.filter(e => {
      if(!e.key)e.key = stringifyEquip(e);
      if(set.has(e.key)) {
        this.removeID(e);
        return false;
      }
      set.add(e.key);
      return true;
    });
    this.save(part);
  }
  // 筛选遗器用于自动配装
  filterEquips(character, attrs, main, setList, ignoreList, maxLevel) {
    const json = {};
    for(let part in this.list) {
      const list = this.getList(part);
      const setIdx = (part==='link' || part==='ball') ? 1 : 0;
      list.forEach(e => {
        if(e.locked && e.locked!==character.name) return;
        if(main[part] && e.main !== main[part]) return;
        if(ignoreList && ignoreList.includes(e.key)) return;
        if(!setList[setIdx].includes(e.name)) return;
        const setJson = json[e.name] || {};
        const eList = setJson[part] || [];
        const info = this.getEquipInfo(e, character, maxLevel);
        let needPush = true;
        for(let i = 0; i<eList.length; i++) {
          const cr = compare(info, eList[i].info, attrs);
          if(cr > 0) {
            eList.splice(i, 1);
            i--;
          } else if(cr < 0) {
            needPush = false;
            break;
          }
        }
        if(needPush) {
          eList.push({ id: part + '-' + e.id, info });
        }
        setJson[part] = eList;
        json[e.name] = setJson;
      });
    }
    return json;
  }
  // 获取遗器关键属性信息
  getEquipInfo(equip, character, maxLevel = false) {
    const info = { data:{}, score: 0}; // data是处理后的属性值，score是副词条评分
    const attrs = Equipment.getSubAttributes(equip);
    for(let key in attrs) {
      info.score += attrs[key] * D.EquipSubScore[key];
    }
    const equipAttrs = Object.assign( attrs, Equipment.getMainAttribute(equip, maxLevel));
    for(let key in equipAttrs) {
      const kv = getEquipKeyValue(character, key, equipAttrs[key]);
      info.data[kv.key] = (info.data[kv.key] || 0) + kv.value;
    }
    return info;
  }
  // 获取全部遗器
  getAllEquips(filter) {
    const list = [];
    for(let part in this.list) {
      const lst = filter? this.getList(part).filter(filter): this.getList(part);
      list.push(...lst);
    }
    return list;
  }
  // 自动配装
  autoSelectEquips(job, scheme, json, callback) {
    this.callback = callback;
    if(this.worker) this.worker.terminate()
    this.worker = wx.createWorker('workers/main/index.js', { useExperimentalWorker: true });
    this.worker.onMessage(msg => this.callback && this.callback(msg));
    this.worker.onProcessKilled(() => {
      console.log('process be killed!')
      this.autoSelectEquips(job, scheme, json, callback);
    })
    this.worker.postMessage({job, scheme, json });
  }
  // 结束自动配装
  stopSelectEquips() {
    if(this.worker) this.worker.terminate()
    this.worker = null;
  }
  // 导出遗器
  exportAll() {
    let text = '';
    for(let key in this.list) {
      const list = this.getList(key);
      text += list.map(e => stringifyEquip(e) + ';').join('');
    }
    return text;
  }
  // 导入遗器
  importAll(text) {
    const result = importEquips(text);
    if(!result.equips || (result.equips.length===0 && result.msg)) {
      return false;
    }
    this.addEquips(result.equips);
    return true;
  }
}
// 获取遗器指定属性数值
function getEquipKeyValue(character, key, value) {
  switch(key) {
    case 'hpRate':
      return { key: 'hp', value: value * character.baseHp * 0.01 };
    case 'atkRate':
      return { key: 'atk', value: value * character.baseAtk * 0.01 };
    case 'defRate':
      return { key: 'def', value: value * character.baseDef * 0.01 };
    default:
      return {key, value };
  }
}
// 比较遗器关键属性数值
function compare(info1, info2, attrs) {
  let result = 0;
  for(let i=0; i<attrs.length; i++) {
    const key = attrs[i];
    const v1 = info1.data[key] || 0;
    const v2 = info2.data[key] || 0;
    if(Math.abs(v1 - v2)<=0.01) {
      continue;
    } else if(v1 > v2) {
      if(result<0) return 0; // 有强有弱
      result = 1; // 全面强于
    } else {
      if(result>0) return 0; // 有强有弱
      result = -1; // 全面弱于
    }
  }
  if(result === 0) {  // 全面等于
    return (info1.score >= info2.score)? 1 : -1;
  }
  return result;
}

const equipStore = new EquipStore();
module.exports = equipStore;