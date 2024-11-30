const util = require('../../utils/util');
const { getImage } = require('../../utils/imgset');
const { charactersJson } = require('../../simulator/characters/index');
const ai = require('../simulator/ai');
const timelineStore = require('../../simulator/timeline_store')

let videoAd = null; // 激励广告实例
Page({
  data: {
    evt: null, // 抬头组件的事件
    r: Date.now(), // 刷新用随机值
    logs: [], // 战斗日志
    timeline: [], // 排轴记录
    actionList: [], // 行动队列
    damage: 0, // 实际伤害
    expDamage: 0, // 期望伤害
    round: { round:0, t:0}, // 轮次信息
    roundN: 0, // 轮次数
    actions: [], // 可选行动列表
    sp: 5, // 技能点
    spMax: 5, // 最大技能点
    selMember: -1, // 当前选中成员
    memberName: null, // 当前选中的成员名称
    selEnemy: -1, // 当前选中敌人
    enemyName: null, // 当前选中的敌人名称
    eLogs: [], // 所有敌人的回合日志
    mLogs: [], // 所有我方成员的回合日志
    curUnit: null, // 当前行动单位
    battleEnd: false, // 战斗已结束
    viewMode: 'log', // 显示模式
    damages: [], // 伤害列表
    maxDamage: 0, // 最大伤害
    maxExpDamage: 0, // 期望最大伤害
    images: {}, // 图片集
    showRoundDamage: false, // 显示轮次伤害
    showHelpDlg: false, // 显示帮助对话框
    showTimelineDlg: false, // 显示排轴对话框
    dataMember: null, // 显示详情的成员
    showDataDlg: false, // 显示详细数据对话框
    showAiDlg: false, // 显示AI配置对话框
    autoMode: false, // 是否自动模式
  },
  onShareAppMessage() {
    return {
      title: '黑塔配装助手',
      path: '/pages/index',
      promise: getApp().shareTeam(),
    }
  },
  onLoad() {
    if (!videoAd && wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-35f4e603b7c5381b'})
      videoAd.onError((err)=>console.error('激励视频广告加载失败', err))
      videoAd.onClose((res)=>{
        if(res.isEnded)this.setData({evt:{ event:'adClose', time: 15 }})
      });
    }
  },
  onUnload() {
    this.killTimer();
  },
  onShow() {
    getApp().team(0).battleMode = true;
    this.updateData();
  },
  onHide() {
    this.setData({autoMode:false})
  },
  // 显示帮助对话框
  onShowHelp() {
    this.killTimer();
    this.setData({showHelpDlg: true});
  },
  // 切换队伍
  onSwitchTeam() {
    const teams = getApp().team();
    teams[1].battleMode = true;
    getApp().globalData.teams = [ teams[1], teams[0], teams[2] ];
    this.updateUnitLogs();
    this.updateData();
  },
  // 切换显示模式
  onChangeMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      viewMode: mode,
    });
  },
  // 显示详细数据
  onDataDlg(e) {
    this.setData({
      dataMember: e.currentTarget.dataset.name,
      showDataDlg: true,
    });
  },
  onRoundMode() {
    this.setData({
      showRoundDamage: !this.data.showRoundDamage,
    });
  },
  updateUnitLogs() {
    const team = getApp().team(0);
    const eLogs = team.enemies.map((unit =>unit? unit.logs: []));
    const mLogs = team.members.map((unit =>unit? unit.logs: []));
    this.setData({ eLogs, mLogs });
  },
  updateData() {
    const { images } = this.data;
    const team = getApp().team(0);
    const tt = team.state.t; // 开始计算的时间
    let lr = Math.floor((tt-50)/100); // 开始计算的轮次
    team.forEachUnit(true, unit=> this.fillImages(unit.name, unit.base));
    for(let i=1; i<=5; i++) {
      this.fillImages('木人桩' + i, {image: 'enemy.jpg'});
    }
    team.timeline.members.forEach(member=> this.fillImages(member.name, charactersJson[member.name].data));
    team.timelineB.members.forEach(member=> this.fillImages(member.name, charactersJson[member.name].data));
    const actionList = team.actionList.filter(unit=>unit).map(unit=>{
      const r = Math.floor((tt+unit.state.wait-50)/100);
      const newTurn = r>lr;
      lr = r;
      return {
        name: unit.name,
        faction: unit.faction,
        rarity: unit.base.rarity,
        wait: unit.state.wait,
        newTurn,
      };
    });
    const selMember = this.getSelMember();
    const selEnemy = this.getSelEnemy();
    const curUnit = team.getActionUnit(team.members[selMember]);
    let actions = curUnit ? curUnit.getActions(): [];
    const canAction = actions.filter(a=>!a.disable);
    if(canAction.length===0) actions = [];

    let damage = 0;
    let expDamage = 0;
    let maxDamage = 0;
    let maxExpDamage = 0;
    const damages = team.members.filter(m => m).map(m => {
      const s = m.state;
      damage += s.damage;
      expDamage += s.expDamage;
      maxDamage = Math.max(maxDamage, s.damage);
      maxExpDamage = Math.max(maxExpDamage, s.expDamage);
      return {
        name: m.name,
        rarity: m.base.rarity,
        damage: s.damage,
        expDamage: s.expDamage,
      }
    })

    const round =  team.getRound();
    const data ={
      images,
      r: Date.now(),
      actionList,
      round,
      roundN: Math.max(1, round.round + (round.t/(round.round===0? 150: 100))),
      logs: team.logger.logs,
      timeline: timelineStore.getCmpList(team),
      damage,
      expDamage,
      actions,
      sp: team.state.sp,
      spMax: team.state.spMax,
      selMember,
      memberName: selMember>=0? team.members[selMember].name: null,
      selEnemy,
      enemyName: selEnemy>=0? team.enemies[selEnemy].name: null,
      curUnit: curUnit? {name: curUnit.name, rarity: curUnit.base.rarity}: null,
      battleEnd: selMember<0 || selEnemy<0,
      damages,
      maxDamage,
      maxExpDamage,
    };
    //console.log(data);
    this.setData(data);
  },
  fillImages(name, base) {
    if(this.data.images[name]) return;
    this.data.images[name] = getImage('char/' + base.image, file => this.setData({["images." + name]: file }));
  },
  getSelMember() {
    return this.getSelUnit('selMember', 'members');
  },
  getSelEnemy() {
    return this.getSelUnit('selEnemy', 'enemies');
  },
  getSelUnit(key1, key2) {
    const team = getApp().team(0);
    const sel = this.data[key1];
    const unit = team[key2][sel];
    if(unit && unit.checkAlive()) return sel;
    for(let i=0;i<team[key2].length;i++) {
      const u = team[key2][i];
      if(u && u.checkAlive()) return i;
    }
    return -1;
  },
  getTarget(type, unit) {
    switch(type) {
      case 'enemies':
      case 'members':
        return type;
      case 'self':
        return unit;
      case 'member':
        return getApp().team(0).members[this.getSelMember()];
      case 'enemy':
        return getApp().team(0).enemies[this.getSelEnemy()];
      default:
        throw new Error('无效的类型:'+type);
    }
  },
  onSelMember(e) {
    const idx = e.detail.index;
    const team = getApp().team(0);
    const member = team.members[idx];
    const curUnit = team.state.inBattle? this.data.curUnit: {name: member.name, rarity: member.base.rarity};
    this.setData({
      selMember: idx,
      memberName: member.name,
      curUnit,
    })
  },
  onSelEnemy(e) {
    const team = getApp().team(0);
    this.setData({
      selEnemy: e.detail.index,
      enemyName: team.enemies[e.detail.index].name,
    })
  },
  onEnemyChanged() {
    this.killTimer();
    this.setData({autoMode:false}, ()=> this.updateData())
  },
  killTimer() {
    if(this.autoTimer){
      clearInterval(this.autoTimer);
      this.autoTimer = 0;
      return true;
    }
    return false;
  },
  onRestart() {
    const self = this;
    if(this.data.logs.length>0) {
      wx.showModal({
        title: '注意',
        content: '重置状态将清空当前数据！',
        success (res) {
          if (res.confirm) {
            self.restart();
          } else if (res.cancel) {
            // do nothing
          }
        }
      })
    } else {
      this.restart();
    }
  },
  restart() {
    const team = getApp().team(0);
    this.killTimer();
    //team.resetState();
    team.clearUnitLogs();
    team.reset(true);
    team.updateData();
    team.resetState();
    this.updateUnitLogs();
    this.updateData();
    this.setData({autoMode:false})
  },
  onAction: util.throttle(function(e) {
    if(this.locked)return;
    this.locked = true;
    const idx = e.currentTarget.dataset.index;
    const action = this.data.actions[idx];
    if(!action || action.disable || this.data.battleEnd) {
      this.locked = false;
      return
    };
    const curUnitName = this.data.curUnit.name;
    if(!curUnitName) {
      this.locked = false;
      return;
    }

    const team = getApp().team(0);
    const unit = team.getCharacter(curUnitName);
    const target = this.getTarget(action.target, unit);
    team.onAction(unit, action, target);
    this.updateUnitLogs();
    this.updateData();
    this.locked = false;
  }, 300),
  onMemberUS(e) {
    const idx = e.detail.index;
    const team = getApp().team(0);
    team.clearUnitLogs();
    const member = team.members[idx];
    if(!member) return;
    const action = member.getUsAction();
    const target = this.getTarget(action.target, member);
    team.onAction(member, action, target);
    this.updateUnitLogs();
    this.updateData();
  },
  onNext: util.throttle(function(e) {
    if(this.locked)return;
    this.locked = true;
    const team = getApp().team(0);
    team.clearUnitLogs();
    if(team.actionList.length<=1 || this.data.battleEnd)return;

    if(team.actionList[0].state.wait===0){
      team.nextTurn();
    } else {
      team.startTurn();
    }
    this.updateUnitLogs();
    this.updateData();
    this.locked = false;
  }, 200),
  switchAutoBattle() {
    if(this.killTimer()){
      this.setData({autoMode: false})
    } else {
      this.setData({showAiDlg: true})
    }
  },
  onAutoBattle() {
    if(this.autoTimer || this.data.battleEnd) return;
    const team = getApp().team(0);
    this.onAiAction();
    this.updateData();
    this.autoTimer = setInterval(() => {
      if(this.data.battleEnd) {
        clearInterval(this.autoTimer);
        this.autoTimer = 0;
        this.setData({autoMode:false})
        return;
      }
      this.onAiAction();
      this.updateUnitLogs();
      this.updateData();
    }, team.aiConfig.aiDelay);
    this.setData({showAiDlg: false, autoMode: true})
  },
  onAiAction() {
    const team = getApp().team(0);
    const cfg = team.aiConfig;
    const selMember = team.members[this.getSelMember()];
    const selEnemy = team.enemies[this.getSelEnemy()];
    // 如果尚在准备阶段，则一次性施放所有秘技并进入战斗
    if(!team.state.inBattle) {
      ai.actionReady(team, cfg.spList, team.getCharacter(cfg.firstMember) || selMember);
      return;
    }
    // AI在每次行动前先对所有我方目标判断是否施放终结技
    const usMembers = cfg.usList.map(name => team.getMember(name)).filter(m => m && m.checkAlive());
    for(let i=0;i<usMembers.length;i++) {
      if(ai.actionUS(usMembers[i], selMember, selEnemy)) return;
    }
    // 获取当前的正常行动
    const curUnit = team.getActionUnit(team.members[selMember]);;
    if(!curUnit) return;
    let actions = this.data.actions;
    if(actions.length===0){
      this.onNext();
      return;
    }
    ai.action(curUnit, selMember, selEnemy);
  },
  onSaveTimeline() {
    const team = getApp().team(0);
    timelineStore.saveTimeline(team, (key)=>{
      if(team.timelineB.isEmpty()) {
        team.timelineB.fromJSON(team.timeline.toJSON());
        this.setData({timeline: timelineStore.getCmpList(team)});
      }
    });
  },
  onShowTimelineDlg() {
    this.setData({showTimelineDlg: true})
  },
  onLoadedTimeline() {
    const team = getApp().team(0);
    team.timelineB.members.forEach(member=> this.fillImages(member.name, charactersJson[member.name].data));
    this.setData({
      images: this.data.images,
      showTimelineDlg: false,
      timeline: timelineStore.getCmpList(team),
    });
  },
  // 展示广告
  onShowAds() {
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            console.error('激励视频 广告显示失败', err)
          })
      })
    }
  },
})