Component({
  properties: {
    tid: {
      type: Number,
      value: 0,
    },
    curMember: {
      type: Number,
      value: 0,
    },
    enemyIdx: {
      type: Number,
      value: 0,
    },
  },
  data: {
    list: [[],[]],
    info: [{},{}],
  },
  methods: {
    onBtnTap(e) {
      const { idx, index } = e.currentTarget.dataset;
      const { list, tid, curMember, enemyIdx } = this.data;
      const info = list[idx][index];
      if(info.max===0) return;
      const team = getApp().team(tid);
      const unit = idx===0? team.members[curMember]: team.enemies[enemyIdx];
      if(info.max===info.value) {
        const target = ['enemies', 'members'].includes(info.target)? info.target : unit.name;
        unit.removeBuff(unit.findBuff({key: info.key, target: target}), false);
      } else {
        unit.addBuff(info.key, unit, 1, null, false);
      }
      this.triggerEvent('update');
    },
    changeValue(e) {
      const value = e.detail.value;
      const { idx, index } = e.currentTarget.dataset;
      const { list, tid, curMember, enemyIdx } = this.data;
      const info = list[idx][index];
      const team = getApp().team(tid);
      const unit = idx===0? team.members[curMember]: team.enemies[enemyIdx];
      const target = ['enemies', 'members'].includes(info.target)? info.target : unit.name;
      const buff = unit.findBuff({key: info.key, target: target})
      if(value === 0) {
        if(buff)unit.removeBuff( buff, false);
      } else if(buff) {
        buff.value = value;
      } else {
        unit.addBuff(info.key, unit, value, null, false);
      }
      this.triggerEvent('update');
    },
    updateData(tid, mid, eid) {
      const team = getApp().team(tid);
      if(!team) return;
      const member = team.members[mid];
      const enemy = team.enemies[eid];
      if(!member || !enemy) return;

      const info = [
        {name: member.name, rarity: member.base.rarity},
        {name: enemy.name, rarity: enemy.shield>=8?'SSR':(enemy.shield<3?'R':'SR')},
      ];

      const list = [];
      [member, enemy].forEach(unit=>{
        const buffList = unit.getBuffListForSelf().sort((a,b)=>(b.character===unit?1:0)-(a.character===unit?1:0));
        const buffs = unit.filterBuffs({ target: [unit.name, unit.faction ], show: true }).reduce((obj, buff)=>{
          obj[buff.key] = buff;
          return obj;
        }, {});
        list.push(buffList.map(obj=>{
          const buff = buffs[obj.key];
          const info = obj.buffClass.info(obj.data, obj.character);
          const name = obj.character.name; 
          return {
            key: obj.key,
            name: `[${name}][${obj.source}]${obj.name}`,
            max: info.maxValue,
            target: info.target,
            value: buff ? buff.value : 0,
            desc: buff ? buff.getDesc(unit, enemy) + buff.getTurnText() : info.desc,
            type: info.tags.includes('buff')? 'buff': (info.tags.includes('debuff')? 'debuff': 'other'),
            activated: (info.maxValue>0 && buff) || (info.maxValue===0 && buff.isActivated(enemy, member)) ? true : false,
          }
        }));
      })

      this.setData({ info, list })
    }
  },
  observers: {
    'tid,curMember,enemyIdx': function (tid, curMember, enemyIdx) {
      this.updateData(tid, curMember, enemyIdx);
    }
  }
})