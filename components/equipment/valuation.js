const D = require('../../simulator/data');
const { parseEquips } = require('../../simulator/equip_bestword');

function shortAttr(key) {
  return D.AttributeText[key].short2 || D.AttributeText[key].short;
}

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
    curMember: {
      type: Number,
      value: 0
    }
  },
  data: {
    charName: '虎克', // 角色名称
    showWordDlg: false,
    subAttrs: [
      'atk', 'hp', 'def',
      'atkRate','hpRate','defRate',
      'criRate', 'criDamage', 'speed',
      'breakRate', 'hit', 'dodge',
    ].map(k => [shortAttr(k), k]), // 额外词条及文本
    bonusAttr: {}, // 额外词条
    curSel: 0, // 当前选中结果
    results: [], // 结果列表
  },
  methods: {
    onShowAd() {
      this.triggerEvent('showAd', {});
    },
    onEvaluate() {
      this.setData({showWordDlg: true})
    },
    onBestWords(e) {
      const newResults = e.detail.results;
      const results = newResults.concat(this.data.results);
      getApp().globalData.equipWords[this.data.charName] = results;
      this.setData({results, curSel: 0})
    },
    onSelResult(e) {
      const { index } = e.currentTarget.dataset;
      this.setData({curSel: index})
    },
    onRemoveSet(e) {
      const { member } = this.getMember();
      if(!member) return;
      const { index } = e.currentTarget.dataset;
      const { curSel } = this.data;
      const sel = index > curSel? curSel: Math.max(0, curSel-1);
      getApp().globalData.equipWords[member.name].splice(index, 1);
      this.setData({ results: getApp().globalData.equipWords[member.name], curSel: sel });
    },
    onTrySet(e) {
      const { member } = this.getMember();
      if(!member) return;
      const { index } = e.currentTarget.dataset;
      const data = getApp().globalData.equipWords[member.name][index];
      this.setup(parseEquips(data), data.buffs);
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
    updateData(tid, mid) {
      const team = getApp().team(tid);
      if(!team) return;
      const member = team.members[mid];
      if(!member) return;
      const results = getApp().globalData.equipWords[member.name] || [];
      this.setData( { results, charName: member.name,} );
    },
    getMember() {
      const { cid, tid, curMember } = this.data;
      const teams = getApp().team();
      const team = teams[tid];
      return { member: team.members[curMember], team, backTeam:teams[cid]};
    },
    onResetAttr() {
      this.changeAttrs({});
    },
    onMinus(e) {
      const { key } = e.currentTarget.dataset;
      const { bonusAttr } = this.data;
      bonusAttr[key] = (bonusAttr[key] || 0) - 1;
      this.changeAttrs(bonusAttr);
    },
    onPlus(e) {
      const { key } = e.currentTarget.dataset;
      const { bonusAttr } = this.data;
      bonusAttr[key] = (bonusAttr[key] || 0) + 1;
      this.changeAttrs(bonusAttr);
    },
    onEdit(e) {
      const { key } = e.currentTarget.dataset;
      wx.showModal({
        title: '设置额外词条['+shortAttr(key)+']' ,
        content: '',
        editable: true,
        success: (res) => {
          if (res.confirm) {
            const n = parseInt(res.content);
            if(isNaN(n)) {
              wx.showModal({ title: '提示', content: '请输入整数。' });
            } else {
              this.data.bonusAttr[key] = n;
              this.changeAttrs(this.data.bonusAttr);
            }
          }
        },
      });
    },
    changeAttrs(bonusAttr) {
      const { member, team } = this.getMember();
      member.equip.setBonusCount(bonusAttr);
      member.equip.updateData();
      team.reset(false);
      this.triggerEvent('update', {});
      this.setData({ bonusAttr });
    },
    setup(equips, buffs) {
      const { member, team, backTeam } = this.getMember();
      // 更新装备
      equips.forEach(e=> {
        member.equip.setEquipment(e);
      });
      // 更新装备数据并全队重置数据
      member.equip.updateData();
      team.reset(false);
      // 同步buff并处理
      const buffManager = team.buffManager;
      buffManager.fromJSON(backTeam.buffManager.toJSON());
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
  },
  observers: {
    'tid,curMember': function(tid, curMember) {
      this.updateData(tid, curMember);
    }
  }
})