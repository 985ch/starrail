// 事件管理器
'use strict';

class EventManager {
  constructor(team) {
    this.team = team;
    this.listeners = {};
  }
  // 清空所有事件监听
  clear() {
    this.listeners = {};
  }
  // 添加监听者
  newListen(e, unit, listener) {
    if(Array.isArray(e)) {
      e.forEach(ee => this.newListen(ee, unit, listener));
      return;
    }
    const data = { unit, listener };
    const listeners = this.listeners[e] || [];
    if(listeners.findIndex(d => d.unit === unit && d.listener === listener) < 0) {
      listeners.push(data);
    }
    this.listeners[e] = listeners;
  }
  // 移除监听者
  removeListener(listener) {
    for(let e in this.listeners) {
      const listeners = this.listeners[e];
      let i = 0;
      while(i < listeners.length) {
        if(listeners[i].listener === listener) {
          listeners.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }
  // 触发事件
  triggerEvent(e, unit, data, func) {
    //console.log(e, unit.name);
    //console.log(JSON.parse(JSON.stringify(data)));
    if(func) func(e, unit, data); // 优先处理传入的方法
    const listeners = this.listeners[e]? this.listeners[e].slice() : [];
    for(let i = 0; i < listeners.length; i++) {
      const cur = listeners[i];
      if(cur.unit === unit || cur.unit === '*') {
        cur.listener.onEvent(e, unit, data);
      }
    }
    unit.onEvent(e, unit, data);
  }
}

module.exports = EventManager;
