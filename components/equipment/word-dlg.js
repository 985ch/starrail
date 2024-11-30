const Team = require('../../simulator/team');
const { setNames } = require('../../simulator/equipments/index')
const equipStore = require('../../simulator/equip_store');
const { ruleList, ruleConfig } = require('../../simulator/equip_rules');
const { clone, loadData, saveData } = require('../../utils/util');
const sd = require('../../utils/savedata');

let currentSets = null;
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    character: {
      type: String,
      value: '',
      observer: function (newVal, oldVal) {
        if(newVal==='' || newVal === oldVal) return;
        const equipSetting = sd('wordSetting', false).getList(null);
        let setting = equipSetting[newVal] || null;
        if(!setting || ruleList.findIndex(r=>r.value===setting.rule) < 0){
          const member = getApp().team(0).getMember(newVal);
          if(!member) return;
          setting = clone(member.base.equipSetting || {
            rule: 'dmgNS',
            main: {
              foot: 'speed',
              link: 'atkRate',
              ball: 'bonus' + member.base.type,
            },
            set4: ['繁星璀璨的天才', '繁星璀璨的天才'],
            set2: '繁星竞技场',
            wordCount: 35,
            useMaxValue: false,
            noSmallWord: false,
            only8Words: false,
            maxResult: 15,
          });
        }
        this.setData(cloneSetting(setting));
      }
    }
  },
  data: {
    rule: 'simple',
    rCount: 15,
    attrs: {},
    main: {}, // 主属性锁定配置
    set4: [null, null], // 外圈限制
    set2: null, // 内圈限制
    buffInfo: {}, // buff配置
    wordCount: 35, // 最大词条数
    useMaxValue: false, // 是否使用最大值进行计算
    noSmallWord: false, // 是否避免三个小属性词条
    only8Words: false, // 是否限制最大只能有8个词条

    step: '配置规则', // 当前执行阶段
    
    confirmText: '下一步', // 确认按钮文本
    cancelText: '关闭', // 取消按钮文本

    cost: 0, // 耗时
    count: 0, // 当前枚举组合数量
    total: 0, // 枚举组合总数量
    results:[], // 查找结果
  },
  methods: {
    onShowAd() {
      const self = this;
      wx.showModal({
        title: '提示',
        content: '即将花费6~15秒观看视频广告，观看完整广告可获得30积分。是否继续？',
        success: (res) => {
          if (res.confirm) {
            self.triggerEvent('showAd', {});
          }
        }
      })
    },
    onSettingChange(e) {
      this.setData(e.detail);
    },
    changeWordCount(e) {
      this.setData({ wordCount: e.detail.value })
    },
    onSwapMaxValue() {
      this.setData({ useMaxValue: !this.data.useMaxValue })
    },
    onSwapSmallWord() {
      this.setData({ noSmallWord: !this.data.noSmallWord })
    },
    onSwap8Words() {
      this.setData({ only8Words: !this.data.only8Words })
    },
    onCancel() {
      switch(this.data.step) {
        case '完成计算':
        case '配置状态':
          this.setData({
            step: '配置规则',
            confirmText: '下一步',
            cancelText: '关闭',
          })
          break;
        case '正在计算':
          this.stopCompute();
          this.setData({
            step: '完成计算',
            confirmText: '应用结果',
            cancelText: '重新计算',
          })
          break;
        default:
          this.setData({show: false})
          break;
      }
    },
    onConfirm() {
      switch(this.data.step) {
        case '配置规则':
          if(this.checkScheme()) {
            this.setData({
              step: '配置状态',
              confirmText: '开始计算',
              cancelText: '上一步',
            });
          }
          break;
        case '配置状态':
          this.runCompute();
          break;
        case '正在计算':
          // do nothing
          break;
        case '完成计算':
          this.onComplete();
        default:
          break;
      }
    },
    checkScheme() {
      const { character, rule, attrs, set4, only8Words, wordCount} = this.data;
      // 复制新队伍以避免对原队伍的影响
      const teams = getApp().team();
      const team = teams[0].clone();
      const member = team.getMember(character);
      const enemy = team.enemies[teams[0].curEnemy];
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
      if(only8Words && wordCount>48) {
        wx.showModal({
          title: '错误',
          content: '目标词条数超过当前遗器设置的上限',
          showCancel: false,
        });
        return;
      }
      // 禁止2+x的遗器计算
      if(set4[0]!==set4[1] && (set4[0]===null || set4[1]===null)) {
        wx.showModal({
          title: '错误',
          content: '外圈不支持2+x词条计算，请重新选择套装限制',
          showCancel: false,
        });
        return false;
      }
      if(!enemy) {
        wx.showModal({
          title: '错误',
          content: '必须选择一个有效的敌人',
          showCancel: false,
        });
        return false;
      }
      return true;
    },
    onComplete() {
      this.triggerEvent('complete', { results: this.data.results });
      this.setData({
        count: 0,
        total: 0,
        cost: 0,
        results: [],
        show: false,
        step: '配置规则',
        confirmText: '下一步',
        cancelText: '关闭',
      })
    },
    runCompute() {
      const { character, rule, attrs, main, useMaxValue, noSmallWord, only8Words, set4, set2, buffInfo, wordCount, rCount } = this.data;
      // 保存当前配置并设置界面数值
      sd('wordSetting', false).save(character, cloneSetting(this.data), false);
      
      // 复制新队伍以避免对原队伍的影响
      const teams = getApp().team();
      const team = teams[0].clone();
      const member = team.getMember(character);
      const enemy = team.enemies[teams[0].curEnemy];

      this.setData({
        count: 0,
        total: 0,
        cost: 0,
        results: [],
        step: '正在计算',
        confirmText: '计算中',
        cancelText: '中断计算',
      });

      // 获取关键词条列表
      let attrKeys = ruleConfig[rule].getAttrs(member, Object.keys(attrs));
      // 获取必要参数
      const startTime = Date.now();
      const setList = [
        (set4[0] && set4[1])? ((set4[0]===set4[1])? [set4[0]]: set4): setNames[0],
        set2? [ set2 ]: setNames[1],
      ]
      const shadow = member.getShadowData(enemy, buffInfo, setList);

      const scheme = {
        module: ruleConfig[rule].module,
        maxResult: rCount,
        config: ruleConfig[rule].initConfig(member, attrs),
        attrKeys,
        setAttrs: ruleConfig[rule].getSetAttrs(member, attrs),
        setList,
        main,
        wordCount,
        wordIdx: useMaxValue? 2: 1,
        noSmallWord,
        only8Words,
      }
      equipStore.autoSelectEquips('最佳词条', scheme, shadow, (json)=>{
        this.setData({
          cost: (Date.now() - startTime)/1000,
          count: json.count,
          total: json.total,
          results: json.results,
        }, ()=>{
          currentSets = json.sets;
          if(json.count === json.total) {
            this.setData({
              step: '完成计算',
              confirmText: '应用结果',
              cancelText: '重新计算',
            })
          }
        });
      });
    },
    stopCompute() {
      equipStore.stopSelectEquips();
    },
  }
}) 
// 复制配置数据避免不同角色的配置互相影响
function cloneSetting({rule, attrs, main, set4, set2, buffInfo, wordCount, useMaxValue, noSmallWord, only8Words, maxResult}) {
  return clone({
    rule: rule || 'simple',
    attrs: attrs || {},
    main: main || {},
    set4: set4 || [null, null],
    set2: set2 || null,
    buffInfo: buffInfo || {},
    wordCount: wordCount || 50,
    useMaxValue: useMaxValue || false,
    noSmallWord: noSmallWord || false,
    only8Words: only8Words || false,
    maxResult: maxResult || 15,
  })
}
