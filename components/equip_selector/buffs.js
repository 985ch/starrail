const { setNames, setsClass } = require('../../simulator/equipments/index')
Component({
  properties: {
    set4: {
      type: Array,
      value: [null, null],
    },
    set2: {
      type: String,
      optionalTypes: [null],
      value: null,
    },
    buffInfo: {
      type: Object,
      value: {},
    }
  },
  data: {
    buffs:[], // 可配置增益列表
  },
  methods: {
    onBuffChange(e) {
      const {buffs, buffInfo} = this.data;
      const index = e.currentTarget.dataset.index;
      const buff = buffs[index];
      buff.value = (buff.value + 1)%(buff.max + 1);
      for(let i=0;i<buffs.length;i++) {
        const cur = buffs[i];
        if(!buffInfo[cur.set])buffInfo[cur.set] = {};
        buffInfo[cur.set][cur.name] = cur.value; 
      }
      this.triggerEvent('change', {buffInfo});
    },
    updateBuffs(set4, set2, buffInfo) {
      const allNames = [];
      if(set4[0]===set4[1]) {
        if(set4[0]===null) {
          allNames.push(...setNames[0]);
        } else {
          allNames.push(set4[0]);
        }
      } else{
        allNames.push(...set4.filter(item => item!==null))
      }
      if(set2 !== null) {
        allNames.push(set2);
      } else {
        allNames.push(...setNames[1]);
      }
      const buffs = [];
      allNames.forEach(name => {
        const setBuffs = setsClass[name].getDesc().buffs;
        if(!setBuffs) return;
        setBuffs.forEach(item => {
          const val = buffInfo[name]? buffInfo[name][item[1]]: null;
          const value = (!val && val!==0)? item[2]: val;
          buffs.push({
            set: name,
            text: item[0],
            name: item[1],
            max: item[2],
            value,
          })
        })
      })
      this.setData({ buffs })
    },
  },
  observers: {
    'set4,set2,buffInfo': function (set4, set2, buffInfo) {
      this.updateBuffs(set4,set2,buffInfo)
    }
  }
})