const { ruleList, ruleConfig } = require('../../simulator/equip_rules');
// 词条列表
const attrWords = [
  {text:"未选择",value: null,min: 0,max: 99999},
  {text:"暴击",value: "criRate",min: 0,max: 100},
  {text:"暴伤",value: "criDamage",min: 0,max: 99999},
  {text:"速度",value: "speed",min: 0,max: 99999},
  {text:"攻击",value: "atk",min: 0,max: 99999},
  {text:"防御",value: "def",min: 0,max: 99999},
  {text:"生命",value: "hp",min: 0,max: 99999},
  {text:"命中",value: "hit",min: 0,max: 99999},
  {text:"抵抗",value: "dodge",min: 0,max: 99999},
  {text:"击破",value: "breakRate",min: 0,max: 99999},
];
// 结果列表
const resultList = [
  {text:"仅显示最佳结果", value:1 },
  {text:"显示前3个结果", value:3 },
  {text:"显示前5个结果", value:5 },
  {text:"显示前10个结果", value:10 },
  {text:"显示15个结果", value:15 },
  {text:"显示20个结果", value:20 },
  {text:"显示30个结果", value:30 },
  {text:"显示50个结果", value:50 },
];
// 排序列表
const sortList = [
  {text:"平均提升期望降序", value:"avg" },
  {text:"最大提升期望降序", value:"max" },
  {text:"获得提升概率降序", value:"win"}
];
Component({
  properties: {
    name: {
      type: String,
      value: '',
    },
    rule: {
      type: String,
      value: '',
    },
    count: {
      type: Number,
      value: 5,
      observer(val) {
        const idx = resultList.findIndex((item) => item.value === val);
        this.setData({ selResult: idx>0? idx: 2});
      }
    },
    hideCount: {
      type: Boolean,
      value: false
    },
    attrs: {
      type: Object,
      value: {},
      observer(val) {
        this.updateAttrs(val);
      }
    },
  },
  data: {
    attrWords,
    rList: [],
    resultList,
    sortList,
    selResult: 2,
    selSort: 0,
    selected: 0,
    attrList: [ // 属性记分规则
      ['未选择',null,0,0,99999],
      ['未选择',null,0,0,99999],
      ['未选择',null,0,0,99999],
      ['未选择',null,0,0,99999],
      ['未选择',null,0,0,99999],
    ]
  },
  methods: {
    onSelRule(e){
      this.setData({ selected: e.detail.value}, ()=>this.change())
    },
    onSelResult(e) {
      this.setData({ selResult: e.detail.value}, ()=>this.change())
    },
    onSelSort(e) {
      this.setData({ selSort: e.detail.value}, ()=>this.change())
    },
    onSelAttr(e) {
      const { index } = e.currentTarget.dataset;
      const { attrList } = this.data;
      const word = attrWords[e.detail.value];
      if(word.value) {
        for(let i=0;i<attrList.length;i++) {
          if(i!==index && attrList[i][1]===word.value) {
            attrList[i] = ['未选择',null,0,0,99999];
          }
        }
      }
      attrList[index] = [word.text, word.value, 10, word.min, word.max];
      this.setData({attrList}, ()=>this.change());
    },
    changeAttrValue(e) {
      const { index, type } = e.currentTarget.dataset;
      const { value } = e.detail;
      this.setData({[`attrList[${index}][${type}]`]: value}, ()=>this.change())
    },
    change() {
      const { attrList, selected, selSort, selResult, rList } = this.data;
      const json = {};
      attrList.forEach(itm =>{
        if(!itm[1]) return;
        json[itm[1]] = [itm[2], itm[3], itm[4]]
      })
      this.triggerEvent('change', {
        rule: rList[selected].value,
        rCount: resultList[selResult].value,
        sort: sortList[selSort].value,
        attrs: json
      })
    },
    updateAttrs(attrs) {
      const lst = this.data.attrList;
      for(let i=0;i<lst.length;i++) {
        const key = lst[i][1];
        if(key && !attrs[key]) {
          lst[i] = ['未选择',null,0,0,99999];
        }
      }
      for(let key in attrs) {
        let idx = lst.findIndex(itm => itm[1]===key);
        if(idx<0) {
          idx = lst.findIndex(itm => itm[1]===null);
        }
        let word = attrWords.find(itm => itm.value===key);
        lst[idx] = [word.text, key, attrs[key][0], attrs[key][1], attrs[key][2]];
      }
      this.setData({attrList: lst});
    }
  },
  observers: {
    'name,rule': function(name, rule) {
      const rList = ruleList.filter((item) => !item.members || item.members.includes(name));
      const idx = rList.findIndex((item) => item.value === rule);
      this.setData({ rList, selected: idx>0? idx: 0});
    }
  }
})