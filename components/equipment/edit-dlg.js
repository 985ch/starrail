const Equipment = require('../../simulator/equipment');
const { countNeedWords, getValues, json2equip, stringifyEquip } = require('../../simulator/equip_generator');
const { partText } = require('../../simulator/equipments/index');
const { getValueText, clone } = require('../../utils/util');

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  properties: {
    // 当前编辑的装备数据
    equip: {
      type: Object,
      value: null,
    },
    show: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    partText,
    subWords:[[
      {k:'大攻击', a:'atkRate'},
      {k:'大防御', a:'defRate'},
      {k:'大生命', a:'hpRate'},
      {k:'小攻击', a:'atk'},
      {k:'小防御', a:'def'},
      {k:'小生命', a:'hp'},
    ],[
      {k:'暴击', a:'criRate'},
      {k:'暴伤', a:'criDamage'},
      {k:'速度', a:'speed'},
      {k:'命中', a:'hit'},
      {k:'抵抗', a:'dodge'},
      {k:'击破', a:'breakRate'},
    ]],
    curEquip: null, // 当前装备
    mainList:[], // 主词条列表
    mainIdx: 0, // 主词条当前索引
    showLevel: 0, // 展示的遗器等级
    valueList: [], // 副词条值列表
    valueIdx: 0, // 副词条值当前索引
    main: {}, // 主词条相关信息
    attrs: [], // 副词条相关信息
    curAttr: 0, // 当前选中的副词条
    needWords:{min:0, max:0}, // 需要的词条数
    allowWords:0, // 允许的词条数
    showEquipDlg: false, // 显示套装选择框
  },
  methods: {
    // 重置当前编辑中的装备数据为修改前的状态
    onResetCurEquip() {
      this.updateData(this.data.equip);
    },
    // 重新随机生成一个装备
    onRecreateEquip() {
      const { curEquip } = this.data;
      const newEquip = Equipment.generateEquipment(curEquip.name, curEquip.part, curEquip.rarity, curEquip.level, Math.random()<0.2);
      this.updateData(newEquip)
    },
    // 显示套装选择框
    onShowEquipDlg() {
      this.setData({ showEquipDlg: true });
    },
    // 更换套装
    onSelectSet(e) {
      if(!e.detail.name) return;
      this.setData({
        ['curEquip.name']: e.detail.name,
        showEquipDlg: false,
      });
    },
    // 修改了遗器品质
    onRarityChange() {
      const { rarity, level } = this.data.curEquip;
      const newRarity = rarity==='SSR' ? 'SR': 'SSR';
      const newLevel = Math.min(level, (newRarity==='SSR' ? 15 : 12 ));
      this.setData({
        ['curEquip.rarity']: newRarity,
        ['curEquip.level']: newLevel,
        showLevel: newLevel,
      }, () => {
        this.resetCurEquip();
      });
    },
    // 遗器等级修改中
    onLevelChanging(e) {
      if(this.data.showLevel===e.detail.value) return;
      this.setData({showLevel: e.detail.value})
    },
    // 修改了遗器等级
    onLevelChange(e) {
      this.setData({
        ['curEquip.level']: e.detail.value,
        showLevel: e.detail.value,
      },()=>{
        this.resetCurEquip();
      });
    },
    onEditOK() {
      const { curEquip, attrs } = this.data;
      if(!curEquip.name) {
        this.setData({ editMode:false });
        return;
      };
      const data = {};
      attrs.forEach(attr=>{
        data[attr.attr] = attr.val;
      });
      const json = clone(curEquip);
      json.data = data;
      const equip = json2equip(json);
      if(typeof equip === 'string') {
        wx.showToast({
          title: equip,
          icon: 'none',
          duration: 2000,
        });
        return;
      }
      equip.key = stringifyEquip(equip);
      equip.id = this.data.equip.id;
      this.triggerEvent('edit', { equip});
    },
    // 更新当前的主词条列表和选中的主词条
    updateMainWordList(e) {
      const list = Equipment.getMainWordsList(e.part);
      const idx = (e && e.main) ? list.findIndex(o => o.attr===e.main) : 0;
      return { list, idx };
    },
    // 修改了主词条
    onMainWordChange(e) {
      let idx = Math.max(0, e.currentTarget.dataset.index);
      const newWord = this.data.mainList[idx].attr;
      this.setData({
        mainIdx: idx,
        ['curEquip.main']: newWord,
        curAttr: this.data.curAttr,
      },()=>{
        if(this.data.curEquip.data[newWord]) {
          this.changeSubAttr(newWord);
        } else {
          this.resetCurEquip();
        }
      });
    },
    // 响应修改子词条事件
    onSubWordChange(e) {
      const { attrs, curAttr, main } = this.data;
      const before = attrs[curAttr].attr;
      const after = e.currentTarget.dataset.attr;
      if(before === after || after===main.attr ) return;
      this.changeSubAttr(before, after);
    },
    // 修改当前选中的副词条
    onSelAttr(e) {
      const { curAttr } = this.data;
      const idx = e.currentTarget.dataset.index;
      if(curAttr === idx) return;
      this.setData({ curAttr: idx });
    },
    // 子词条修改中
    onValueChanging(e) {
      const { valueList, attrs, curAttr, curEquip, needWords } = this.data;
      const idx = e.detail.value;
      const val = valueList[idx];
      const attr = attrs[curAttr];
      if(val === attr.val) return;
      const bInfo = countNeedWords(curEquip.rarity, attr.attr, attr.val, 6, true);
      attr.val = val;
      attr.value = getValueText(val, attr.value[attr.value.length-1]==='%'? 'percent':(attr.attr==='speed'?'float':'integer'));
      const aInfo = countNeedWords(curEquip.rarity, attr.attr, attr.val, 6, true);
      needWords.min += aInfo.min - bInfo.min;
      needWords.max += aInfo.max - bInfo.max;
      this.setData({
        ['attrs['+curAttr+']']: attr,
        valueIdx: idx,
        needWords,
      })
    },
    onValueAdd() {
      const { valueIdx, valueList } = this.data;
      if(valueIdx < valueList.length-1) {
        const e = {detail:{value: valueIdx+1}}
        this.onValueChanging(e);
        this.onValueChange(e);
      }
    },
    onValueMin() {
      const { valueIdx } = this.data;
      if(valueIdx > 0) {
        const e= {detail:{value: valueIdx-1}}
        this.onValueChanging(e);
        this.onValueChange(e);
      }
    },
    onValueChange(e) {
      const { valueList, attrs, curAttr } = this.data;
      const idx = e.detail.value;
      const val = valueList[idx];
      const attr = attrs[curAttr];
      this.setData({['curEquip.data.'+attr.attr]:val});
    },
    // 计算需要的词条数
    countAllWords(attrs, equip) {
      let min = 0;
      let max = 0;
      equip = equip || this.data.curEquip;
      attrs.forEach(attr => {
        const info = countNeedWords(equip.rarity, attr.attr, attr.val, 6, true);
        min += info.min;
        max += info.max;
      });
      return { min, max };
    },
    // 修改子词条
    changeSubAttr(before, after) {
      const { curEquip, curAttr } = this.data;
      if(before === after ||  !curEquip.data[before]) return;
      if(!after) { // 未指定修改后的词条时，从所有可选词条中随机选一个
        const list = Equipment.getSubWordsList(curEquip, before);
        after = list[Math.floor(Math.random() * list.length)].attr;
      }

      const newData = {}
      const keys = Object.keys(curEquip.data);
      for(let i=0; i<keys.length; i++) {
        const key = keys[i];
        if(key === before ) {
          newData[after] = curEquip.data[key];
        } else if(key === after) {
          newData[before] = curEquip.data[key];
        } else {
          newData[key] = curEquip.data[key];
        }
      }

      this.setData({
        ['curEquip.data']: newData,
      }, () => {
        this.resetCurEquip();
        this.updateValueList(curAttr)
      });
    },
    // 重置当前装备数据
    resetCurEquip(equip) {
      equip = equip || this.data.curEquip;
      if(equip.name) {
        const { main, attrs } = Equipment.getAttributesTextInfo(equip, false, true, true);
        const needWords = this.countAllWords(attrs);
        const allowWords = Math.floor(equip.level/3) + (equip.rarity==='SSR'? 3: 2);
        this.setData({main, attrs, needWords, allowWords});
      }
    },
    // 重设装备相关数据
    updateData(equip){
      if(!equip) return;
      let curEquip = clone(equip);
      const { list, idx } = this.updateMainWordList(curEquip);
      
      const { main, attrs } = Equipment.getAttributesTextInfo(curEquip, false, true, true);
      const needWords = this.countAllWords(attrs, curEquip);
      const allowWords = Math.floor(curEquip.level/3) + (curEquip.rarity==='SSR'? 3: 2);
      this.setData({
        curEquip,
        showLevel: curEquip.level,
        mainList: list,
        mainIdx: idx,
        main,
        attrs,
        needWords,
        allowWords,
      },() => {
        this.setData({ curAttr: 0});
      });
    },
    // 更新词条值列表
    updateValueList(i) {
      const { attrs, curEquip } = this.data;
      const attr = attrs[i].attr;
      const val = attrs[i].val - 0.005;
      const valueList = getValues(curEquip.rarity, attr, curEquip.rarity==='SSR'? 6: 4);
      const valueIdx = valueList.findIndex(v => v >= val);
      this.setData({
        valueList,
        valueIdx,
      });
    }
  },
  observers: {
    equip: function(obj) {
      this.updateData(obj);
    },
    curAttr: function(i) {
      this.updateValueList(i);
    },
  },
})