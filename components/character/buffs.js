const styles = ['black', 'orange', 'blue', 'red', 'green'];
Component({
  properties: {
    member: {
      type: String,
      value: '',
    },
    enemy: {
      type: String,
      value: '',
    },
    tid: {
      type: Number,
      value: 0
    },
    limit: {
      type: Number,
      value: 8
    },
    mode: {
      type: String,
      value: 'both'
    }
  },
  data: {
    list:[],
  },
  methods: {
    fillBuffList(list, unit, enemy, memberIdx, limit) {
      if(!unit) return;
      const buffs = unit.filterBuffs({
        unit: [unit.name, unit.faction ],
        show: true,
      });
      for(let i=0; i < limit && i<buffs.length; i++) {
        const obj = buffs[i]
        const info = obj.getInfo();
        const isEnemy = info.target==='enemy' || info.target==='enemies' || (info.target==='self' && obj.member.faction==='enemies');
        if(info.maxValue>0 || (info.maxValue===0 && obj.isActivated(enemy, unit))) list.push({
          text: info.short,
          style: styles[memberIdx[obj.member.name] || 0] + (isEnemy?'E': ''),
          maxValue: info.maxValue,
          value: obj.value,
        });
      }
      if(buffs.length>limit) {
        list.push({ text:'+'+(buffs.length-limit), style:'gray', maxValue: 0, value: 1 });
      }
    }
  },
  observers: {
    "member,enemy,mode": function(member, enemy, mode){
      if(member==='' || enemy==='') return;
      const team = getApp().team(this.data.tid);
      const memberIdx = {};
      team.members.forEach((m, i) => m && (memberIdx[m.name] = i+1));
      const limit = this.data.limit;
      const list = [];
      const m = team.getCharacter(member);
      const e = team.getCharacter(enemy);
      if(mode!=='enemy') this.fillBuffList(list, m, e, memberIdx, limit);
      if(list.length < limit && mode!=='member') {
        this.fillBuffList(list, e, m, memberIdx, limit - list.length);
      }
      this.setData({list});
    }
  }
})
