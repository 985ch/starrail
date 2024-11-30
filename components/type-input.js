// components/type-input.js
Component({
  properties: {
    label: {
      type: String,
      value: 'text'
    },
    type: {
      type: String,
      value: 'number'
    },
    options: {
      type: Array,
      value: [0, 1]
    },
    value: {
      optionalTypes: [String, Number],
      value: 0,
    },
    position: {
      type: String,
      value: 'left'
    },
    top: {
      type: String,
      value: '50rpx'
    },
  },
  data: {
    enumList: [],
    listType: 'menu',
    valText: '',
    valIdx: 0,
    valArr:[0,0],
  },
  methods: {
    initList(type, options, value) {
      if(type==='buffTag') {
        this.initBuffTags(options, value);
        return;
      }
      if(options.length===0) options = [['无', '无']];
      let valIdx = options.findIndex((item) => item[0] === value);
      valIdx = valIdx<0? 0 : valIdx;
      const itm = options[valIdx];
      const valText = itm[2] || itm[1] || itm[0];
      let enumList,listType;
      switch(type) {
        case 'buffKey':
        case 'buffSelf':
        case 'list':
          listType = 'picker';
          enumList = options.map(item => ({
            value: item[0],
            text: item[1] || item[0],
            short: item[2] || item[1] || item[0],
          }));
          break;
        case 'member':
        case 'enum':
        default:
          listType = 'menu';
          enumList = options;
      }
      this.setData({ enumList, listType, valText, valIdx });
    },
    initBuffTags(options, value) {
      let valArr = null;
      let valText;
      for(let i=0; i<options.length; i++) {
        for(let j=0; j<options[i].data.length; j++) {
          const cur = options[i].data[j];
          valText = cur.name || cur;
          if(valText === value) {
            valArr = [i, j];
            break;
          }
        }
        if(valArr)break;
      }
      if(!valArr) {
        valArr=[0,0];
        valText = options[0].data[0].name || options[0].data[0];
      }
      this.setData({ enumList: options, listType:'gpicker', valText, valArr });
    },
    onNumChange(e) {
      const value = e.detail.value;
      this.triggerEvent('change', { value: value });
      this.setData({ value });
    },
    onSelectMenu(e) {
      const valIdx = e.currentTarget.dataset.idx;
      const list = this.data.enumList;
      const itm = list[valIdx];
      const valText = itm[1] || itm[0];
      this.triggerEvent('change', { value: itm[0] });
      this.setData({ valText, valIdx });
    },
    onSelectItem(e) {
      const list = this.data.enumList;
      let valIdx = e.detail.value;
      valIdx = valIdx<0? 0 : valIdx;
      const valText = list[valIdx].short;
      this.triggerEvent('change', { value:list[valIdx].value });
      this.setData({ valText, valIdx });
    },
    onSelectArr(e) {
      const list = this.data.enumList;
      const valArr = e.detail.value;
      const valText = e.detail.name;
      this.triggerEvent('change', { value:valText });
      this.setData({ valText, valArr });
    },
    onSwitchValue() {
      const list = this.data.enumList;
      if(list.length <= 1)return;
      const valIdx = (this.data.valIdx + 1)%2;
      const itm = list[valIdx];
      const valText = itm[1] || itm[0];
      this.triggerEvent('change', { value: itm[0] });
      this.setData({ valText, valIdx });
    },
  },
  observers: {
    'type,options,value': function(type,options, value) {
      if(type!=='number'){
        this.initList(type, options, value);
      }
    },
}
})