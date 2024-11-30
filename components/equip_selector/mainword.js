const Equipment = require('../../simulator/equipment');
const D = require('../../simulator/data');
const mainParts = [
  ['身','body'],
  ['脚','foot'],
  ['链','link'],
  ['球','ball'],
];
Component({
  properties: {
    mainWord: {
      type: Object,
      value: {},
      observer(val) {
        const main = this.data.main;
        for(let i=0;i<mainParts.length;i++){
          const key = mainParts[i][1];
          const value = val[key];
          if(value){
            main[key] = [D.AttributeText[value].short, value];
          }else{
            main[key] = ['不限制', null];
          }
        }
        this.setData({main});
      }
    }
  },
  data: {
    mainParts,
    attrList: {},
    main: { // 主词条限制
      body: ['不限制', null],
      foot: ['不限制', null],
      link: ['不限制', null],
      ball: ['不限制', null],
    },
  },
  methods: {
    onSelect(e) {
      const {attrList} = this.data;
      const {part} = e.currentTarget.dataset;
      const idx = e.detail.value;
      this.setData({
        [`main.${part}`]: [attrList[part][idx].short, attrList[part][idx].attr]
      }, ()=> {
        const json = {};
        for(let key in this.data.main) {
          if(this.data.main[key][1]) json[key] = this.data.main[key][1];
        }
        this.triggerEvent('change', { main:json });
      });
    }
  },
  lifetimes: {
    ready() {
      const attrList = {};
      for(let i=0; i<mainParts.length; i++) {
        const part = mainParts[i][1];
        attrList[part] = [{text:'不限制',attr:null, short:'不限制'}].concat(Equipment.getMainWordsList(part));
      }
      this.setData({ attrList });
    }
  }
})