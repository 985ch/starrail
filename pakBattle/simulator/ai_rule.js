'use strict';

const buffTags = [{
  text: '泛用',
  data: [
    {name:'增益状态', value: 'buff'},
    {name:'持有护盾', value: 'shield' },
    {name:'持续治疗', value: 'HOT'},
    {name:'负面状态', value: 'debuff'},
    {name:'持续伤害', value: 'dot'},
    {name:'控制效果', value: ['freeze', '减速']},
    {name:'护甲击破', value: '破韧'},
  ]
},{
  text: '属性效果',
  data: [ '灼烧', '触电', '风化', '裂伤', '冻结', '禁锢', '纠缠' ]
},{
  text: '弱点',
  data: [
    {name:'弱火', value:'weakFire'},
    {name:'弱冰', value:'weakIce'},
    {name:'弱风', value:'weakWind'},
    {name:'弱雷', value:'weakThunder'},
    {name:'弱风', value:'weakWind'},
    {name:'弱物理', value:'weakPhysical'},
    {name:'弱虚数', value:'weakVoid'},
    {name:'弱量子', value:'weakQuantum'},
  ],
},{
  text: '属性降低',
  data: [
    {name:'防御下降', value:'减防'},
    {name:'速度下降', value:'减速'},
    {name:'抗性下降', value:'全抗性下降'},
    '火抗降低', '冰抗降低', '雷抗降低', '风抗降低', '物理抗降低', '虚数抗降低', '量子抗降低'
  ],
}];

const conditions = {
  comm_numA: {
    label: '数量',
    type: 'number',
    default: 0,
    values: [ 0, 10],
  },
  comm_numB: {
    label: '数值',
    type: 'number',
    default: 50,
    values: [ 0, 100],
  },
  comm_numC: {
    label: '层数',
    type: 'number',
    default: 0,
    values: [ 0, 99],
  },
  comm_numType: {
    label: '数值类型',
    default: 'percent',
    values: [['percent','百分比'], ['absolute','绝对值']],
  },
  comm_cmp: {
    label: '比较方式',
    default: 'gt',
    values: [['gt', '大于'], ['lt', '小于'], ['eq', '等于']],
  },
  comm_cmpPlus: {
    label: '比较方式',
    default: 'gt',
    values: [['gt', '大于'], ['lt', '小于'], ['eq', '等于'], ['gtm', '距上限大于'], ['ltm', '距上限小于'], ['eqm', '距上限等于']],
  },
  comm_has:{
    label: '是否持有',
    default: 'yes',
    values: [['yes','持有'], ['no','未持有']],
  },
  comm_limit: {
    label: '极值判断',
    default: 'min',
    values: [['min','绝对值最小'], ['max', '绝对值最大'], ['minp', '百分比最小'], ['maxp', '百分比最大']],
  },
  comm_limitA: {
    label: '极值判断',
    default: 'max',
    values: [['min','当前值最小'], ['max', '当前值最大'], ['minb', '基础值最小'], ['maxp', '基础值最大']],
  },
  tar_type: {
    label: '目标',
    type:'member',
    default: 's',
  },
  tar_enum: {
    label: '目标',
    default: 't',
    values: [['t','目标'], ['s','自身']],
  },
  buff_type:{
    label: '条件类型',
    default: 'key',
    values: [['key','状态名称'], ['tag','状态类型']],
  },
  buff_key:{
    label: '指定状态',
    type:'buffKey',
    default: '无',
  },
  buff_self:{
    label: '指定状态',
    type:'buffSelf',
    default: '无',
  },
  buff_tag:{
    label: '状态类型',
    type: 'buffTag',
    default: '负面状态',
    values: buffTags,
  }
}

const c_qingque_cards = ['0', '1', '1+1', '1+1+1', '2', '2+1', '2+1+1', '2+2', '3+n', '4'];
const ruleFunc = {
  sp:{
    name: '技能点',
    tip: '判断当前剩余技能点数量',
    params:() => [conditions.comm_cmp, conditions.comm_numA],
    check(m, t, p) {
      return compare(m.team.state.sp, p[1], p[0])
    }
  },
  buff:{
    name: '状态',
    tip: '判断对象的当前状态',
    params(values){
      const cd = conditions;
      const list = [cd.tar_type, cd.buff_type];
      if(!values || values[1]==='key') {
        if(!values || values[0]==='t') {
          list.push(cd.buff_key, cd.comm_has)
        } else {
          list.push(cd.buff_self, cd.comm_has)
        }
        if(values[3]==='yes') list.push(cd.comm_numC);
      } else {
        list.push(cd.buff_tag, cd.comm_cmp, cd.comm_numA)
      }
      return list;
    },
    check(m, t, p) {
      const [tar, type] = p;
      return checkTarget(m, t, tar, (target)=>{
        if(type !== 'key') {
          return compare(target.countBuffs({tag: getBuffTags(p[2])}), p[4], p[3]);
        }
        const buff = target.findBuff({key: p[2]});
        if(p[3]==='no') return !buff;
        return buff? buff.value>=(p[4] || 0): false;
      });
    }
  },
  hp: {
    name: '生命值',
    tip: '判断对象的当前生命值',
    params:(values) =>params_number(values, 5000, 999999),
    check(m, t, params) {
      const [tar, type, cmp, value] = params;
      return checkTarget(m, t, tar, (target)=>{
        return comparePlus( target.state.hp, target.getAttr('hp'), value, type, cmp);
      });
    }
  },
  en: {
    name: '能量',
    tip: '判断我方对象的当前能量',
    params:(values) =>params_number(values, 0, 300),
    check(m, t, params) {
      const [tar, type, cmp, value] = params;
      return checkTarget(m, t, tar, (target)=>{
        if(target.faction!=='members') return false;
        return comparePlus( target.state.en, target.base.enMax, value, type, cmp);
      });
    }
  },
  shield: {
    name: '韧性',
    tip: '判断敌方目标的当前韧性',
    params:() => [conditions.comm_cmp, {
      label: '数值',
      type: 'number',
      default: 2,
      values: [ 0, 50],
    }],
    check(m, t, p) {
      if(t!=='enemies' && t.faction!=='enemies') return false;
      return checkTarget(m, t, 't', (target)=>compare(target.state.shield, p[1], p[0])) 
    }
  },
  enCount: {
    name: '敌人数量',
    tip: '判断场上敌人的数量',
    params:(values) =>[conditions.comm_cmp, {
      label: '数值',
      type: 'number',
      default: 1,
      values: [ 1, 5],
    }],
    check(m, t, params) {
      const [cmp, value] = params;
      const enemies = m.team.getAliveUnits('enemies');
      return compare( enemies.length, value, cmp);
    }
  },
  actSeq: {
    name: '行动顺序',
    tip: '判断指定角色的行动顺序',
    params:()=>{
      const cd = conditions;
      return [cd.tar_type, cd.comm_cmp, {
        label: '数值',
        type: 'number',
        default: 1,
        values: [ 0, 10],
      },{
        label: '计算方式',
        default: 'yes',
        values: [['yes', '仅计算我方'],['no', '计算敌我双方']],
      }]
    },
    check(m, t, params) {
      const [tar, cmp, value, all] = params;
      return checkTarget(m, t, tar, (target) => {
        let idx = 0;
        const units = m.team.actionList;
        for(let i=0; i<units.length; i++) {
          const u = units[i];
          if(u === target) return compare(idx, value, cmp);
          if(all==='no' || u.faction!=='members') idx++;
        }
        return false;
      });
    }
  },
  mTurn: {
    name: '回合判断',
    tip: '判断是否在指定目标的回合内',
    params:()=>{
      return [conditions.tar_type, {
        label: '回合状态',
        default: 'ready',
        values:[['ready','回合中未行动'],['acted','回合中已行动'],['in','在其回合中'],['not','不在其回合中']]
      }]
    },
    check(m, t, params) {
      const [tar, type] = params;
      return checkTarget(m, t, tar, (target) => {
        const tTurn = target.checkMyTurn();
        if(type==='not') return !tTurn;
        if(!tTurn) return false;
        if(type==='in') return true;
        const acted = m.team.state.acted;
        return (acted && type==='acted') || (!acted && type==='ready');
      });
    }
  },
  //------以下是角色特有条件-------
  c_ps_comm: charExRuleN('被动层数', '判断角色当前被动层数', [0, 99]),
  c_ns_comm: charExRuleN('战技剩余', '判断角色战技剩余回合数', [0, 99]),
  c_acheronA: charExRuleN('残梦数量', '判断黄泉的残梦数量', [0,9],'残梦'),
  c_acheronB: charExRuleN('四相断我层数', '判断黄泉四相断我当前层数', [0,3],'四相断我'),
  c_bailu: charExRuleN('复活次数', '判断剩余的复活次数', [0, 99]),
  c_clara: charExRuleN('强化反击', '判断剩余的强化反击次数', [0, 99]),
  c_danheng_yy: charExRuleN('逆鳞数量', '判断饮月当前的逆鳞数量', [0, 99]),
  c_fuxuanN: charExRuleN('穷观阵剩余', '判断穷观阵剩余回合数', [0, 99], 'ns'),
  c_fuxuanU: charExRuleN('翻转次数', '判断符玄的翻转次数', [0, 99], 'us'),
  c_hanya: charExRuleN('承负剩余', '判断承负剩余的技能点数', [0, 99]),
  c_hook: charExRuleE('战技状态', '判断虎克的战技是否强化',[['yes','战技已强化'],['no','战技未强化']]),
  c_huohuoC: charExRuleN('攘命回合数', '判断攘命的剩余回合数', [0, 99], 'count'),
  c_huohuoD: charExRuleN('净化次数', '判断藿藿的净化剩余次数', [0, 99], 'dispel'),
  c_misha: charExRuleE('战技状态', '判断米沙的战技是否免战技点',[['yes','免战技点'],['no','耗战技点']]),
  c_qingqueP:{
    name: '当前牌型',
    tip: '判断青雀当前的牌型',
    params:()=> [{
      label: '比较',
      default: 'gt',
      values: [['gt','优于'],['eq','等于'],['lt','劣于']],
    },{
      label: '牌型',
      type: 'list',
      default: '3+n',
      values: [['0'],['1'],['1+1'],['1+1+1'],['2'],['2+1'],['2+1+1'],['2+2'],['3+n'],['4']],
    }],
    check(m, t, p) {
      const text = m.getStateExData('card');
      const idxA = c_qingque_cards.indexOf(text);
      const idxB = c_qingque_cards.indexOf(p[1]);
      return compare(idxA, idxB, p[0]);
    }
  },
  c_qingqueN: charExRuleN('战技层数','判断青雀战技叠加层数',[0,99],'value'),
  c_ratio: charExRuleN('追加追击', '判断追加追击剩余次数', [0,99]),
  c_ruanmeiN: charExRuleN('弦外音', '弦外音剩余回合数', [0,99], 'ns'),
  c_ruanmeiU: charExRuleN('结界回合', '结界剩余回合数', [0,99], 'us'),
  c_seele: charExRuleE('额外回合', '判断希儿是否处于额外回合中',[['yes','额外回合'],['no','普通回合']]),
  c_topaz: charExRuleN('涨幅惊人', '判断涨幅惊人剩余次数', [0,99]),
  c_yukong: charExRuleE('普攻强化', '判断驭空的普攻是否已强化', [['yes','普攻已强化'],['no','普攻未强化']]),
}

// 构造角色泛用的规则对象
function charExRuleN(name, tip, values, key) {
  return {
    name,
    tip,
    params: ()=> [conditions.comm_cmp, {
      label:'数值',
      type:'number',
      default: 1,
      values,
    }],
    check: (m, t, p) => compare(m.getStateExData(key), p[1], p[0]),
  }
}
function charExRuleE(name, tip, values) {
  return {
    name,
    tip,
    params: ()=> [{
      label:'状态',
      type:'enum',
      default: values[0][0],
      values,
    }],
    check: (m, t, p) => m.getStateExData() === p[0],
  }
}

// 优先选择目标构造函数
function params_target(values, tType) {
  const cd = conditions;
  const types = [['selected', '当前选中'],['buff','附有状态'], ['hp', '当前生命'],['atk', '攻击力'],['hpMax','生命上限']]
  if(tType==='member') {
    types.push(['en','当前能量'],['member', '指定成员']);
  } else {
    types.push(['shield','当前韧性']);
  }

  const list = [{
    label: '目标规则',
    default: 'selected',
    values: types,
  }];
  switch(values[0]) {
    case 'buff':
      {
        list.push(cd.buff_type);
        const buffType = values[1] || cd.buff_type.default;
        if(buffType==='key') {
          list.push(cd.buff_key, cd.comm_has)
          if(values[3]==='yes') list.push(cd.comm_numA)
        } else {
          list.push(cd.buff_tag, cd.comm_cmp, cd.comm_numA)
        }
      }
      break;
    case 'hp':
    case 'en':
    case 'shield':
      list.push(cd.comm_limit, cd.comm_cmp, {
        label: '数值',
        type: 'number',
        default: 0,
        values: [ 0, 999999],
      });
      break;
    case 'atk':
    case 'hpMax':
      list.push(cd.comm_limitA, cd.comm_cmp, {
        label: '数值',
        type: 'number',
        default: 0,
        values: [ 0, 999999],
      });
      break;
    case 'member':
      list.push(cd.tar_type);
      break;
    case 'selected':
    default:
      break;
  }
  if(values[0]!=='selected' && tType==='enemy') list.push({
    label: '弱点优先',
    default: 'yes',
    values: [['yes','弱点优先'],['no','弱点无视']]
  });
  return list;
}
// 泛用数值比较构造函数
function params_number(values, defVal, maxVal) {
  const cd = conditions;
  const list = [cd.tar_type, cd.comm_numType];
  if(!values || values[1]==='percent') {
    list.push(cd.comm_cmp, cd.comm_numB)
  } else {
    list.push(cd.comm_cmpPlus, {
      label: '数值',
      type: 'number',
      default: defVal,
      values: [ 0, maxVal],
    })
  }
  return list;
}
// 比较大小
function compare(a, b, cmp){
  switch(cmp) {
    case 'gt': return a > b;
    case 'lt': return a < b;
    case 'eq': return a === b;
    default: return false;
  }
}
// 含最大值的比较大小
function comparePlus(val, valMax, valCmp, type, cmp) {
  if(type==='percent') {
    val = val/valMax*100;
    valMax = 100;
  }
  switch(cmp) {
    case 'gt': return val > valCmp;
    case 'lt': return val < valCmp;
    case 'eq': return val === valCmp;
    case 'gtm': return (valMax - val) > valCmp;
    case 'ltm': return (valMax - val) < valCmp;
    case 'eqm': return (valMax - val) === valCmp;
    default: return false;
  }
}
// 检查目标是否符合条件
function checkTarget(m, t, tar, cb) {
  let targets;
  switch(tar) {
    case 't':
      if(typeof t==='string') {
        targets = m.team.getAliveUnits(t);
      } else {
        targets = [t];
      }
      break;
    case 's':
      targets = [m];
      break;
    default: {
      const target = m.team.getCharacter(tar);
      targets = (target && target.checkAlive())? [target]: [t];
    };
  }
  for(let target of targets) {
    if(cb(target)) return true;
  }
  return false;
}
// 根据名称获取buff标签
function getBuffTags(name) {
  for(let i = 0; i < buffTags.length; i++) {
    for(let j = 0; j< buffTags[i].data.length; j++){
      const cur = buffTags[i].data[j];
      if(cur.name === name || cur === name) {
        return cur.value ||cur;
      }      
    }
  }
  return 'debuff';
}

module.exports = {
  conditions,
  ruleFunc,
  compare,
  params_target,
  params_number,
  getBuffTags,
}