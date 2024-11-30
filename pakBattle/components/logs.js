const createRecycleContext = require('miniprogram-recycle-view');
const { pick } = require('../../utils/util');
Component({
  properties: {
    logs: {
      type: Array,
      value: [],
      observer(list, oldList) {
        if(this.ctx)this.ctx.splice(0, oldList.length, list);
        this.setData({ top: list.length * 60 + 60 })
      }
    },
    images: {
      type: Object,
      value: {}
    }
  },
  data: {
    showLogs: [],
    top: 0,
    showDlg: false,
    // 滚动区域宽高
    scrollWidth: 745 * wx.getSystemInfoSync().windowWidth/750,
    scrollHeight: 400 * wx.getSystemInfoSync().windowWidth/750,
    // 对话框内数据
    t: 0,
    unit: '虎克',
    target: null, // 目标对象
    action: '行动', // 行动文本
    count: 0, // 第几次同类行动
    info: '', // 额外信息
    damage: 0, // 实际伤害
    expDamage: 0, // 期望伤害
    heal: 0, // 实际治疗
    data: {}, // 行动信息，包括每个角色受到的伤害，治疗，buff和是否在本次行动中被击倒
    stat: {}, // 行动统计数据
    units: [], // 渲染对象数组
  },
  methods: {
    onShowLog(e) {
      const log = e.detail;
      const team = getApp().team(0);
      const stat = team.logger.stat[`${log.unit}#${log.action}`];
      const units = this.getMembers(team, log);
      this.setData({
        showDlg: true,
        stat,
        units,
        ...pick(log, ['t', 'unit', 'target', 'action', 'count', 'info', 'damage', 'expDamage', 'heal', 'data']),
      })
    },
    getMembers(team, log) {
      const unit = team.getCharacter(log.unit);
      const factions = unit.faction==='members'? ['enemies','members']:['members','enemies'];
      const units = [];
      if(log.data[log.unit]) units.push(this.parseData(unit, log.data[log.unit]))
      factions.forEach(faction=>{
        team[faction].forEach(u=> {
          if(!u || u.name===log.unit || !log.data[u.name] )return;
          units.push(this.parseData(u, log.data[u.name]));
        })
      })
      return units;
    },
    parseData(unit, data) {
      const tags = [];
      let damage = 0;
      let expDamage = 0;
      let heal = 0;
      const isEnemy = unit.faction==='enemies';
      data.tags.forEach(tag =>{
        switch(tag.t) {
          case 'dmg':
            damage += tag.dmg;
            expDamage += tag.expDmg;
            break;
          case 'heal':
            heal += tag.heal;
            break;
          case 'buff':
            tags.push({
              text: `${tag.type==='remove'?'-':'+'}${tag.name}${(tag.value>1 && tag.type!=='remove')? '(' + tag.value + ')':''}`,
              class: tag.type==='remove'? (isEnemy?'buffER':'buffMR'):(isEnemy?'buffEA':'buffMA')
            })
            break;
          default:
            break;
        }
      });
      return {
        name: unit.name,
        idx: unit.faction==='enemies'? unit.index + 1: 0,
        damage,
        expDamage,
        heal,
        tags,
        data
      }
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
        id: 'showLogs',
        dataKey: 'showLogs',
        page: this,
        itemSize: {
          width: 745 * wx.getSystemInfoSync().windowWidth/750,
          height: 60 * wx.getSystemInfoSync().windowWidth/750,
        },
      });
      const logs = this.data.logs;
      if(logs.length>0) {
        this.ctx.append(logs);
        this.setData({ top: logs.length * 60 + 60 })
      }
    },
  },
})