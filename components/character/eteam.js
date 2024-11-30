const { DamageTypeInfo } = require('../../simulator/data');
const { templates, enemiesJson } = require('../../simulator/enemy_templates');
const Enemy = require('../../simulator/enemy');
const { map } = require('../../utils/util');
const sd = require('../../utils/savedata');
const { getImage } = require('../../utils/imgset');

const damageTypeList = map(DamageTypeInfo, (item, key) => {
  return { key, ...item };
});
Component({
  properties: {
    tid: {
      type: Number,
      value: 0,
    },
    enemyIdx: {
      type: Number,
      value: 0,
    }
  },
  data: {
    enemies: [null, null, null, null, null],
    state: {},
    enemy: {},
    damageTypeList,
    newIdx: 0,
    templateMode: '添加', //'删除'
    template: '无模板',
    weakList: [],
    attrs: [
      { label: '等级', key:'level', min:1, max: 95},
      { label: '生命', key:'hp', min:1, max: 99999999},
      { label: '攻击', key:'atk', min:0, max: 99999, text: '为0时木桩不会进行攻击动作'},
      { label: '防御', key:'def', min:0, max: 99999, text: '为0时按防御模板自动计算'},
      { label: '韧性', key:'shield', min:1, max: 50},
      { label: '速度', key:'speed', min:1, max: 250},
      { label: '抵抗', key:'dodge', min:0, max: 50},
      { label: '拉条', key:'first', min:0, max: 100, text: '首次行动拉条百分比'}
    ],
    showTemplates: false,
    showRemove: false,
    showEnemiesDlg: false,
    defList: [],
    tList: [],
    saveData: null,
    image: '/images/base/unknown.png',
  },
  lifetimes: {
    attached() {
      this.setData({image: getImage('char/enemy.jpg', (file)=>this.setData({image: file}))});
    }
  },
  methods: {
    onStateChange(e) {
      const {key} = e.currentTarget.dataset;
      const value = e.detail.value;
      this.setData({ [`state.${key}`]: value })
    },
    onStateChanged(e) {
      const {key} = e.currentTarget.dataset;
      const {value} = e.detail;
      const { tid, enemyIdx } = this.data;
      const team = getApp().team(tid);
      if(!team || !team.enemies[enemyIdx]) return;
      team.enemies[enemyIdx].state[key] = value;
      this.triggerEvent('update');
    },
    onWeakBtnTap(e) {
      const idx = e.currentTarget.dataset.index;
      const { enemies, enemyIdx, weakList } = this.data;
      weakList[idx] = weakList[idx]? 0 : 1;
      enemies[enemyIdx].template = null;
      enemies[enemyIdx].weakList = damageTypeList.map((item, i)=>(weakList[i]? item.key: null)).filter(item=>item);
      this.setup(enemyIdx, enemies[enemyIdx]);
    },
    switchDef() {
      const { enemies, enemyIdx } = this.data;
      enemies[enemyIdx].isPig = !enemies[enemyIdx].isPig;
      enemies[enemyIdx].template = null;
      this.setup(enemyIdx, enemies[enemyIdx]);
    },
    changeData(e) {
      const { key } = e.currentTarget.dataset;
      const { value } = e.detail;
      const { enemies, enemyIdx } = this.data;
      enemies[enemyIdx][key] = value;
      enemies[enemyIdx].template = null;
      this.setup(enemyIdx, enemies[enemyIdx]);
    },
    onRemoveEnemy() {
      const { tid, enemyIdx } = this.data;
      const team = getApp().team(tid);
      if(!team || !team.enemies[enemyIdx]) return;
      if(team.enemies.filter(e=>e).length<=1) {
        wx.showToast({ title: '至少保留一个木桩', icon: 'none' });
        return;
      }
      wx.showModal({
        title: '确认删除木桩吗？',
        success: (res) => {
          if (res.confirm) {
            team.enemies[enemyIdx] = null;
            team.curEnemy = team.enemies.findIndex(e=>e);
            this.triggerEvent('update');
          }
        }
      });
    },
    loadTemplate() {
      this.updateTemplates(()=>{
        this.setData({ showTemplates: true, newIdx: this.data.enemyIdx });
      });
    },
    deleteTemplate() {
      this.updateTemplates(()=>{
        const { saveData } = this.data;
        //console.log(saveData);
        if(Object.keys(saveData).length===0) {
          wx.showToast({ title: '无模板可以删除', icon: 'none' })
          return;
        }
        this.setData({ showRemove: true });
      });
    },
    onDelTemplate(e) {
      const idx = e.detail.value;
      const name = this.data.tList[0].data[idx];
      const saveData = this.data.saveData || null;
      if(!saveData || !saveData[name])return;
      sd('enemyTemplates', false).deleteWD(name, '确认删除自定义模板['+name+']吗？', '删除木桩模板', null, true, ()=>{
        delete saveData[name];
      });
    },
    saveTemplate() {
      const self = this;
      const { weakList, enemies, enemyIdx} = this.data;
      const saveData = this.data.saveData || {};
      if(Object.keys(saveData).length >= 30) {
        wx.showModal({
          title: '提示',
          content: '最多保存30个木桩模板',
          showCancel: false,
        });
        return;
      }
      const { isPig, level, shield, dodge, hp, atk, speed } = enemies[enemyIdx];
      let weakText = '';
      for(let i=0;i<weakList.length;i++) {
        if(weakList[i]===1) weakText += damageTypeList[i].text[0];
      }
      const text = `${weakText},${level},${hp},${isPig},${shield},${atk},${speed},${dodge}`
      sd('enemyTemplates', false).saveWD(text, '新木桩', '保存木桩模板', null, true, true, (name)=>{
        saveData[name]=text;
        self.setData({ saveData });
      })
    },
    onTemplateChange(e) {
      const name = e.detail.name;
      const { saveData, newIdx } = this.data;
      const text = saveData[name] || enemiesJson[name];
      const json = Enemy.parse(text)
      json.template = name;
      this.setup(newIdx, json);
    },
    setup(idx, json) {
      const team = getApp().team(this.data.tid);
      team.setEnemy(idx, json);
      team.curEnemy = idx;
      this.triggerEvent('update');
    },
    updateEnemy(eid) {
      const { tid, enemies } = this.data;
      const json = enemies[eid];      
      if(!json) return;
      const team = getApp().team(tid);
      const weakList = damageTypeList.map(key => json.weakList.includes(key.key) ? 1 : 0)
      this.setData({ state: team.enemies[eid].getState(), weakList });
    },
    updateTemplates(fn) {
      const { defList, tList, saveData} = this.data;
      if(!saveData) {
        const data = sd('enemyTemplates', false).getList(null);
        this.setData({ saveData: data || {}}, ()=> this.updateTemplates(fn))
        return;
      }
      const keys = Object.keys(saveData);
      const list = keys.length>0? [{text:'我的模板', data:keys}]: [];
      if(defList.length===0) {
        this.setData({ tList:list.concat(templates), defList:templates }, fn)
      } else if(tList[0].text==='我的模板'){
        if(list.length===0) {
          this.setData({tList: defList}, fn);
        } else {
          tList[0] = list[0];
          this.setData({tList}, fn);
        }
      } else if(list.length > 0) {
        this.setData({tList: list.concat(templates)}, fn);
      } else if(fn) {
        fn();
      }
    },
    updateData(tid, eid) {
      const team = getApp().team(tid);
      if(!team) return;

      const enemies = team.enemies.map(e =>e? e.toJSON(): null);
      if(!enemies[eid]) {
        eid = enemies.findIndex(e => e);
        team.curEnemy = eid;
        this.triggerEvent('update', { updated: true });
        return;
      }
      this.setData({ enemies }, ()=> this.updateEnemy(eid))
    },
    showTeamDlg() {
      this.setData({ showEnemiesDlg: true })
    },
    onSelectEnemy(e) {
      const {index} = e.currentTarget.dataset;
      if(index === this.data.enemyIdx) return;
      const {tid} = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      if(team.enemies[index]) {
        team.curEnemy = index;
        this.triggerEvent('update', { updated: true });
        return;
      }
      this.updateTemplates(()=>{
        this.setData({ showTemplates: true, newIdx: index });
      });
    },
  },
  observers: {
    'tid,enemyIdx': function(tid, idx) {
      this.updateData(tid, idx);
    }
  }
})