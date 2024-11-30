'use strict';
const { clone } = require('../utils/util')

class BuffManager {
  constructor(team) {
    this.team = team;
    this.buffList = [];
    this.buffs = {};
  }
  // 清空buff数据
  clear() {
    this.buffList = [];
    this.buffs = {};
  }
  // 追加buff信息
  addBuffList(list) {
    this.buffList = this.buffList.concat(list);
  }
  // 重置所有buff
  resetAllBuffs() {
    this.removeAllBuffs();
    for(let i = 0; i < this.buffList.length; i++) {
      const buffJson = this.buffList[i];
      const info = buffJson.buffClass.info(buffJson.data, buffJson.character);
      if(info.maxValue === 0) {
        const target = (info.target === 'self')? buffJson.character : info.target;
        this.addBuff(buffJson, target, 1, null, false); // 自动添加静态buff
      }
    }
  }
  // 添加buff
  addBuff(buffInfo, target, value = 1, state = null, log = true) {
    const info = buffInfo.buffClass.info(buffInfo.data, buffInfo.character);
    target= ['members', 'enemies'].includes(info.target) ? info.target: target;
    const newBuff = new buffInfo.buffClass(buffInfo.key, buffInfo.character, target, clone(buffInfo.data), value, state, buffInfo.listens);
    //console.log(newBuff);
    const targetName = newBuff.getTargetName();
    let type = "new";
    // 移除重复的buff
    for(let key in this.buffs) {
      const list = this.buffs[key];
      let i = 0;
      while(i < list.length) {
        if(list[i].checkSameBuff(newBuff)) {
          const lastVal = list[i].value;
          newBuff.stack(list[i]);
          list[i].markTargets();
          type = (newBuff.target!==list[i].target)? "change":(newBuff.value===lastVal? "replace" : "stack");
          this.removeBuff(list[i], false, newBuff);
          break;
        } else {
          i++;
        }
      }
    }
    if(log && type !== "replace") {
      this.team.logger.logBuff(newBuff.getTargetName(), newBuff, type);
    }
    // 添加新buff
    const buffs = this.buffs[targetName] || [];
    buffs.push(newBuff);
    this.buffs[targetName] = buffs;
    newBuff.afterAdd();
    // 完成BUFF添加后通知相关目标更新数据
    newBuff.markTargets();
    return newBuff;
  }
  // 移除buff
  removeBuff(buff, log = true, newBuff = null) {
    if(!buff || buff.isStatic() === 0)return false;
    if(log) buff.beforeRemove(newBuff);
    if(buff.listenTargets) buff.listenTargets.forEach(t => t.removeListener(buff));
    if(log)this.team.logger.logBuff(buff.getTargetName(), buff, "remove");
    const list = this.buffs[buff.getTargetName()] || [];
    const idx = list.findIndex(o => o === buff);
    if(idx >= 0) list.splice( idx, 1 );
    // 完成BUFF移除后通知相关目标更新数据
    buff.markTargets();
    return true;
  }
  // 移除所有buff
  removeAllBuffs() {
    for(let key in this.buffs) {
      const list = this.buffs[key];
      for(let i=0; i < list.length; i++) {
        const buff = list[i];
        if(buff.listenTargets) buff.listenTargets.forEach(t => t.removeListener(buff));
      }
    }
    this.buffs = {};
  }
  // 从可选buff列表中查找符合条件的特定buff类
  findBuffJson(key) {
    const idx = this.buffList.findIndex( obj => obj.key === key  );
    return idx >= 0? this.buffList[idx] : null;
  }
  // 过滤出可以添加到指定目标的buff，仅限可见buff
  filterBuffListForTarget(target) {
    const faction = (typeof target==='string')? target : target.faction;
    const targetType = (faction === 'members')? 'member' : 'enemy';
    return this.buffList.filter(json => {
      const info = json.buffClass.info(json.data, json.character);
      return info.show && (( info.target==='self' && json.character===target) || info.target === targetType || info.target === faction);
    });
  }
  // 查找buff
  findBuff(findObj, buffs = null) {
    buffs = buffs || this.getBuffs(findObj.target);
    for(let i = 0; i < buffs.length; i++) {
      if(this._checkBuff(buffs[i], findObj)) {
        return buffs[i];
      }
    }
    return null;
  }
  // 获取根据指定条件过滤出的buff列表
  filterBuffs(findObj, buffs = null) {
    buffs = buffs || this.getBuffs(findObj.target);
    return buffs.filter(buff => this._checkBuff(buff, findObj));
  }
  // 根据目标对象获取buff列表
  getBuffs(targets = null) {
    targets = targets || Object.keys(this.buffs);
    if(!Array.isArray(targets)) return this.buffs[targets] || [];
    let list = [];
    for(let i = 0; i < targets.length; i++) {
      list = list.concat(this.buffs[targets[i]] || []);
    }
    return list;
  }
  // 判断指定buff是否符合查询条件
  _checkBuff(buff, findObj) {
    let { key, show, member, tag } = findObj;
    const info = buff.getInfo();
    // 只支持单条件查询的部分
    if(key && buff.key !== key) {
      return false;
    }
    if( typeof show!== 'undefined' && info.show!== show) {
      return false;
    }
    // 施放者只需要符合其中一个即可
    if(member) {
      member = Array.isArray(member)? member : [member];
      if(!member.includes(buff.member.name)){
        return false;
      }
    }
    // 标签只需要包含其中一个即可
    if(tag) {
      tag = Array.isArray(tag)? tag : [tag];
      let result = false;
      for(let i = 0; i < tag.length; i++) {
        if(info.tags.includes(tag[i])) {
          result = true;
          break;
        }
      }
      if(!result) {
        return false;
      }
    }

    return true;
  }
  // 保存为JSON
  toJSON() {
    const json = [];
    const buffs = this.getBuffs();
    for( let i=0; i< buffs.length; i++ ) {
      const buff = buffs[i];
      json.push({
        key: buff.key,
        target: buff.target? (typeof buff.target==='string'? buff.target : buff.target.name) : null,
        value: buff.value,
        state: buff.state,
      });
    }
    return json;
  }
  // 从JSON加载数据
  fromJSON(json) {
    this.resetAllBuffs();
    for( let i=0; i< json.length; i++ ) {
      const buff = json[i];
      const buffJson = this.findBuffJson(buff.key);
      if(buffJson) {
        const target = (['enemies', 'members'].includes(buff.target)) ? buff.target : this.team.getCharacter(buff.target);
        if(target)this.addBuff(buffJson, target, buff.value, buff.state, false);
      }
    }
  }
}

module.exports = BuffManager;