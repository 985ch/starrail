const {saveData, loadData } = require('../utils/util');
const sd = require('../utils/savedata');

// 排轴保存仓库
class TimelineStore {
  constructor() {
    this.list = null;
    this.needSave = false;
  }
  // 重置仓库数据，下次重新加载
  reset() {
    this.list = null;
    this.needSave = false;
  }
  // 获取所有排轴列表
  getAllList() {
    if(this.list) return this.list;
    this.list = loadData('timeline') || [];
    return this.list;
  }
  // 根据队伍获取排轴列表
  getList(team) {
    const list = this.getAllList();
    const listA = [];
    const listB = [];
    list.forEach(info=> {
      const members = info.members;
      let matched = true;
      for(let i=0; i<members.length; i++) {
        if(!team.getMember(members[i].name)) {
          matched = false;
          break;
        };
      }
      if(matched) {
        listA.push(info);
      } else {
        listB.push(info);
      }
    });
    return [listA, listB];
  }
  // 保存排轴数据
  saveTimeline(team, func) {
    if(team.timeline.isEmpty()) {
      wx.showToast({title: '暂无排轴数据', icon: 'error'});
      return;
    }
    const list = this.getAllList();
    if(list.length>=50) {
      wx.showToast({title: '数量已达上限', icon: 'error'});
      return;
    }
    const json = team.timeline.toJSON();
    sd('timeline_data', false).saveWD(json.list, '新排轴', '保存排轴', null, true, true, (key)=>{
      const idx = list.findIndex(info=>info.key === key);
      if(idx>=0) {
        list[idx].members = json.members;
      } else {
        list.push({key, members: json.members});
      }
      this.needSave = false;
      saveData('timeline', list);
      if(func)func(key);
    });
  }
  // 读取排轴数据
  loadTimeline(team, {members, key}, func) {
    const saveData = sd('timeline_data', false);
    if(!this.needSave) {
      const list = saveData.load(key);
      team.timelineB.fromJSON({ members, list });
      if(func) func();
    } else {
      saveData.loadWD(key, '是否确定加载排轴“'+ key +'”，当前排轴将被替换', '加载排轴', null, (list)=>{
        team.timelineB.fromJSON({ members, list});
        this.needSave = false;
        if(func) func();
      });
    }
  }
  // 删除排轴数据
  removeTimeline(key, func) {
    sd('timeline_data', false).deleteWD(key, '确定删除排轴“'+ key +'”吗？', '删除排轴', null, true, ()=>{
      const list = this.getAllList();
      const idx = list.findIndex(info=>info.key === key);
      if(idx>=0) {
        list.splice(idx, 1);
        saveData('timeline', list);
      }
      if(func) func();
    });
  }
  // 获取比较轴
  getCmpList(team) {
    const lst1 = team.timeline.actList;
    const lst2 = team.timelineB.actList;
    const len = Math.max(lst1.length, lst2.length);
    const list = [];
    for(let i=0; i<len; i++) {
      list.push({
        action: lst1[i] || null,
        cmp: lst2[i] || null,
      })
    }
    return list;
  }
}

const store = new TimelineStore();

module.exports = store;