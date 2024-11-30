const { defaultConfig } = require('../simulator/ai');
const sd = require('../../utils/savedata');
const { clone, exportData, importData } = require('../../utils/util');
const defaultConditions =[
  {value:'sp',text:'技能点限制'},{value:'buff',text:'状态限制'},{value:'hp',text:'生命值限制'},
  {value:'en',text:'能量限制'},{value:'shield',text:'韧性限制'},{value:'enCount',text:'敌人数量'},
  {value:'mTurn', text:'回合判断'},{value:'actSeq',text:'行动顺序'}
];
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    memberJson: {},
    members: [],
    memberTabs: [],
    memberList: [],
    spList:[],
    usList:[],
    firstMember: null,
    movingX: 0,
    aiSpeed: 50,
    selMember: 0,
    buffList: [],
    labels: [],
    curLabel: 'na',
    aiConfig: [],
    conditions: [],
    aiList: [],
  },
  methods: {
    onUsSorted(e) {
      setTimeout( ()=> {
        const { usList, movingX } = this.data;
        const idx = e.currentTarget.dataset.idx;
        usList[idx].x = movingX;
        const newList = usList.sort((a, b)=> a.x-b.x);
        this.updateUsList(newList);
        this.setData({ usList: newList })
      }, 150);
    },
    onUsBlockMoving(e) {
      if(e.detail.source!=='touch') return;
      const idx = e.currentTarget.dataset.idx;
      const usList = this.data.usList;
      const cur = usList[idx];
      const posX = e.detail.x/wx.getSystemInfoSync().windowWidth*750;
      const x = posX + cur.width/2 + 6;
      let newX = 0;
      let inserted = false;
      let data = { movingX: posX};
      for(let i=0;i<usList.length;i++) {
        if(i === idx) continue;
        const item = usList[i];
        if(x < item.x && !inserted) {
          newX += cur.width + 12;
          inserted = true;
        }
        if(item.x!==newX) {
          data['usList['+i+'].x'] = newX;
        }
        newX += item.width + 12;
      }
      this.setData(data);
    },
    onNewSpMember(e) {
      const member = e.currentTarget.dataset.member;
      const spList = this.data.spList;
      spList.push(member);
      this.setData({ spList });
    },
    onStartMember(e) {
      const member = e.currentTarget.dataset.member;
      this.setData({ firstMember: member });
    },
    onSpeedChange(e) {
      this.setData({aiSpeed: e.detail.value});
    },
    onDelSpMember(e) {
      const idx = e.currentTarget.dataset.idx;
      const spList = this.data.spList;
      spList.splice(idx, 1);
      this.setData({ spList });
    },
    onConfirm() {
      const team = getApp().team(0);
      const { spList, usList, firstMember, aiSpeed } = this.data;
      team.aiConfig = {
        spList,
        usList: usList.map(m => m.name),
        firstMember,
        aiDelay: (50-aiSpeed)*100 + 500,
      };
      getApp().autoSave();
      this.triggerEvent('confirm');
    },
    onMemberChange(e) {
      const idx = e.detail.index;
      this.setData({selMember:idx},()=>{
        this.updateMemberAI();
      })
    },
    updateUsList(usList) {
      let x = 0;
      for(let i=0;i<usList.length;i++) {
        usList[i].width = usList[i].name.length*30 + 10;
        usList[i].x = x;
        x += usList[i].width + 12;
      }
    },
    getBuffs(team, names, faction) {
      const targetType = (faction === 'members')? 'member' : 'enemy';
      return team.buffManager.buffList.filter(json => {
        const info = json.buffClass.info(json.data, json.character);
        return info.show && names.includes(json.character.name) && (
          (faction==='members' && info.target==='self') || info.target === targetType || info.target === faction
        );
      }).map(json => {
        return [ json.key, `[${json.character.name}][${json.source}]${json.name}`, json.name]
      })
    },
    updateData() {
      const team = getApp().team(0);
      const cfg = team.aiConfig;
      const members = team.members.filter(m=>m);
      const memberNames = members.map(m=>m.name);
      const memberJson = members.reduce((obj, item)=> {
        obj[item.name] = { name: item.name, rarity: item.base.rarity }
        return obj;
      }, {});
      const memberList = members.map(m=>[m.name]);
      const usList = cfg.usList.map(name=> ({ name }));
      for(let member of members) {
        if(!usList.find(m => m.name === member.name)) {
          usList.push({ name: member.name });
        }
      }
      const tabs = members.map((m,i)=> ({ text:m.name, value:i}));
      const buffList = [ this.getBuffs(team, memberNames, 'members'), this.getBuffs(team, memberNames, 'enemies')];
      this.updateUsList(usList);
      const configs = sd('aiConfigs', true).getList(memberNames[this.data.selMember]);
      const aiList = Object.keys(configs);
      this.setData({
        aiList,
        memberJson,
        memberTabs: tabs,
        members: memberNames,
        memberList: [
          [['t','目标'], ['s','自身']].concat(memberList),
          [['t','目标'], ['s','自身']],
          memberList
        ],
        buffList,
        spList: cfg.spList,
        usList,
        firstMember: cfg.firstMember || memberNames[0],
        aiSpeed: 50 - (cfg.aiDelay-500)/100,
      }, () => this.updateMemberAI())
    },
    getCurrentMember() {
      const { members, selMember } = this.data;
      return getApp().team(0).getMember(members[selMember]);
    },
    updateMemberAI() {
      const member = this.getCurrentMember();
      if(!member) return;
      const labels = [['setup','配置']].concat(member.base.aiLabels || [['ns', '战技'],['us','终结技'],['na','普攻']]);
      const aiConfig = Object.assign({}, defaultConfig, member.ai || {});
      if(!member.ai) member.ai = clone(aiConfig);
      const conditions = (member.base.aiConditions || []).concat(defaultConditions);
      //console.log(aiConfig);
      this.setData({
        labels,
        curLabel: labels[0][0],
        aiConfig: member.ai,
        conditions,
      })
    },
    onSelAction(e) {
      const curLabel = e.currentTarget.dataset.label;
      if(curLabel === this.data.curLabel) return;
      this.setData({curLabel});
    },
    onSwitchDisable() {
      const member = this.getCurrentMember();
      if(!member) return;
      const label = this.data.curLabel;
      const disable = !member.ai[label].disable;
      member.ai[label].disable = disable;
      this.setData({['aiConfig.'+label+'.disable']:disable });
    },
    onNewActionRule() {
      const member = this.getCurrentMember();
      if(!member) return;
      const label = this.data.curLabel;
      const rules = member.ai[label].rules || [];
      const tarType = member.base[label+'Target'] || 'enemy'
      rules.push(['enemy','member'].includes(tarType)? [{t:'target', v:['selected']}]: []);
      member.ai[label].rules = rules;
      this.setData({['aiConfig.'+label+'.rules']:rules });
    },
    onDelActionRule(e) {
      wx.showModal({
        title: '删除施放条件',
        content: '确认删除指定施放条件吗？',
        success: (res) => {
          if (res.confirm) {
            const member = this.getCurrentMember();
            if(!member) return;
            const { index } = e.currentTarget.dataset;
            const label = this.data.curLabel;
            const rules = member.ai[label].rules || [];
            if(index>=0 && index<rules.length) rules.splice(index, 1);
            this.setData({['aiConfig.'+label+'.rules']:rules });
          }
        },
      });
    },
    onSetRuleTop(e) {
      const member = this.getCurrentMember();
      const index = e.currentTarget.dataset.index;
      const rules = member.ai[this.data.curLabel].rules;
      if(index>=0 && index<rules.length) {
        const top = rules.splice(index, 1);
        rules.unshift(top[0]);
        member.ai[this.data.curLabel].rules = rules;
        this.setData({[`aiConfig.${this.data.curLabel}.rules`]:rules });
      }
    },
    onAddCondition(e) {
      const member = this.getCurrentMember();
      const label = this.data.curLabel;
      const cond = this.data.conditions[e.detail.value].value;
      const { index} = e.currentTarget.dataset;
      const rules = member.ai[label].rules[index];
      if(rules.length>=10) {
        wx.showToast({ title: '限制条件过多', icon: 'none'});
        return;
      }
      rules.push({t:cond, v:[]});
      member.ai[label].rules[index] = rules;
      this.setData({[`aiConfig.${label}.rules[${index}]`]:rules });
    },
    onRemoveCondition(e) {
      const member = this.getCurrentMember();
      const label = this.data.curLabel;
      const {index, idx} = e.currentTarget.dataset;
      const rules = member.ai[label].rules[index];
      if(idx>=0 && idx<rules.length) rules.splice(idx, 1);
      member.ai[label].rules[index] = rules;
      this.setData({[`aiConfig.${label}.rules[${index}]`]:rules });
    },
    onValuesChange(e) {
      const member = this.getCurrentMember();
      if(!member) return;
      const label = this.data.curLabel;
      const { index, idx } = e.currentTarget.dataset;
      const { values } = e.detail;
      if(!member.ai[label] || !member.ai[label].rules[index] || !member.ai[label].rules[index][idx]) return;
      member.ai[label].rules[index][idx].v = values;
      this.setData({[`aiConfig.${label}.rules[${index}][${idx}].v`]:values });
    },
    loadConfig(config) {
      config = clone(config);
      const member = this.getCurrentMember();
      member.ai = config;
      this.setData({aiConfig: config});
      return true;
    },
    onExport() {
      const member = this.getCurrentMember();
      exportData(JSON.stringify(member.ai));
    },
    onImport() {
      importData('确认用剪贴板的配置覆盖当前配置吗？','导入自动配置', (text)=>{
        try{
          const config = JSON.parse(text);
          this.loadConfig(config);
          wx.showToast({title: '导入成功', icon: 'success'})
        }catch(e) {
          wx.showToast({title: '导入配置失败', icon: 'error'})
        }
      })
    },
    onSaveConfig() {
      const member = this.getCurrentMember();
      sd('aiConfigs', true).saveWD(this.data.aiConfig, '新自动配置', '保存自动配置', member.name, true, true, (name)=>{
        const list = this.data.aiList;
        if(list.indexOf(name)<0)list.push(name);
        this.setData({aiList: list});
      });
    },
    onLoadDefault() {
      const member = this.getCurrentMember();
      const self = this;
      wx.showModal({
        title: '加载默认配置',
        content: '确认使用默认配置覆盖当前配置吗？',
        success: (res) => {
          if (res.confirm) {
            self.loadConfig(Object.assign({}, defaultConfig, member.base.ai || {}));
            wx.showToast({
              title: '加载成功',
              icon: 'success',
              duration: 2000,
            });
          }
        },
      });
      
    },
    onLoadConfig(e) {
      const member = this.getCurrentMember();
      const name = e.currentTarget.dataset.item;
      sd('aiConfigs', true).loadWD(name, '确认加载该配置以覆盖当前配置吗？', '加载'+name, member.name, (config)=>this.loadConfig(config));
    },
    onDeleteConfig(e) {
      const member = this.getCurrentMember();
      const name = e.currentTarget.dataset.item;
      sd('aiConfigs', true).deleteWD(name, '确认删除该配置吗？', '删除'+name, member.name, false, ()=>{
        const list = this.data.aiList;
        const index = list.indexOf(name);
        if(index>=0) list.splice(index, 1);
        this.setData({aiList: list});
      });
    },
  },
  observers: {
    show(val) {
      if(val)this.updateData();
    },
    selMember(val) {
      const configs = sd('aiConfigs', true).getList(this.data.members[val]);
      const aiList = Object.keys(configs);
      this.setData({aiList});
    },
  }
})