const Equipment = require('../../simulator/equipment');
const { setsData, partText } = require('../../simulator/equipments/index');
const D = require('../../simulator/data');
const equipStore = require('../../simulator/equip_store');
const createRecycleContext = require('miniprogram-recycle-view');
const { getJsonFile } = require('../../utils/util');
const getYasEquips = require('../../simulator/yas');
const getHsrScannerData = require('../../simulator/hsr-scanner');

let showTip = true; // 每次启动第一次显示提示

// 检查两个值是否相同
function checkValue(text, value, type) {
  if(text==='-全部-') return true;
  if(type==='set') {
    return text === value;
  } else if(type==='main') {
    return text === D.AttributeText[value].text;
  }
  for(let key in value) {
    if(text === D.AttributeText[key].text) return true;
  }
  return false;
}

Component({
  properties: {
    part: {
      type: String,
      value: 'head',
      observer(newVal, oldVal) {
        if(newVal !== oldVal) {
          this.updatePart(newVal);
        }
      }
    },
    equip: {
      type: Object,
      value: null,
      observer(newVal, oldVal) {
        if(newVal !== oldVal) {
          this.updatePart(this.data.part);
        }
      }
    },
    charName: {
      type: String,
      value: '虎克',
      observer(newVal, oldVal) {
        if(newVal !== oldVal) {
          this.updatePart(this.data.part);
        }
      }
    },
  },
  data: {
    // 滚动条宽高
    scrollHeight: 360 * wx.getSystemInfoSync().windowWidth/750,
    scrollWidth: 490 * wx.getSystemInfoSync().windowWidth/750,

    // 筛选条件
    partList: Object.keys(partText).map(key=>({ key, value: partText[key] })),
    minLevel: 0,
    equipList: [],
    setName: '-全部-',
    mainList: [],
    mainWord: '-全部-',
    attrList: ['-全部-'].concat(Equipment.getSubWordsList()),
    attr1: '-全部-',
    attr2: '-全部-',

    showEditDlg: false,
    showNewEquipDlg: false,
    showImportDlg: false,

    showIndex: -1,
    editIndex: -1,

    // 显示列表
    showList: [],
    equipShowList: [],
  },
  methods: {
    onSelectLevel(e) {
      this.setData({ minLevel: e.detail.value }, ()=> this.updateShowEquips(this.data.equip));
    },
    onSelectAttr(e) {
      const { lkey, key } = e.currentTarget.dataset;
      const list = this.data[lkey];
      let idx = Math.min(list.length-1, Math.max(0, e.detail.value));
      const value = list[idx].text || list[idx].name || list[idx];
      this.setData({ [key]:value }, ()=> this.updateShowEquips(this.data.equip));
    },
    onChangePart(e) {
      this.triggerEvent('partChange', { part: e.currentTarget.dataset.part })
    },
    onSelectEquip(e) {
      const { equip } = e.currentTarget.dataset;
      const { showList } = this.data;
      const showIndex = showList.findIndex(item => item.id === equip.id);
      this.setData({ showIndex });
      this.triggerEvent('equip', { equip })
    },
    updateShowEquips(equip) {
      const { minLevel, setName, mainWord, attr1, attr2, part } = this.data;
      const list = equipStore.getList(part);
      const showList = list.filter((item) => {
        if(item.level<minLevel) return false;
        const success = checkValue(setName, item.name, 'set') && checkValue(mainWord, item.main, 'main') && checkValue(attr1, item.data) && checkValue(attr2, item.data);
        return success;
      }).sort((b,a)=> (a.locked?1: 0) - (b.locked?1: 0));
      const showIndex = !equip? -1: showList.findIndex(e => {
        return e.id === equip.id && (equip.key? e.key === equip.key : equipStore.checkSame(e, equip, true));
      });
      showList.push({type:'addBtn'});
      if(this.ctx)this.ctx.splice(0, 9999, showList);
      this.setData({ showList, showIndex });
    },
    updatePart(part) {
      const list = (part!=='link' && part!=='ball') ? setsData[0] : setsData[1];
      const setName = list.findIndex(itm=>this.data.setName===itm.name)>=0 ? this.data.setName : '-全部-';
      const mainList = Equipment.getMainWordsList(part);
      const mainWord = mainList.findIndex(itm => itm.text === this.data.mainWord)>=0 ? this.data.mainWord : '-全部-';
      this.setData({
        setsList: ['-全部-'].concat(list),
        setName,
        mainList: ['-全部-'].concat(mainList),
        mainWord,
      },()=> {
        this.updateShowEquips(this.data.equip);
      });
    },
    updateList(equip) {
      const { showIndex } = this.data;
      if(showIndex<0) return;
      this.setData({ ['showList['+showIndex+']']: equip });
      this.ctx.update(showIndex, [ equip])
    },
    onStoreEquip() {
      const { equip } = this.data;
      if(!equip) return;
      const newEquip = equipStore.addEquip(equip, true, true);
      if(typeof newEquip === 'string') {
        wx.showToast({ title: equip, icon: 'none' });
        return;
      }
      this.setData({ equip: newEquip },()=>{
        this.updateShowEquips(newEquip);
        this.triggerEvent('equip', { equip: newEquip, isStore: true })
      });
    },
    onSetLock(){
      const {equip, charName} = this.data;
      if(!equip.locked && showTip) {
        wx.showModal({
          title: '提示',
          content: '锁定后，给当前角色以外的角色配装时，该遗器将不会参与计算。',
          showCancel: false,
          confirmText: '知道了',
          success: (res) => {
            if (res.confirm) {
              showTip = false;
            }
          }
        });
      }
      if(equip.locked) {
        equipStore.unlockEquip(equip);
      } else {
        equipStore.lockEquip(equip, charName);
      }
      this.triggerEvent('equip', { equip });
      this.updateList(equip);
    },
    onShowEditDlg() {
      const { part, equip } = this.data;
      const list = equipStore.getList(part);
      const editIndex = list.findIndex(item => item.id === equip.id);
      if(this.data.equip)this.setData({ showEditDlg: true, editIndex });
    },
    showNewEquipDlg(){
      this.setData({ showNewEquipDlg: true });
    },
    onShowImportDlg() {
      this.setData({ showImportDlg: true });
    },
    onEditEquip(e) {
      const { equip } = e.detail;
      const { editIndex } = this.data;
      if(!equip) return;
      if(editIndex>=0) equipStore.setEquip(editIndex, equip);
      this.triggerEvent('equip', { equip });
      this.setData({ showEditDlg: false},()=>this.updateList(equip));
    },
    // 响应选择新装备事件
    onNewEquip(e) {
      const newEquip = Equipment.generateEquipment(e.detail.name, e.detail.part, 'SSR', 15);
      const equip = equipStore.addEquip(newEquip);
      if(typeof equip === 'string') {
        wx.showToast({ title: equip, icon: 'none' });
        return;
      }
      this.setData({ showNewEquipDlg: false }, ()=> {
        this.updateShowEquips(equip);
        this.triggerEvent('equip', { equip })
      });
    },
    onLoadEquips(e) {
      const equips = e.detail.equips;
      equipStore.addEquips(equips);
      const equip = equips[equips.length-1]
      this.setData({ showNewEquipDlg: false }, ()=> {
        this.updateShowEquips(equip);
        this.triggerEvent('equip', { equip });
      });
    },
    onDelete() {
      const {equip, showIndex} = this.data;
      if(!equip || showIndex<0) return;
      const idx = equipStore.findIndex(equip, true);
      if(idx<0) return;
      const self = this;
      wx.showModal({
        title: '提示',
        content: '确定删除指定遗器吗？',
        success (res) {
          if (res.confirm) {
            self.deleteEquip(idx);
          }
        }
      });
    },
    // 删除装备
    deleteEquip(idx) {
      const { part } = this.data;
      equipStore.removeEquip(part, idx);
      this.updateShowEquips(null);
    },
    // 导出遗器库
    onExportAll() {
      const text = equipStore.exportAll();
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
          });
        },
      });
    },
    // 导入遗器库
    onImportAll() {
      wx.showLoading({title:'正在导入'})
      wx.getClipboardData({
        success: (res) => {
          if(typeof res.data !== 'string') {
            wx.showToast({title: '读取失败', icon: 'error'});
            return;
          }
          this.setData({ showImportDlg: false})
          if(res.data[0]==='{') {
            try {
              const json = JSON.parse(res.data);
              if(json.characters) {
                this.onImportHsrScanner(json);
              } else {
                this.onImportYas(json);
              }
            } catch(e) {
              wx.showToast({title: '剪贴板读取失败', icon: 'error'});
            }
          } else {
            this.onImportText(res.data);
          }
          wx.hideLoading();
        },
        fail:() => {
          wx.showToast({title: '读取失败', icon: 'error'});
          wx.hideLoading();
        }
      });
    },
    // 从JSON文件导入(yas)
    onImportJson() {
      getJsonFile( json => {
        if(json.characters) {
          this.onImportHsrScanner(json);
        } else {
          this.onImportYas(json);
        }
      });
    },
    onImportText(text) {
      const isOk = equipStore.importAll(text);
      this.updateShowEquips(this.data.equip);
      wx.showToast({
        title: isOk? '已完成导入': '导入失败',
        icon: isOk? 'success': 'error'
      });
    },
    onImportYas(json) {
      const equips = getYasEquips(json, 0);
      if(typeof equips === 'string') {
        wx.showToast({ title: equips, icon: 'none' });
        return;
      }
      let count = 0;
      for(let part in equips) {
        count += equipStore.overwriteEquips(equips[part], part);
      }
      wx.showModal({
        title: '导入成功',
        content: `本次共导入了${count}件遗器`,
        showCancel: false,
        success:() => {
          this.setData({ showImportDlg: false}, () => this.updateShowEquips(this.data.equip));
        }
      })
    },
    onImportHsrScanner(json) {
      const result = getHsrScannerData(json);
      if(typeof result === 'string') {
        wx.showToast({ title: result, icon: 'none' });
        return;
      }
      const { equips, characters } = result;
      let count = 0;
      for(let part in equips) {
        count += equipStore.overwriteEquips(equips[part], part);
      }
      characters.forEach((char) => getApp().saveCharacter(char.name, 'JSON导入配置', char));
      wx.showModal({
        title: '导入成功',
        content: `本次共导入了${count}件遗器，${characters.length}个角色`,
        showCancel: false,
        success:() => {
          this.setData({ showImportDlg: false}, () => this.updateShowEquips(this.data.equip));
        }
      })
    },
    // 清空相同遗器
    onCleanSame() {
      const { partList } = this.data;
      for(let i=0; i<partList.length; i++) {
        for(let j=0; j<partList[i].length; j++) {
          equipStore.cleanSameEquips(partList[i][j]);
        }
      }
      this.setData({ showImportDlg: false}, () => this.updateShowEquips(this.data.equip))
    },
  },
  lifetimes: {
    detached() {
      if(this.ctx) this.ctx.destroy();
      this.ctx = null;
    },
    ready() {
      if(this.ctx) return;
      this.ctx = createRecycleContext({
        id: 'equipShowList',
        dataKey: 'equipShowList',
        page: this,
        itemSize: {
          width: 75 * wx.getSystemInfoSync().windowWidth/750,
          height: 75 * wx.getSystemInfoSync().windowWidth/750,
        },
      })
      const { part } = this.data;
      this.updatePart(part);
    },
  },
})