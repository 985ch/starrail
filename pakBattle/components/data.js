const { getImage } = require("../../utils/imgset");

// components/battle/data.js
const dmgKeys = [
  ['普攻', 'na', 1],
  ['战技', 'ns', 1],
  ['终结技', 'us', 1],
  ['追击', 'aa', 0],
  ['持续伤害', 'dot', 0],
  ['击破伤害', 'brk', 0],
  ['附加伤害', 'ad', 0],
  ['其他伤害', 'etc', 0],
]
function getData(member, round) {
  const rn = Math.max(1, round.round + (round.t/(round.round===0? 150: 100)));
  const ms = member? member.state: {};
  const ss = ms.statistics || {};
  const data = {
    round: round.round>0 || round.t>0? rn: 0,
    turn: { d:ms.turn || 0 },
    damaged: { c:ss.atkedC || 0, d:ms.damaged || 0},
    healed: { c:ss.healedC || 0,  d:ss.healed || 0 },
    heal:{ c: ss.healC || 0, d: ss.heal || 0 },
    enGet: { d: ss.enGet || 0 },
  };
  const dmg = {c:0, d:0, e:0};
  dmgKeys.forEach(arr => {
    const key = arr[1];
    const d = { c: ss[key+'C'] || 0, d: ss[key+'D'] || 0, e: ss[key+'E'] || 0 };
    dmg.c += d.c;
    dmg.d += d.d;
    dmg.e += d.e;
    data[key] = d;
  });
  data.dmg = dmg;
  for(let k in data) {
    if(k==='round') continue;
    for(let kk in data[k]) {
      data[k][kk+'r'] = data[k][kk]/rn;
    }
  }
  return data;
}
function fillData(sc, sb) {
  for(let k in sc) {
    if(k==='round') continue;
    const data = sc[k];
    const dataB = sb[k];
    for(let kk in data) {
      data[kk+'c'] = data[kk] - dataB[kk];
    }
  }
  return sc;
}
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    member: {
      type: String,
      value: '',
    },
  },
  data: {
    curMember: '', // 当前选择的角色
    team: 1, // 比较的队伍
    idx: 0, // 比较目标的位置
    members: [[],[]], // 角色列表
    round: { round: 0, t: 0},
    list: [],
    showTotal: true,
    images: {},
  },
  methods: {
    onSwitchData(){
      this.setData({ showTotal:!this.data.showTotal });
    },
    updateMembers(){
      const teams = getApp().team();
      const members = [[],[]];
      const { images } = this.data;
      for(let i=0; i<2; i++) {
        members[i] = teams[i].members.filter(m => m).map(m => {
          if(!images[m.base.name]) {
            images[m.base.name] = getImage('char/'+m.base.image, (file)=> this.setData({ ["images."+m.base.name]: file }));
          }
          return {
            name: m.base.name,
            rarity: m.base.rarity,
          }
        });
      }
      const team = (members[1].length === 0)? 0: this.data.team;
      let idx = Math.max(0, members[1].findIndex(m => m.name === this.data.curMember));
      this.setData({ team, idx, images, members }, ()=> this.updateData());
    },
    onSelectMember(e) {
      this.setData({ curMember: e.currentTarget.dataset.value }, ()=> this.updateData())
    },
    onSelectTarget(e) {
      this.setData(e.currentTarget.dataset, ()=> this.updateData())
    },
    updateData(member) {
      member = member || this.data.curMember;
      let tid = this.data.team;
      const teams = getApp().team();
      let cmpTeam = teams[tid];
      const m = teams[0].getMember(member);
      let mc = cmpTeam.members[this.data.idx];
      if(!mc) {
        cmpTeam = teams[0];
        mc = m;
        tid = 0;
      }
      const round = teams[0].getRound();
      const s = getData(m, round);
      const sc = getData(mc, cmpTeam.getRound());
      const data = fillData(s, sc);
      const list = [
        { label: '伤害汇总', dt:[
          ['总伤害', data.dmg.d, data.dmg.dc],['总期望', data.dmg.e, data.dmg.ec]
        ], dr:[
          ['轮均伤害', data.dmg.dr, data.dmg.drc], ['轮均期望', data.dmg.er, data.dmg.erc]
        ]},
        { label: '行动和能量', percent:true, dt:[
          ['回合数', data.turn.d, data.turn.dc], ['总回能', data.enGet.d, data.enGet.dc]
        ], dr:[
          ['轮均回合', data.turn.dr, data.turn.drc], ['轮均回能', data.enGet.dr, data.enGet.drc]
        ]},
        ...dmgKeys.map(arr => {
          const val = data[arr[1]];
          return { label: arr[0],
            p:((val.d || 0)/(data.dmg.d || 1)*100).toFixed(2)+'%',
            ct:[val.c, val.cc], cr:[val.cr, val.crc],
            dt:[
              ['总伤害', val.d, val.dc],['总期望', val.e, val.ec]
            ], dr:[
              ['轮均伤害', val.dr, val.drc], ['轮均期望', val.er, val.erc]
            ]
          }
        }),
        { label: '产生治疗', ct:[data.heal.c, data.heal.cc], cr:[data.heal.cr, data.heal.crc],
        dt:[['总治疗', data.heal.d, data.heal.dc]],dr:[['轮均治疗', data.heal.dr, data.heal.drc]]},
        { label: '承受伤害', ct:[data.damaged.c, data.damaged.cc], cr:[data.damaged.cr, data.damaged.crc],
        dt:[['总承伤', data.damaged.d, data.damaged.dc]],dr:[['轮均承伤', data.damaged.dr, data.damaged.drc]]},
        { label: '受到治疗', ct:[data.healed.c, data.healed.cc], cr:[data.healed.cr, data.healed.crc],
        dt:[['总治疗', data.healed.d, data.healed.dc]],dr:[['轮均治疗', data.healed.dr, data.healed.drc]]},
      ]
      this.setData({ round, list, team: tid });
    },
  },
  observers: {
    member(name) {
      this.setData({ curMember: name }, ()=> this.updateMembers());
    }
  },
})