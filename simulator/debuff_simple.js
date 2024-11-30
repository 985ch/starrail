// 简单的单属性通用debuff和dot
const Buff = require('./buff');
const D = require('./data');

// 属性弱点
class DebuffWeak extends Buff {
  static info(data) {
    const text = D.DamageTypeInfo[data.weak].text;
    return {
        name: text + '属性弱点',
        short: '弱点',
        source: data.source || '天赋',
        desc: text + '属性弱点',
        show: false,
        maxValue: 0,
        target: 'self',
        tags: ['weak', 'weak' + data.weak],
    };
  }
  getAttributes(){
    return { ['defend' + this.data.weak]: -20 };
  }
}
// 属性弱点
class DebuffWeakTmp extends Buff {
  static info(data) {
    const text = D.DamageTypeInfo[data.weak].text;
    return {
        name: text + '属性弱点',
        short: '弱点',
        source: data.source || '天赋',
        desc: text + '属性弱点',
        show: false,
        maxValue: 0,
        target: data.target || 'enemy',
        tags: ['debuff', 'weak', 'weak' + data.weak],
    };
  }
  getAttributes(){
    if(this.data.noDefendDown) return null;
    return { ['defend' + this.data.weak]: -20 };
  }
}
// 类型易伤
class DebuffWeakType extends Buff {
  static info(data) {
    const text = D.getTypeText(data.type);
    return {
        name: data.name || text + '易伤',
        short: '易伤',
        source: data.source,
        desc: text + '易伤',
        show: data.hide? false: true,
        maxValue: data.maxValue || 0,
        target: data.target || 'enemy',
        tags: ['易伤'].concat(data.tags || []),
    };
  }
  getDesc() {
    const text = D.getTypeText(this.data.type)
    return `${this.data.desc || ''}受到的${text}伤害增加${D.toPercent(this.data['weak'+this.data.type] * this.value)}。`;
  }
  getAttributes(){
    const key = 'weak' + this.data.type;
    return { [key]: this.data[key] * this.value };
  }
}
// 所有伤害降低
const DebuffDamage = Buff.createAttrBuff({
  attr: 'bonusAll',
  short: '虚弱',
  target: 'enemy',
  tags: ['debuff', '虚弱'],
  minus: true,
})
// 攻击力降低（按百分比）
const DebuffAtkRate = Buff.createAttrBuff({
  attr: 'atkRate',
  short: '减攻',
  target: 'enemy',
  tags: ['debuff', '减攻'],
  minus: true,
})
// 防御力降低（按百分比）
class DebuffDefRate extends Buff {
  static info(data) {
    const tags = data.tags || ['debuff', '减防'];
    if(data.maxValue>0) tags.push('removable');
    return {
      name: data.name,
      short: '减防',
      source: data.source,
      desc: '防御力降低',
      show: true,
      maxValue: data.maxValue || 0,
      target: data.target || 'enemy',
      tags,
    };
  }
  getDesc() {
    return `${this.data.desc || ''}防御力降低${D.toPercent(this.data.defDown * this.value)}。`;
  }
  getAttributes() {
    return {
      defDown: this.data.defDown * this.value,
    }
  }
}
// 速度降低（按百分比）
const DebuffSpeedRate = Buff.createAttrBuff({
  attr: 'speedRate',
  short: '减速',
  target: 'enemy',
  tags: ['debuff', '减速'],
  minus: true,
})
// 效果抵抗降低
const DebuffDodge = Buff.createAttrBuff({
  attr: 'dodge',
  short: '抵抗降低',
  target: 'enemy',
  tags: ['debuff', '抵抗降低'],
  minus: true,
})
// 全抗性降低
const DebuffDefendAll = Buff.createAttrBuff({
  attr: 'defendAll',
  short: '减抗',
  target: 'enemy',
  tags: ['debuff', '减抗'],
  minus: true,
})
// 属性弱点
class DebuffDefend extends Buff {
  static info(data) {
    const text = D.DamageTypeInfo[data.type].text;
    return {
        name: data.name,
        short: '减抗',
        source: data.source,
        desc: text + '抗降低',
        show: data.hide? false: true,
        maxValue: data.maxValue || 0,
        target: data.target || 'enemy',
        tags: data.tags || ['debuff', '减抗', text + '抗降低'],
    };
  }
  getDesc() {
    const text = D.DamageTypeInfo[this.data.type].text;
    return `${this.data.desc || ''}${text}抗降低${D.toPercent(this.data['defend'+this.data.type] * this.value)}。`;
  }
  getAttributes(){
    const key = 'defend' + this.data.type
    return { [key]: -this.data[key] * this.value };
  }
}
// 全属性易伤
const DebuffWeakAll = Buff.createAttrBuff({
  attr: 'weakAll',
  short: '易伤',
  target: 'enemy',
  tags: ['debuff', '易伤'],
})
// 简单DOT伤害
class DebuffDot extends Buff {
  static info(data) {
    const { name, type, source, maxValue, target } = data;
    const info = D.DamageTypeInfo[type];
    const tags = data.tags || ['debuff', 'dot', info.dotName];
    if(maxValue>0) tags.push('removable');
    return {
      name: name,
      short: info.dotName,
      source: source,
      desc: '每回合受到' + info.text + '属性伤害',
      show: true,
      maxValue: maxValue || 1,
      target: target || 'enemy',
      tags,
    }
  }
  init() {
    if(this.data.count)this.state.count = this.data.count;
  }
  getDesc() {
    const damage = this.getData();
    return `每回合受到${Math.floor(damage)}点${D.DamageTypeInfo[this.data.type].text}伤。`;
  }
  getData() {
    const { baseAttr, rate, type, hpRate } = this.data;
    const member = this.member;
    const base = member.getAttr(baseAttr);
    let raw = base * rate * 0.01;
    if(type==='Physical') {
      raw = Math.min(raw, this.target.getAttr('hp') * hpRate * 0.01);
    }
    const damage = member.getAdditionDamage(base * rate * 0.01, this.target, type, true);
    return damage.damage * this.value;
  }
}
// 冻结
class DebuffFreeze extends Buff {
  static info(data) {
    const { name, source, target, tags } = data;
    return {
      name: name,
      short: '冻结',
      source: source,
      desc: '无法行动，解冻时受到冰属性伤害',
      show: true,
      maxValue: 1,
      target: target || 'enemy',
      tags:  ['debuff', '冻结', 'freeze', 'removable'].concat(tags || []),
    }
  }
  getDesc() {
    const { damage, criDamage } = this.getData();
    return `无法行动，解冻时受到${Math.floor(damage)}(${Math.floor(criDamage)})点冰属性伤害。`;
  }
  getData() {
    const { baseAttr, rate } = this.data;
    const member = this.member;
    const base = member.getAttr(baseAttr);
    const damage = member.getAdditionDamage(base * rate * 0.01, this.target, 'Ice', false);
    return damage;
  }
}
// 禁锢
class DebuffShackle extends Buff {
  static info(data) {
    return {
      name: data.name,
      short: '禁锢',
      source: data.source,
      desc: '无法行动，速度降低',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '减速', '禁锢', 'freeze', 'removable'],
    }
  }
  getDesc() {
    return `无法行动，速度降低${D.toPercent(this.data.speedRate)}。`;
  }
  getAttributes() {
    return { speedRate: -this.data.speedRate }
  }
}
// 嘲讽
class DebuffTaunt extends Buff {
  static info(data) {
    const { name, source, target, tags } = data;
    return {
      name: name,
      short: '嘲讽',
      source: source,
      desc: '受到嘲讽，只能攻击指定目标',
      show: true,
      maxValue: 1,
      target: target || 'enemy',
      tags:  ['嘲讽'].concat(tags || []),
    }
  }
}

module.exports = {
  DebuffWeak,
  DebuffWeakTmp,
  DebuffWeakType,
  DebuffDamage,
  DebuffAtkRate,
  DebuffDefRate,
  DebuffSpeedRate,
  DebuffDefendAll,
  DebuffDefend,
  DebuffWeakAll,
  DebuffDodge,
  DebuffDot,
  DebuffShackle,
  DebuffFreeze,
  DebuffTaunt,
}