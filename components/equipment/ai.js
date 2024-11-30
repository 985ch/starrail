const Team = require('../../simulator/team');
const equipStore = require('../../simulator/equip_store');
const { setNames } = require('../../simulator/equipments/index')
const { ruleList, ruleConfig } = require('../../simulator/equip_rules');
const { clone, loadData, saveData } = require('../../utils/util');
const sd = require('../../utils/savedata');

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
        const equipSetting = sd('equipSetting', false).getList(null);
        let setting = null;
        if(equipSetting[newVal]){ 
          setting = equipSetting[newVal];
        }
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
            set4: [null, null],
            set2: '繁星竞技场',
            ignore: [false, false],
            maxMainWord: false,
            scoreFilter: 25,
            maxResult: 5,
          });
        }
        this.setData(cloneSetting(setting));
      }
    },
  },
  data: {
    rule: 'simple', // 方案配置对象
    rCount: 5, // 显示结果数量
    attrs: {}, // 额外属性配置
    main: {}, // 主属性锁定配置
    set4: [null, null], // 外圈限制
    set2: null, // 内圈限制
    ignore: [false, false], // 是否忽略遗器
    maxMainWord: false, // 未满级遗器的主属性是否按满级计算
    scoreFilter: 25, // 评分过滤强度，范围在0到50之间，0为不过滤
    buffInfo: {}, // 增益配置数据
    mode: 'setup', // 工作模式“setup”是配置模式，“compute”是计算模式,“complete”是计算完成

    cost: 0, // 耗时
    count: 0, // 计算组合数
    skipped: 0, // 跳过组合数
    totalCount: 0, // 总组合次数
    results: [], // 结果数组

    confirmText: '下一步', // 确认按钮文本
    cancelText: '关闭', // 取消按钮文本
  },
  methods: {
    onSettingChange(e) {
      this.setData(e.detail);
    },
    onSwapDisable(e) {
      if(this.data.mode!=='setup') return;
      const { index } = e.currentTarget.dataset;
      this.setData({
        ['ignore['+index+']']: !this.data.ignore[index] 
      })
    },
    onSwapMaxMain() {
      this.setData({ maxMainWord: !this.data.maxMainWord });
    },
    onSetup() {
      const { character, rule, attrs, main, ignore, set4, set2, buffInfo, scoreFilter, rCount, maxMainWord } = this.data;
      
      // 获取忽略遗器列表
      const ignoreList = [];
      const teams = getApp().team();
      for(let i=0; i<2; i++) {
        if(!ignore[i]) continue;
        for(let j=0; j<4; j++) {
          const member = teams[i].members[j];
          if(!member || (member.name === character)) continue;
          addToIgnoreList(member, ignoreList);
        }
      }
      // 复制新队伍以避免对原队伍的影响
      const team = teams[0].clone();
      const member = team.getMember(character);
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

      // 获取必要参数
      const startTime = Date.now();
      const setList = [
        (set4[0] && set4[1])? ((set4[0]===set4[1])? [set4[0]]: set4): setNames[0],
        set2? [ set2 ]: setNames[1],
      ]
      const shadow = member.getShadowData(enemy, buffInfo, setList);
      //attrKeys = member.fillNeedAttrs(shadow.member.attr, attrs, attrKeys, setList, main); // TODO:找到了更好的优化方案以后这里可以解除注释
      shadow.equips = equipStore.filterEquips(member, attrKeys, main, setList, ignoreList, maxMainWord);

      const scheme = {
        module: ruleConfig[rule].module,
        config: ruleConfig[rule].initConfig(member, attrs),
        attrKeys,
        setAttrs: ruleConfig[rule].getSetAttrs(member, attrs),
        set4: set4.reduce((obj, name)=>{
          if(name) obj[name]=(obj[name] || 0)+2;
          return obj;
        }, {}),
        set2,
        maxResult: rCount,
        scoreFilter,
      }
      
      equipStore.autoSelectEquips('自动配装', scheme, shadow, (json)=>{
        switch(json.type) {
          case 'countTime':
            this.setData({ cost:(Date.now() - startTime)/1000});
            break;
          case 'initComplete':
            this.setData({ totalCount: json.count });
            break;
          case 'update':
          case 'complete':
            //console.log(json);
            this.setData({
              cost: (Date.now() - startTime)/1000,
              count: json.count,
              skip: json.skip,
              results: json.results.map(res => result2Equips(res)),
            });
            if(json.type==='complete') {
              this.setData({
                mode:'complete',
                confirmText: '加入备选',
                cancelText: '放弃配装',
              })
            }
            break;
          default:
            break;
        }
      })
      // 保存当前配置并设置界面数值
      sd('equipSetting', false).save(character, cloneSetting(this.data), false);
      this.setData({
        mode:'compute',
        cost: 0,
        skip: 0,
        count: 0,
        totalCount: 0,
        results: [],
        confirmText: '请等待',
        cancelText: '放弃配装',
      })
    },
    onCancel() {
      switch(this.data.mode) {
        case 'compute':
          equipStore.stopSelectEquips();
          this.setData({
            mode:'complete',
            confirmText: '加入备选',
            cancelText: '放弃配装',
          });
          break;
        case 'buff':
        case 'complete':
          this.setData({
            mode: 'setup',
            confirmText: '下一步',
            cancelText: '关闭',
          });
          break;
        case 'setup':
          this.setData({
            cost: 0,
            totalCount: 0,
            count: 0,
            results: [],
            show: false,
          })
          break;
        default:
          this.setData({show: false})
          break;
      }
    },
    onConfirm() {
      switch(this.data.mode) {
        case 'setup':
          this.setData({
            mode: 'buff',
            confirmText: '开始配装',
            cancelText: '上一步',
          });
          break;
        case 'buff':
          this.onSetup();
          break;
        case 'compute':
          // do nothing
          break;
        case 'complete':
          this.onComplete();
          break;
        default:
          break;
      }
    },
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
    onComplete() {
      //console.log('complete')
      this.triggerEvent('change', { list: this.data.results });
      this.setData({
        show: false,
        mode: 'setup',
        cost: 0,
        skipped: 0,
        totalCount: 0,
        count: 0,
        results: [],
        confirmText: '下一步',
        cancelText: '关闭',
      });
    },
  },
})
// 把角色的遗器加入忽略列表
function addToIgnoreList(member, list) {
  const keys = member.equip.getEquipmentKeys();
  keys.forEach(key => {
    if(!list.includes(key)) list.push(key);
  })
}
// 把回传的结果转换成装备数组
function result2Equips(result) {
  const equips = {};
  for(let key of result.ids) {
    const texts = key.split('-');
    const equip = equipStore.idx[texts[0]][texts[1]];
    equips[equip.part] = equip;
  }
  return { equips, score:result.score, buffs: result.buffs };
}
// 复制配置数据避免不同角色的配置互相影响
function cloneSetting({rule, attrs, main, set4, set2, buffInfo, ignore, maxMainWord, maxResult}) {
  return clone({
    rule: rule || 'simple',
    attrs: attrs || {},
    main: main || {},
    set4: set4 || [null, null],
    set2: set2 || null,
    buffInfo: buffInfo || {},
    ignore: [...(ignore || [false, false])],
    maxMainWord: maxMainWord || false,
    maxResult: maxResult || 5,
  })
}