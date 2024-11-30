// 规则列表
const ruleList = [
  {text: '流萤强化战技最大', value:'c_firefly', tip:'按流萤强化战技伤害最大期望来计算分数，速度需要单独配置', members:['流萤']},
  {text: '自选词条配装', value:'simple',  tip:'每个词条的记分规则为最终属性值乘分数，超过上限部分不计分'},
  {text: '普攻单次输出最大', value:'dmgNA', tip:'以100%倍率普攻的期望伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '战技单次输出最大', value:'dmgNS',  tip:'以100%倍率战技的期望伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '终结技单次输出最大', value:'dmgUS', tip:'以100%倍率终结技的期望伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '追击单次输出最大', value:'dmgAA',  tip:'以100%倍率追击的期望伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '超击破伤害最大', value:'dmgBRK',  tip:'以100%倍率1破韧的超击破伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '持续伤害输出最大', value:'dmgDOT',  tip:'以100%倍率持续伤害计算结果为分数，速度及转模属性需单独配置'},
  {text: '等效生命值最大', value:'alive', tip:'以角色生命值除以实际减伤数值得到的等效生命值作为分数'},
]
const ruleConfig = {
  simple:{
    module: 'simple',
    getAttrs:(member, attrs) => attrs,
    getSetAttrs:(member, attrs) =>[],
    initConfig(member, attrs) {
      return initAttr(attrs, {});
    }
  },
  dmgNA:{
    module: 'damage',
    getAttrs: (member, attrs) => getAttrs(member, attrs, ['criRate','criDamage']),
    getSetAttrs: getSetAttrs('NA'),
    initConfig: getInitConfig('NA'),
  },
  dmgNS:{
    module: 'damage',
    getAttrs: (member, attrs) => getAttrs(member, attrs, ['criRate','criDamage']),
    getSetAttrs: getSetAttrs('NS'),
    initConfig: getInitConfig('NS'),
  },
  dmgUS:{
    module: 'damage',
    getAttrs: (member, attrs) => getAttrs(member, attrs, ['criRate','criDamage']),
    getSetAttrs: getSetAttrs('US'),
    initConfig: getInitConfig('US'),
  },
  dmgAA:{
    module: 'damage',
    getAttrs: (member, attrs) => getAttrs(member, attrs, ['criRate','criDamage']),
    getSetAttrs: getSetAttrs('AA'),
    initConfig: getInitConfig('AA'),
  },
  dmgDOT: {
    module: 'damageDot',
    getAttrs:(member, attrs) => getAttrs(member, attrs, ['hit']),
    getSetAttrs: getSetAttrs('DOT'),
    initConfig: getInitConfig('DOT'),
  },
  dmgBRK: {
    module: 'damageBrk',
    getAttrs:(member, attrs) => ['breakRate', 'breakBonus', ...attrs],
    getSetAttrs: getSetAttrs('BRK'),
    initConfig: getInitConfig('BRK'),
  },
  alive: {
    module: 'alive',
    getAttrs:(member, attrs) => getAttrs(member, attrs, ['hp','def','dodge']),
    getSetAttrs: getSetAttrs(),
    initConfig: getInitConfig(),
  },
  c_firefly: {
    module: 'c_firefly',
    getAttrs: (member, attrs) => getAttrs(member, attrs, ['breakRate', 'criRate','criDamage']),
    getSetAttrs: getSetAttrs('NS'),
    initConfig: getInitConfig('NS'),
  }
}

function getAttrs(member, attrs, list) {
  list.push('bonusAll', 'throughAll', 'bonus'+ member.base.type, member.base.mainAttr || 'atk', ...attrs);
  return list;
}
function getSetAttrs(type) {
  return (member, attrs) => {
    const setAttrs = [];
    if(type) {
      if(type !== 'DOT' && type!=='BRK') {
        setAttrs.push('crit'+type, 'criDmg'+type);
      }
      setAttrs.push('bonus'+type, 'defThrough', 'arp'+type, 'through' + member.base.type)
    } else {
      setAttrs.push('defendAll', 'damageRate');
    }
    return setAttrs;
  };
}
function getInitConfig(type){
  return (member, attrs) => {
    let ext = initAttr(attrs, {});
    const mType = member.base.type;
    const types = type? [mType, type]: [ mType ];
    return {
      types,
      main: member.base.mainAttr || 'atk',
      ext,
    }
  };
}
function initAttr(attr, json){
  for(let key in attr) {
    json[key] = {
      score: attr[key][0],
      min: attr[key][1],
      max: attr[key][2],
    }
  }
  return json;
}
// 填充需要的属性
function fillAttrs(attrs, attr) {
  if(!attr) return;
  if(!attrs.includes(attr)) attrs.push(attr);
}

module.exports = {
  ruleList,
  ruleConfig,
  fillAttrs,
}