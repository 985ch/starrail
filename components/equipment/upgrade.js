const Team = require('../../simulator/team');
const equipStore = require('../../simulator/equip_store');
const { ruleList, ruleConfig } = require('../../simulator/equip_rules');
const createRecycleContext = require('miniprogram-recycle-view');
const { setNames, partText } = require('../../simulator/equipments/index');
const { clone } = require('../../utils/util');
const sd = require('../../utils/savedata');

const settingJson = {};
let showedTip = false;
let lastEquips = [];
let lastName = '';
let lastOldScore = 0;

Component({
  properties: {
    tid: {
      type: Number,
      value: 0
    },
    cid: {
      type: Number,
      value: 0
    },
    curMember: {
      type: Number,
      value: 0
    }
  },
  data: {
    rule: 'simple',
    attrs: {},
    buttonText: '开始计算',
    equips:[],
    equipList:[],
    sort:'avg',
    ignoreBuff: false, // 是否忽略套装效果
    hideRule: false, // 是否隐藏规则面板

    charName: '', // 当前角色名字
    curScore:0, // 现有装备的分数

    // 筛选条件
    partList: Object.keys(partText).map(key=>({ key, value: partText[key] })),
    partFilter: [1,1,1,1,1,1],
    setNameList: ['-全部-', ...setNames[0],...setNames[1]],
    selSetName: 0,
    withMaxLevel: true, // 是否包括满级

    // 结果相关
    showResultsDlg: false, // 是否显示结果弹窗
    curEquip: null, // 当前遗器
    curBuffs: [], // 当前遗器加成
    equipChanged: false, // 是否有遗器变化
    curResults: {curScore:0, buffs:[], info:null}, // 当前显示详情的装备信息

    // 滚动区域宽高
    scrollWidth: 740 * wx.getSystemInfoSync().windowWidth/750,
    scrollHeight: 380 * wx.getSystemInfoSync().windowWidth/750,
  },
  methods: {
    onSwitchRule() {
      this.setData({hideRule: !this.data.hideRule});
    },
    // 更新计算规则
    onSettingChange(e) {
      const {rule, attrs, sort} = e.detail;
      this.setData({rule, attrs, sort});
    },
    onSwapIgnoreBuff() {
      this.setData({ignoreBuff: !this.data.ignoreBuff});
    },
    onSwitchPart(e) {
      const { index } = e.currentTarget.dataset;
      const { partFilter } = this.data;
      partFilter[index] = !partFilter[index];
      this.setData({partFilter}, ()=>this.filterEquips());
    },
    onSwitchMaxLevel() {
      this.setData({withMaxLevel: !this.data.withMaxLevel}, ()=>this.filterEquips());
    },
    onSelectSet(e) {
      this.setData({selSetName: e.detail.value }, ()=>this.filterEquips())
    },
    // 保存遗器数据
    onSaveEquip(e) {
      const { equip } = e.detail;
      const { member, team, backTeam } = this.getMemberAndTeams();
      // 入库
      const list = equipStore.getList(equip.part);
      const idx = list.findIndex(e=>e.id === equip.id);
      if(idx < 0) {
        wx.showToast({ title: '该遗器不在库中', icon:'error'})
        return;
      }
      equipStore.setEquip(idx, equip);
      // 更新后台队伍
      const bMember = backTeam.getMember(member.name);
      if(!bMember) return;
      const bEquip = bMember.equip.equipments[equip.part];
      if(bEquip && bEquip.id===equip.id) {
        bMember.equip.setEquipment(equip);
        bMember.equip.updateData();
        backTeam.reset(false);
        backTeam.updateData(true);
      }
      // 更新前台队伍
      const cEquip = member.equip.equipments[equip.part];
      if(cEquip && cEquip.id===equip.id) {
        member.equip.setEquipment(equip);
        member.equip.updateData();
        team.reset(false);
        team.updateData();
      }
      this.setData({equipChanged: false});
      this.triggerEvent('update', {});
    },
    //显示遗器详情
    onEquipResults(e) {
      const {id, part, buffs} = e.detail;
      const equip = equipStore.getEquip(part, id);
      if(!equip){
        wx.showToast({ title: '指定遗器未入库', icon:'error'})
        return;
      }
      this.compute([equip], false, (json)=>{
        const list = JSON.parse(json.list || '[]');
        this.setData({
          showResultsDlg: true,
          buttonText: '重新计算',
          curEquip: equip,
          curBuffs: buffs,
          equipChanged: false,
          curResults: { curScore: json.oldScore, buffs, info: list[0] || null }
        })
      })
    },
    // 升级遗器
    onUpgradeEquip(e) {
      const { equip, needSave } = e.detail;
      this.compute([equip], false, (json)=>{
        const list = JSON.parse(json.list || '[]');
        this.setData({
          buttonText: '重新计算',
          curEquip: equip,
          equipChanged: needSave,
          curResults: { curScore: json.oldScore, buffs:this.data.curBuffs, info:list[0]}
        })
      })
    },
    // 过滤遗器
    filterEquips() {
      const { equips, partList, partFilter, withMaxLevel, setNameList, selSetName } = this.data;
      if(!equips || equips.length===0) return;
      const partJson = {};
      for(let i=0;i<partList.length;i++) {
        partJson[partList[i].key] = partFilter[i];
      }
      const setNameFilter = setNameList[selSetName];
      const list = equips.filter(obj=>{
        if(!partJson[obj.part]) return false;
        const equip = equipStore.getEquip(obj.part, obj.id);
        if(!equip || (!withMaxLevel && equip.level===15) || (setNameFilter!=='-全部-' && equip.name !== setNameFilter)) return false;
        return true;
      });
      if(this.ctx)this.ctx.splice(0, 9999, list);
    },
    // 开始计算
    onComputeBtn() {
      this.onCompute();
      if(!showedTip) {
        showedTip = true;
        wx.showModal({
          title: '注意',
          content: '期望提升基于“其他遗器（含试装遗器）不变”这个前提得到，且未计算同时更换多个遗器的情况，望知悉。',
          showCancel: false,
        })
      }
    },
    onCompute() {
      const { sort, charName } = this.data;
      const equips = equipStore.getAllEquips((e)=>e.rarity==='SSR')
      this.compute(equips, true, (json)=>{
        const complete = json.count+json.skip>=json.total;
        const buttonText = complete? '重新计算': `计算中(${json.count+json.skip}/${json.total})`;
        if(!complete) {
          this.setData({buttonText});
          return;
        }
        const list = JSON.parse(json.list || '[]');
        const equips = list.map(itm=>{
          this.equipUpgrade[itm.part+itm.id] = itm;
          return itm;
        }).sort((a,b)=> b[sort]-a[sort]);
        lastEquips = equips;
        lastName = charName;
        lastOldScore = json.oldScore;
        this.setData({equips, buttonText, curScore: json.oldScore},()=>this.filterEquips());
      });
    },
    compute(equips, save, func) {
      const { curMember, rule, attrs, sort, ignoreBuff } = this.data;
      const teams = getApp().team();

      // 复制新队伍以避免对原队伍的影响
      const team = teams[0].clone();
      const member = team.members[curMember];
      const enemy = team.enemies[teams[0].curEnemy];
      if(!enemy) {
        wx.showModal({
          title: '错误',
          content: '必须选择一个有效的敌人',
          showCancel: false,
        });
        return;
      }

      // 获取关键词条列表
      let attrKeys = ruleConfig[rule].getAttrs(member, Object.keys(attrs));
      if(attrKeys.length===0) {
        wx.showModal({
          title: '错误',
          content: '必须配置至少一个自选词条',
          showCancel: false,
        });
        return;
      }

      this.equipUpgrade = {};
      this.setData({buttonText: '计算中...'});
      // 保存配置
      sd('upgradeSetting', false).save(member.name, { rule, attrs:{...attrs}, sort, ignoreBuff }, false);

      // 获取必要参数
      const setList = [[],[]];
      const oldEquips = [];
      for(let key in member.equip.equipments) {
        const equip = member.equip.equipments[key];
        if(!equip) continue;
        const i = ['link','ball'].includes(equip.part)? 1: 0;
        if(!setList[i].includes[equip.name]) setList[i].push(equip.name);
        oldEquips.push(equip);
      }
      const shadow = member.getShadowData(enemy, null, setList);
      attrKeys = member.fillNeedAttrs(shadow.member.attr, attrs, attrKeys, setList, {});
      shadow.equips = equips;
      shadow.oldEquips = oldEquips;
      if(ignoreBuff) shadow.setBuffs = {};

      const scheme = {
        module: ruleConfig[rule].module,
        config: ruleConfig[rule].initConfig(member, attrs),
        attrKeys,
        setAttrs: ruleConfig[rule].getSetAttrs(member, attrs),
      }
      equipStore.autoSelectEquips('遗器强化', scheme, shadow, func);
    },
    // 试装遗器
    onTryEquip(e) {
      const { equip, buffs } = e.detail;
      const { member, team, backTeam } = this.getMemberAndTeams();
      // 更新装备数据并全队重置数据
      member.equip.setEquipment(equip);
      member.equip.updateData();
      team.reset(false);
      // 同步buff并处理
      const buffManager = team.buffManager;
      buffManager.fromJSON(backTeam.buffManager.toJSON());
      const enemy = member.getEnemy();
      buffs.forEach(buff=>{
        const target = ['enemy','enemies'].includes(buff.target)? enemy : member;
        this.setBuff(member, target, buff.key, buff.value);
      });
      this.triggerEvent('update', {});
    },
    // 重置遗器数据
    onResetEquips() {
      const { team, backTeam } = this.getMemberAndTeams();
      team.fromJSON(backTeam.toJSON());
      team.reset(false);
      team.updateData(true);
      this.triggerEvent('update', {});
    },
    getMemberAndTeams() {
      const { cid, tid, curMember } = this.data;
      const teams = getApp().team();
      const team = teams[tid];
      return { member: team.members[curMember], team, backTeam:teams[cid]};
    },
    // 更新界面数据
    updateData(tid, curMember){
      const member = getApp().team(tid).members[curMember];
      if(!member) return;
      this.updateRule(member);
    },
    // 更新角色的计算规则
    updateRule(member) {
      const charName = member.name;
      this.setData({charName});
      const settingJson = sd('upgradeSetting', false).getList(null);
        let setting = settingJson[charName] || null;
      if(!setting || ruleList.findIndex(r=>r.value===setting.rule) < 0){
        const ds = clone(member.base.equipSetting || { rule: 'dmgNS' });
        this.setData({rule: ds.rule, attrs: {...(ds.attrs || {})}})
      } else {
        this.setData(setting);
      }
    }
  },
  observers: {
    'tid,curMember': function(tid,curMember) {
      this.updateData(tid, curMember);
    }
  },
  lifetimes: {
    detached() {
      if(this.ctx) this.ctx.destroy();
      this.ctx = null;
    },
    ready() {
      if(this.ctx) return;
      this.ctx = createRecycleContext({
        id: 'equipsList',
        dataKey: 'equipList',
        page: this,
        itemSize: {
          width: 740 * wx.getSystemInfoSync().windowWidth/750,
          height: 75 * wx.getSystemInfoSync().windowWidth/750,
        },
      });
      if(lastEquips.length>0 && this.data.charName===lastName) {
        this.setData({ equips: lastEquips, curScore: lastOldScore }, ()=>{
          this.filterEquips();
        })
      }
      this.filterEquips();
    },
  },
})