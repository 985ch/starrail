const equipStore = require('../../simulator/equip_store');
const { clone } = require('../../utils/util');

let showedTip = false;

Component({
  properties: {
    tid: {
      type: Number,
      value: 0
    },
    cid: {
      type: Number,
      value: 0
    },
    part: {
      type: String,
      value: 'head',
    },
    curMember: {
      type: Number,
      value: 0
    }
  },
  data: {
    setList: [], // 遗器组合列表
    charName: '虎克', // 角色名称
    equip: null, // 当前遗器
    showStore: true, // 是否显示遗器库
    showAiDlg: false, // 是否显示智能配装对话框
  },
  methods: {
    onShowAd() {
      this.triggerEvent('showAd', {});
    },
    onPartChange(e) {
      this.triggerEvent('partChange', e.detail);
    },
    onEquipChange(e) {
      const { equip, isStore } = e.detail;
      this.setData( { equip })
      this.setup([equip], [], isStore)
    },
    switchStore() {
      this.setData( { showStore: !this.data.showStore })
    },
    showAiDlg() {
      if(!showedTip) {
        showedTip = true;
        wx.showModal({
          title: '提示',
          content: '在配装之前，请确定已经选好了正确的队友，敌人，光锥和增益。',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              this.setData( { showAiDlg: true })
            }
          }
        })
      } else {
        this.setData( { showAiDlg: true })
      }
    },
    clearList() {
      const member = this.getMember();
      if(!member) return;
      const list = getApp().globalData.equipSets[member.name];
      if(!list || list.length == 0) return;
      wx.showModal({
        title: '提示',
        content: '是否清空当前角色的所有配装方案？',
        success: (res) => {
          if (res.confirm) {
            getApp().globalData.equipSets[member.name] = [];
            this.setData( { setList: [] })
          }
        }
      })
    },
    addEquips() {
      const member = this.getMember();
      if(!member) return;
      const list = getApp().globalData.equipSets[member.name] || [];
      list.unshift({ equips: clone(member.equip.equipments), buffs:[], title:'手选配置'});
      getApp().globalData.equipSets[member.name] = list;
      this.setData({ setList: list });
    },
    onAiSelect(e) {
      //console.log(e.detail.list);
      const { charName } = this.data;
      const list = getApp().globalData.equipSets[charName] || [];
      list.push(...e.detail.list.map((itm, i)=>{
        return { equips: itm.equips, buffs: itm.buffs, title: i===0?'最佳配置':`较好配置(${i+1})`}
      }));
      getApp().globalData.equipSets[charName] = list;
      this.setData({ setList: list });
    },
    onDeleteSet(e) {
      const member = this.getMember();
      if(!member) return;
      getApp().globalData.equipSets[member.name].splice(e.currentTarget.dataset.idx, 1);
      this.setData({ setList: getApp().globalData.equipSets[member.name] });
    },
    onSelectSet(e) {
      const member = this.getMember();
      if(!member) return;
      const { idx } = e.currentTarget.dataset;
      const data = getApp().globalData.equipSets[member.name][idx];
      this.setup(Object.values(data.equips), data.buffs, false);
    },
    getMember() {
      const { tid, curMember } = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      return team.members[curMember];
    },
    setup(equips, buffs, isStore) {
      const { tid, cid, curMember } = this.data;
      const teams = getApp().team();
      if(!teams[tid]) return;
      const member = teams[tid].members[curMember];
      if(!member) return;
      // 更新装备并视情况同步到后台
      const cMember = isStore? teams[cid].getCharacter(member.name): null;
      equips.forEach(e=> {
        member.equip.setEquipment(e);
        if(cMember && equipStore.checkSame(cMember.equip.equipments[e.part], e)) {
          cMember.equip.setEquipment(e);
        }
      });
      // 更新装备数据并全队重置数据
      member.equip.updateData();
      teams[tid].reset(false);
      // 同步buff并处理
      const buffManager = teams[tid].buffManager;
      buffManager.fromJSON(teams[cid].buffManager.toJSON());
      const enemy = member.getEnemy();
      buffs.forEach(buff=>{
        const target = ['enemy','enemies'].includes(buff.target)? enemy : member;
        this.setBuff(member, target, buff.key, buff.value);
      });
      this.triggerEvent('update', {});
    },
    setBuff(member, target, key, value) {
      const buff = target.findBuff({key: key});
      if(buff) {
        buff.value = value;
      } else {
        member.addBuff(key, target, value, null, false);
      }
    },
    confirmEquips() {
      const { tid, cid } = this.data;
      const teams = getApp().team();
      if(!teams[tid]) return;
      teams[cid].fromJSON(teams[tid].toJSON());
      teams[cid].reset(false);
      teams[cid].updateData(true);
      this.triggerEvent('update', {});
    },
    updateData(tid, part, mid) {
      const team = getApp().team(tid);
      if(!team) return;
      const member = team.members[mid];
      if(!member) return;
      const equip = member.equip.equipments[part];
      const setList = getApp().globalData.equipSets[member.name] || [];
      //console.log(setList)
      this.setData( {equip, setList, charName: member.name,} );
    },
  },
  observers: {
    'tid,part,curMember': function(tid, part, curMember) {
      this.updateData(tid, part, curMember);
    }
  }
})