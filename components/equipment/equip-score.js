const equipStore = require('../../simulator/equip_store');
const { getSubValue } = require('../../simulator/equip_generator');
const { setsClass } = require('../../simulator/equipments/index');
const D = require('../../simulator/data');

Component({
  properties: {
    einfo: {
      type: Object,
      value: null,
      observer({id, part}) {
        const e = equipStore.getEquip(part, id);
        
        if(!e) return;
        const info = setsClass[e.name]? setsClass[e.name].getDesc(): null;
        if(!info) return;
        const datas = [];
        for(let key in e.data) {
          const tInfo = D.AttributeText[key];
          const val =  getSubValue(e.data[key], key, 'SSR');
          const valText = tInfo.type==='integer'? Math.floor(val): (tInfo.type==='percent'? (Math.floor(val*10)/10).toFixed(1) + '%' : (Math.floor(val*10)/10).toFixed(1))
          datas.push({ tag: tInfo.short, val: valText});
        }
        this.setData({
          equip: e,
          datas,
        })
      }
    },
    avg: {
      type: Number,
      value: 0,
    },
    max: {
      type: Number,
      value: 0,
    },
    win: {
      type: Number,
      value: 0,
    }
  },
  data: {
    datas: [],
    equip: null,
    showDlg: false,
  },
  methods: {
    onViewDetail(){
      this.triggerEvent('select',this.data.einfo)
    }
  },
})