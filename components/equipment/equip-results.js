const equipStore = require('../../simulator/equip_store');
const { getSubValue } = require('../../simulator/equip_generator');
const createRecycleContext = require('miniprogram-recycle-view');
const D = require('../../simulator/data');
const { clone, pick } = require('../../utils/util');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    equip: {
      type: Object,
      value: null,
      observer: function(equip) {
        if(!equip) {
          wx.showToast({title: '遗器不存在', icon: 'none'});
          this.setData({show: false});
          return;
        };
        const subWords = [];
        for(let key in equip.data) {
          const val = getSubValue(equip.data[key], key, equip.rarity);
          subWords.push({key, val, tag: D.AttributeText[key].short, vText: val2text(val, key)});
        }
        while(subWords.length<4) {
          subWords.push(null);
        }
        this.setData({
          equip,
          mainText: D.AttributeText[equip.main].short +D.EquipPartNames[equip.part],
          subWords,
          subList: this.getSubSelector(equip.main, subWords),
        });
      }
    },
    info: {
      type: Object,
      value: {curScore:0, buffs:[], info: null},
      observer: function({curScore, info}) {
        if(!info) return;
        let total = 0;
        this.setData({
          avg: getUpgradeRate(info.avg, curScore),
          win: info.win,
          list: info.list.map(obj=>({
            equip: obj.equip,
            rate: obj.rate,
            total: (total += obj.rate),
            upgrade: getUpgradeInfo(obj.upgrade),
            up: getUpgradeRate(obj.score, curScore),
          }))
        },()=>{
          if(this.ctx)this.ctx.splice(0, 9999, this.data.list);
        })
      }
    },
    needSave: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    avg: 0,
    win: 0,
    list:[],
    resultList: [],

    mainText: '未知', // 用于显示的主词条和部位
    subWords: [], // 用于显示的子词条

    // 副词条编辑选项
    showSelector: false, // 是否显示副词条选择
    subList: [], // 可选副词条选项
    subSel: [0, 0], // 选中的副词条

    // 滚动区域宽高
    scrollWidth: 690 * wx.getSystemInfoSync().windowWidth/750,
    scrollHeight: 500 * wx.getSystemInfoSync().windowWidth/750,
  },
  methods: {
    // 更新遗器选择器
    getSubSelector(main, subList) {
      if(subList[3]) {
        return subList.map(sub => {
          const obj = { text: sub.tag, key: sub.key, data:[null,null,null]};
          for(let i=0;i<3;i++) {
            obj.data[i] = {
              name: val2text( D.EquipSubData.SSR[sub.key][i] + sub.val, sub.key),
              idx: i,
            }
          }
          return obj;
        })
      }
      const list = [];
      for(let key in D.EquipSubData.SSR) {
        if(key===main || subList.findIndex(sub => sub && sub.key===key)>=0 ) continue;
        const tInfo = D.AttributeText[key];
        const obj = { text: tInfo.short2 || tInfo.short, key, data:[null,null,null]};
        for(let i=0;i<3;i++) {
          obj.data[i] = {
            name: val2text( D.EquipSubData.SSR[key][i], key),
            idx: i,
          }
        }
        list.push(obj);
      }
      return list;
    },
    // 试装遗器
    onTry(e) {
      const { equip } = e.currentTarget.dataset;
      this.triggerEvent('try', { equip, buffs:this.data.info.buffs })
      this.setData({show:false})
    },
    // 升级遗器
    onUpgrade() {
      this.setData({showSelector: true});
    },
    // 重置遗器
    onReset() {
      const { id, part } = this.data.equip;
      const equip = equipStore.getEquip(part, id);
      this.triggerEvent('upgrade', { equip:clone(equip), needSave: false });
    },
    // 遗器保存入库
    onSave() {
      const { equip, needSave } = this.data;
      if(!needSave) return;
      this.triggerEvent('save', { equip: clone(equip) });
    },
    // 完成升级选择
    onCompleteUpgrade(e) {
      const { subList, equip } = this.data;
      const sel = e.detail.value;
      const key = subList[sel[0]].key;
      const newEquip = pick(equip, ['id','level','main','name','part','rarity']);
      newEquip.data = clone(equip.data);
      if(newEquip.data[key]) {
        newEquip.data[key].push(sel[1]);
      } else {
        newEquip.data[key] = [sel[1]];
      }
      newEquip.level += 3-newEquip.level%3;
      this.triggerEvent('upgrade', { equip:newEquip, needSave: true });
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
        id: 'resultList',
        dataKey: 'resultList',
        page: this,
        itemSize: {
          width: 690 * wx.getSystemInfoSync().windowWidth/750,
          height: 75 * wx.getSystemInfoSync().windowWidth/750,
        },
      });
    },
  },
})

function getUpgradeRate(score, curScore) {
  return curScore<=0? score: score/curScore;
}
function val2text(val, key) {
  const tInfo = D.AttributeText[key];
  switch(tInfo.type) {
    case 'percent':
      return (Math.floor(val*10)/10).toFixed(1)+'%';
    case 'integer':
      return Math.floor(val);
    default:
      return (Math.floor(val*10)/10).toFixed(1);
  }
}
function getUpgradeInfo(list) {
  if(!list) return ['未命中有效词条'];
  return list.map(arr=>{
    const tInfo = D.AttributeText[arr[0]]
    return `${tInfo.short2||tInfo.short} ${arr[1]}`;
  });
}