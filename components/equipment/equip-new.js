const { importEquips } = require('../../simulator/equip_generator');
const D = require('../../simulator/data');
const { importEquipsFromWX } = require('../../simulator/ocr_parser');
const equipStore = require('../../simulator/equip_store');
const { setsData } = require('../../simulator/equipments/index');

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '添加遗器'
    },
    part: {
      type: String,
      value: 'head'
    },
    selected: {
      type: Number,
      value: 0
    },
    import: {
      type: Boolean,
      value: false
    }
  },
  data: {
    curIdx: 0,
    importMode: false,
    inputText: '',
    list: [],
    images: [],
  },
  methods: {
    onConfirm() {
      if(this.data.importMode) {
        this.onInputConfirm();
      } else {
        this.onSelected();
      } 
    },
    onSelChange(e) {
      this.setData({
        curIdx: e.currentTarget.dataset.index,
      },()=> this.updateText())
    },
    onSelected() {
      const { part, list, curIdx }= this.data;
      this.triggerEvent('select', {
        part,
        name: list[curIdx].name,
      })
    },
    onModeChange() {
      this.setData({ importMode:!this.data.importMode })
    },
    updateText() {
      const { list, curIdx, part } = this.data;
      const item = list[curIdx];
      if(!item) return;
      this.setData({ inputText: item.short + '金' + D.EquipPartNames[part] + '15'})
    },
    onInput(e) {
      this.setData({ inputText: e.detail.value })
    },
    onInputConfirm() {
      const text = this.data.inputText;
      // 先尝试按短文本导入
      let info = importEquips(text);
      if(info.equips.length===0 && info.msg) {
        // 短文本导入失败尝试用微信文本导入
        info = importEquipsFromWX(text);
      }
      // 遗器入库
      equipStore.addEquips(info.equips);
      wx.showToast({
        title: info.msg || '遗器导入成功',
        icon: info.msg? 'none': 'success',
        duration: 2000,
      });
      if(info.equips.length === 0) return;
      this.triggerEvent('load', { equips: info.equips });
      this.setData({show: false});}
  },
  observers: {
   'selected': function(val) {
      this.setData({ curIdx: val }, ()=> this.updateText());
    },
    'part': function(val) {
      const list = (val!=='link' && val!=='ball') ? setsData[0] : setsData[1];
      const images = list.map(obj => `${obj.image}_${val}`)
      this.setData({ list, images },()=> this.updateText())
    }
  }
})