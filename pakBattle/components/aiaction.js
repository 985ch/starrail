const { ruleFunc, params_target }=require('../simulator/ai_rule');
Component({
  properties: {
    action: {
      type: String,
      value: 'na',
    },
    type: {
      type: String,
      value: 'target',
    },
    values: {
      type: Array,
      value: []
    },
    member: {
      type: String,
      value: '虎克',
    },
    buffList: {
      type: Array,
      value: [[],[]],
    },
    memberList: {
      type: Array,
      value: ['虎克'],
    }
  },
  data: {
    label: '目标',
    tip: '',
    tarType: 'self',
    list:[],
    buffs:[],
    members: [],
  },
  methods: {
    onValueChanged(e) {
      const { values } = this.data;
      const idx = e.currentTarget.dataset.index;
      const value = e.detail.value;
      if(values[idx] === value) return;
      values[idx] = value;
      this.triggerEvent('change', { values });
    },
    onRemoveCondition() {
      this.triggerEvent('remove', {});
    },
    fixValues(values) {
      const { list } = this.data; 
      let needFix = false;
      for(let i = 0; i < list.length; i++) {
        if(this.fixValue(list[i], values, i)) {
          needFix = true;
        }
      }
      if(needFix) this.triggerEvent('change', { values });
    },
    fixValue(item, values, idx) {
      const { buffs, buffList, members, member} = this.data;
      const val = values[idx];
      const needPush = values.length <= idx;
      const type = item.type || 'enum';
      switch(type) {
        case 'buffTag':
          if(needPush || !item.values.find(obj=>obj.data.find(o => o.name===val || o===val))){
            values[idx] = item.default;
            return true;
          }
          break;
        case 'list':
        case 'enum':
          if(needPush || !item.values.find(a => a[0] === val)) {
            values[idx] = item.default;
            return true;
          }
          break;
        case 'number':
          if(needPush || val<item.values[0] || val>item.values[1]) {
            values[idx] = item.default;
            return true;
          }
          break;
        case 'buffKey':
          if(needPush || !buffs.find(a => a[0] === val)) {
            values[idx] = buffs[0][0];
            return true;
          }
          break;
        case 'buffSelf':
          if(needPush || !buffList[0].find(a => a[0] === val)) {
            values[idx] = buffList[0][0][0];
            return true;
          }
          break;
        case 'member':
          if(needPush || !members.find(a => a[0] === val)) {
            values[idx] = (members[0][0]==='t')? 't': member;
            return true;
          }
          break;
        default:
          throw new Error('未知数据类型：'+item.type);
      }
      return false;
    },
  },
  observers: {
    "action,type,values,member,buffList,memberList": function (action, type, values, member, buffList, memberList) {
      const team = getApp().team(0);
      const m = team.getMember(member);
      if(!m)return;
      const info = m.base;
      const tarType = info[action+'Target'] || 'enemy';
      const isTarget = type==='target';
      let list,label,tip;
      if(isTarget) {
        list = params_target(values, tarType);
        label = '选择目标';
        tip = '无符合条件的目标时选当前目标'
      } else {
        const rule = (info.aiRule && info.aiRule[type]) || ruleFunc[type];
        list = rule.params(values);
        label = rule.name;
        tip = rule.tip || '-';
      }
      const idx = ['enemy','enemies'].includes(tarType)? 1: 0;
      this.setData({
        label,
        tip,
        tarType,
        list,
        buffs: buffList[idx],
        members: memberList[isTarget? 2: idx],
      },()=>{
        this.fixValues(values)
      });
    }
  }
})