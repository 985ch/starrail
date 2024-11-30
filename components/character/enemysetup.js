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
    name: {
      type: String,
      value: '',
    },
    enemy: {
      type: Object,
      value: null,
      observer(newVal) {
        this.updateData(newVal);
      },
    },
    show: {
      type: Boolean,
      value: false,
      observer(val) {
        if(val){
          this.updateData(this.data.enemy);
          this.updateTemplates();
        }
      },
    }
  },
  data: {
    damageTypeList,
    data: {
      isPig: 0,
      dodge: 3,
      hp: 3,
      atk: 5,
      speed: 0,
      level: 80,
      shield: 12,
    },
    template: '无模板',
    weakList: [ 1, 0, 1, 0, 0, 1, 0],
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
    onWeakBtnTap(e) {
      const idx = e.currentTarget.dataset.index;
      this.setData({
        template: null,
        [`weakList[${idx}]`]: this.data.weakList[idx]===1 ? 0 : 1,
      });
    },
    switchDef() {
      this.setData({ template: null, ['data.isPig']:this.data.data.isPig? 0: 1 })
    },
    changeData(e) {
      this.setData({ template: null, ['data.'+e.currentTarget.dataset.key]:e.detail.value});
    },
    loadTemplate() {
      this.updateTemplates(()=>{
        this.setData({ showTemplates: true });
      });
    },
    onDelTemplate() {
      const name = this.data.template;
      if(!name)return;
      const saveData = this.data.saveData;
      if(!saveData || !saveData[name])return;
      sd('enemyTemplates', false).deleteWD(name, '确认删除自定义模板['+name+']吗？', '删除木桩模板', null, true, ()=>{
        delete saveData[name];
        this.setData({template:null, saveData});
      });
    },
    saveTemplate() {
      const self = this;
      const { weakList, data, saveData} = this.data;
      if(Object.keys(saveData).length >= 30) {
        wx.showModal({
          title: '提示',
          content: '最多保存30个木桩模板',
          showCancel: false,
        });
        return;
      }
      const { isPig, level, shield, dodge, hp, atk, speed } = data;
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
      const {saveData} = this.data;
      const text = saveData[name] || enemiesJson[name];
      const json = Enemy.parse(text)
      json.template = name;
      this.updateData(json);
    },
    onConfirm() {
      const { isPig, level, shield, dodge, hp, atk, speed } = this.data.data;
      const weakList = this.data.weakList;
      const newWeakList = [];
      for(let i=0;i<weakList.length;i++){
        if(weakList[i]===1){
          newWeakList.push(damageTypeList[i].key);
        }
      }
      const enemy = { template: this.data.template, isPig, level, shield, dodge, hp, atk, speed, weakList: newWeakList }
      this.triggerEvent('change', { enemy });
    },
    updateData(json) {
      if(!json) return;
      const { template, isPig, level, shield, dodge, hp, atk, speed } = json;
      this.setData({
        template: template || null,
        data: { isPig: isPig? 1: 0, level, shield, dodge, hp, atk, speed },
        weakList: damageTypeList.map(item => json.weakList.includes(item.key) ? 1 : 0 ),
      });
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
    }
  },
})
