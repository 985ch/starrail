const { formatReport } = require('../../simulator/reporter');
Component({
  properties: {
    character: {
      type: String,
      value: '',
    },
    enemy: {
      type: Object,
      value: null,
    },
    tid: { type: Number, value: 0 },
    cid: { type: Number, value: 1 },
  },
  data: {
    labelText: {
      damage: '伤害数据',
      action: '行动数据',
      energy: '能量数据',
      live: '生存数据',
    },
    total: {
      damage: 0,
      action: 0,
      energy: 0,
    },
    sort: ['damage', 'energy', 'action', 'live'],
    report: {
      damage: { list: [] },
      action: { list: [] },
      live: { list: [] },
    },
  },
  methods: {
    clearTotal(e) {
      const type = e.currentTarget.dataset.type;
      this.setData({
        ['total.'+ type]: 0,
      });
    },
    onTapNumber(e) {
      const type = e.currentTarget.dataset.type;
      const value = e.detail.value;
      const total = this.data.total[type];
      this.setData({
        ['total.'+ type]: total + value,
      });
    },
    updateData(name) {
      const team = getApp().team(this.data.tid);
      if(!team)return;
      name = name || this.data.character;
      const member = team.getMember(name);
      if(!member) return;
      const backMember = getApp().team(this.data.cid).getMember(name);
      const raw = member.getReportData();
      const backList = backMember? backMember.getReportData().reportList : [];
      const data = formatReport(raw, backList);
      this.setData(data);
    },
  },
  observers: {
    'character,enemy,tid,cid': function (name) {
      this.updateData(name);
    }
  }
})
