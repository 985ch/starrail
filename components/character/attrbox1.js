const { AttributeText }=require('../../simulator/data');
Component({
  properties: {
    grey: {
      type: Boolean,
      value: false,
    },
    attr: {
      type: String,
      value: '',
    },
    addAttr: {
      type: String,
      optionalTypes: [null],
      value: '',
    },
    base: {
      type: String,
      value: '',
    },
    name: {
      type: String,
      value: '',
    },
    staticData: {
      type: Boolean,
      value: false,
    },
    tid: { // 当前队伍ID
      type: Number,
      value: 0,
    },
    cid: { // 比较队伍ID
      type: Number,
      value: 1,
    },
    mini: { type: Boolean, value: false },
  },
  lifetimes: {
  },
  data: {
    label: '',
    value: 0,
    baseValue: 0,
    compare: 0,
    stronger: false,
  },
  methods: {
    updateData() {
      const { name, attr, addAttr, base, staticData, tid, cid } = this.data;
      if(!name)return;

      const teams = getApp().team();
      const member = teams[tid].getMember(name);
      if(!member) return;

      const srcData = staticData ? member.staticAttr.data : member.attr.data;
      const backMember = teams[cid].getMember(name);
      const tarData = backMember ? (staticData ? backMember.staticAttr.data : backMember.attr.data ) : null;
      const label = AttributeText[attr].text;
      const isBase = (base !== '');
      let stronger = false;
      if(AttributeText[attr].type !== 'percent'){
        const baseValue = isBase ? Math.floor(member[base]) : 0;
        const value = Math.floor(srcData[attr] + (addAttr? srcData[addAttr] : 0));
        let compare = 0;
        if(tarData) {
          compare = value - Math.floor(tarData[attr] + (addAttr? tarData[addAttr] : 0));
          stronger = compare > 0;
        }
        this.setData({ label, value, baseValue, compare, stronger });
      } else { // percent
        const val = srcData[attr] + (addAttr? srcData[addAttr] : 0);
        const value = fix(val) + '%';
        let compare = 0;
        if(backMember) {
          let changed = val - tarData[attr] - (addAttr? tarData[addAttr] : 0);
          if(Math.abs(changed)<0.01) changed = 0;
          stronger = changed > 0;
          compare = changed !== 0 ? fix(changed) + '%': ''; 
        }
        this.setData({ label, value, compare, stronger });
      }
    }
  },
  observers: {
    ['name,staticData,tid,cid']:function() {
      this.updateData();
    }
  }
})

function fix(num) {
  return (Math.floor(num*10)*0.1).toFixed(1);
}