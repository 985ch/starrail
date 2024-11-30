const { weaponsJson } = require('../../simulator/weapons/index');
const D = require('../../simulator/data');
const { pick, clone } = require('../../utils/util');
Component({
  properties: {
    tab: { // 当前标签
      type: String,
      value: '',
      observer(val) {
        this.changeTab(val, true);
      }
    }, 
    editable: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    tid: 0,
    cid: 1,

    dmgTypeInfo: D.DamageTypeInfo,
    curChar: -1, // 当前角色索引
    charBase: {}, // 角色基础数据
    state: {}, // 角色状态数据
    damageImage: '38px-冰.png', // 伤害类型图标
    jobImage: '38px-存护.png', // 角色职业图标
    weapon: { name:'-未装备光锥-'}, // 角色武器
    attrs: [], // 额外属性
    members: [], // 队伍成员
    enemy: null, // 当前敌人
    enemyIdx: -1, // 当前敌人索引

    staticData: false, // 是否展示静态面板
    showMembers: true, // 显示队友和敌人
    showBoard: true, // 显示属性面板
    showEquips: true, // 显示装备面板
    equipMode: 'data', // 遗器显示模式
    showSelector: false, // 显示选人面板
    showEditor: false, // 显示角色编辑对话框

    curTab: ['遗器配装', '配置状态'],
    selIndex: 0, // 选人面板指定的目标

    allTabs: [
      ['遗器配装', '遗器强化','词条计算','数据对比'],
      ['配置状态','编辑角色','管理队伍','管理木桩',/*'清理遗器',*/'数据管理'],
    ],
    rTab: 0, // 标签页的行索引
    curPart: 'head', // 当前遗器类型
  },
  methods: {
    onShowAd() {
      this.triggerEvent('showAd', {});
    },
    // 更新数据
    updateData(tid, autoSave = false) {
      if(autoSave && tid===0) getApp().autoSave();
      // 获得所有队友数据
      const team = getApp().team(tid);
      if(!team) return;
      const members = team.members.map(m => {
        if(!m) return null;
        const obj = m.toJSON();
        obj.skillText = m.getSkillLevels().map(arr=>arr[0]+arr[1]).join('-');
        return obj;
      });
      if(!members[team.curMember]) {
        team.curMember = members.findIndex(m => m);
      }
      if(team.curMember >= 0)team.members[team.curMember].updateData();
      // 获取当前角色的遗器，光锥和技能数据
      const character = team.members[team.curMember];
      if(!character) return;
      const base = character.base;
      const weapon = members[team.curMember].weapon;
      const attrs = base.attributes.reduce((obj, attr, i)=>{
        if(!character.skills.attr[i])return obj;
        for(let key in attr) {
          obj[key] = (obj[key] || 0) + attr[key];
        }
        return obj;
      },{});
      const attrTexts = [];
      for(let key in attrs) {
        attrTexts.push(`${D.AttributeText[key].short}+${attrs[key]}${D.AttributeText[key].type==='percent'?'%':''}`)
      }
      let wData;
      if(weapon){
        wData = pick(weapon, ['name', 'star', 'level']);
        wData.rarity = weaponsJson[weapon.name].data.rarity;
      } else {
        wData = { name:'-未装备光锥-' };
      }
      // 获取当前敌人的数据
      if(!team.enemies[team.curEnemy]) {
        team.curEnemy = team.enemies.findIndex(e => e);
      }
      this.setData({
        curChar: team.curMember,
        charBase: base,
        state: character.getState(),
        damageImage: D.DamageTypeInfo[base.type].img,
        jobImage: D.JobTypeInfo[base.job].img,
        weapon: wData,
        attrs: attrTexts,
        members: members,
        enemy: team.enemies[team.curEnemy].toJSON(),
        enemyIdx: team.curEnemy,
      });
    },
    // 被动更新
    onUpdate(e) {
      const { tid } = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      const detail = e.detail || {};
      if(!detail.updated) team.updateData(true);
      this.updateData(tid, true);
      if(detail.tab) {
        this.changeTab(detail.tab, true);
      }
      this.triggerEvent('update', {});
    },
    // 更改当前选中的遗器部位
    onPartChange(e) {
      this.setData({ curPart: e.detail.part })
    },
    // 显示和隐藏面板
    onSwitchBoard(e) {
      const { board } = e.currentTarget.dataset;
      const key = 'show' + board;
      this.setData({
        [key]: !this.data[key],
      });
    },
    // 切换面板数据模式
    onSwitchBoardMode() {
      const { staticData } = this.data;
      this.setData({ staticData: !staticData });
    },
    // 切换装备显示模式
    onSwitchEquipMode() {
      const { equipMode } = this.data;
      this.setData({ equipMode: equipMode === 'full' ? 'data' : 'full' });
    },
    // 更改角色
    onChangeCharacter() {
      this.setData({ selIndex: this.data.curChar, showSelector: true})
    },
    // 响应角色选择事件
    onSelectMember(e) {
      const { index } = e.currentTarget.dataset;
      const { tid, cid } = this.data;
      const teams =  getApp().team();
      if(!teams[tid].members[index]) {
        this.setData({ selIndex: index, showSelector: true})
        return;
      }
      teams[tid].curMember = index;
      teams[tid].members[index].updateData();
      if(cid===0) {
        teams[cid].curMember = index;
      }
      this.updateData(tid, true);
    },
    // 响应角色变更事件
    onSelectCharacter(e) {
      const { index } = e.detail;
      if(index !== this.data.curChar) {
        const { tid, cid } = this.data;
        const list = tid===0? [tid]: [tid, cid];
        list.forEach( idx=>{
          const team = getApp().team(idx);
          team.members[index].updateData();
          team.curMember = index;
        });
      }
      this.updateData(this.data.tid, true);
    },
    // 切换标签组
    onSwitchTab() {
      const { rTab, curTab } = this.data;
      this.changeTab(curTab[(rTab+1)%2]);
    },
    // 按名称切换标签
    onChangeTab(e) {
      const { target } = e.currentTarget.dataset;
      this.changeTab(target);
    },
    changeTab(target, forceUpdate = false) {
      const { rTab, curTab, allTabs } = this.data;
      if(curTab[rTab]===target && !forceUpdate) return;
      const tab = allTabs[0].includes(target)? 0: 1;
      const vsSelf = (tab!==1 && target !== '数据对比');
      const tid = vsSelf? 2: 0;
      const cid = vsSelf? 0: 1;
      const teams = getApp().team();
      if(!teams[tid] || !teams[cid]) return;
      if(tid === 2) {       
        teams[tid].fromJSON(clone(teams[cid].toJSON()));
      }
      curTab[tab] = target;
      this.setData({ curTab, rTab: tab, tid, cid }, this.updateData(tid, true));
    },
    // 响应队伍交换
    onSwitchTeam() {
      const { tid, cid } = this.data;
      const teams = getApp().team();
      const t1 = teams[tid];
      const t2 = teams[cid];
      const member = t1.members[t1.curMember];
      if(!member) return;
      const curChar = t2.members.findIndex(m => m && m.name === member.name);
      if(curChar>=0) {
        t2.curMember = curChar;
      }
      t2.updateData(true);
      teams[cid] = t1;
      teams[tid] = t2;
      this.updateData(tid, true);
    },
    // 响应队伍同步
    onSyncTeam() {
      const { tid, cid } = this.data;
      const teams = getApp().team();
      teams[cid].fromJSON(clone(teams[tid].toJSON()));
      teams[cid].updateData(true);
      this.setData({ cid });
      this.updateData(tid, true);
    }
  },
  lifetimes: {
    attached() {
      getApp().team(0).updateData(true);
      this.updateData(this.data.tid);  
    }
  },
})