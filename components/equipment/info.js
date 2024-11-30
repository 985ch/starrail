const D = require('../../simulator/data');
const { pick } = require('../../utils/util');
const partListFull = [ ['head', 'hand', 'link'], ['body', 'foot', 'ball']];
const partListSimple = [ ['head', 'hand', 'body', 'foot'], ['link', 'ball']];

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

    },
    mode: {
      type: String,
      value: 'full',  // 'data','simple'
      observer: function (newVal, oldVal) {
        if (newVal!==oldVal) {
          this.setData({ partList: newVal==='full'? partListFull: partListSimple })
        }
      }
    },
    showWordCount: { // 显示副词条数量及排行
      type: Boolean,
      value: false
    },
  },
  data: {
    attributeText: D.AttributeText,
    extText: {atk:'小', def:'小', hp:'小'},
    partList: partListFull,
    partList2: ['头部','手部','身体','腿部','连结绳','位面球'],
    attrKeys: [
      'hp', 'atk', 'def', 'speed',
      'criRate', 'criDamage', 'bonusFire', 'breakRate',
      'enRate', 'healRate', 'hit', 'dodge'
    ],
    equipJson: {}, // 遗器数据
    attrRank: [], // 词条排行
    setDesc: [], // 套装描述
    setDescFull: [], // 套装完整描述
    attr: null, // 遗器属性
    cAttr: null, // 对比遗器属性
  },
  methods: {
    updateData(tid, cid) {
      const teams = getApp().team();
      if(!teams[tid]) return;
      const member = teams[tid].members[teams[tid].curMember];
      if(!member)return;
      const equips = member.equip.equipments;

      const { attrKeys, mode, showWordCount } =  this.data;
      let cMember = (cid!==tid && teams[cid])? teams[cid].getCharacter(member.name): null;

      // 补充文本描述
      const setDesc = member.equip.getSetText();
      const setDescFull = member.equip.getSetDesc();
      // 补充词条排行信息
      let attrRank = [];
      if(showWordCount) {
        const attrs = member.equip.getAttrCount();
        if(cMember) {
          const cAttrs = cMember.equip.getAttrCount();
          for(let key in attrs) {
            const item  = attrs[key];
            const cmp = cAttrs[key];
            item.cc = item.count - cmp.count;
          }
        }
        attrRank = Object.values(attrs).sort((a,b)=>b.count-a.count);
      }
      // 计算数据差异
      attrKeys[6] = 'bonus' + member.base.type;
      const attr = (mode!=='simple')? this.getAttrs(member, attrKeys): null;
      const cAttr = (attr && cMember)? this.getAttrs(cMember, attrKeys): null;

      this.setData({ equipJson: equips, setDesc, setDescFull, attrRank, attr, cAttr, attrKeys });
    },
    getAttrs(member, keys) {
      const raw = member.equip.getAttributes();
      const json = pick(raw, keys);
      json.hp += member.baseHp * raw.hpRate * 0.01;
      json.atk += member.baseAtk * raw.atkRate * 0.01;
      json.def += member.baseDef * raw.defRate * 0.01;
      json.speed += member.baseSpeed * raw.speedRate * 0.01;
      return json;
    }
  },
  observers: {
    'tid,cid,curMember': function(tid, cid) {
      this.updateData(tid, cid);
    }
  }
})