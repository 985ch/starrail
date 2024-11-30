// 简单的单属性通用buff
const { A, C, D, Buff } = require('./index');

// 攻击力提升（按百分比）
const BuffAtkRate = Buff.createAttrBuff({
  attr: 'atkRate',
  short: '加攻',
  tags: ['buff', '加攻'],
})

// 攻击力提升（按数值)
const BuffAtk = Buff.createAttrBuff({
  attr: 'atk',
  short: '加攻',
  tags: ['buff', '加攻'],
})

// 防御力提升（按百分比）
const BuffDefRate = Buff.createAttrBuff({
  attr: 'defRate',
  short: '加防',
  tags: ['buff', '加防'],
})

// 生命值提升（按百分比）
const BuffHpRate = Buff.createAttrBuff({
  attr: 'hpRate',
  short: '生命',
  tags: ['buff', '生命上限'],
})

// 能量恢复效率提升
const BuffEnRate = Buff.createAttrBuff({
  attr: 'enRate',
  short: '回能',
  tags: ['buff', '回能'],
})

// 击破特攻提升
const BuffBreakRate = Buff.createAttrBuff({
  attr: 'breakRate',
  short: '击破',
  tags: ['buff', '击破特攻'],
})

// 全属性增伤
const BuffDamage = Buff.createAttrBuff({
  attr: 'bonusAll',
  short: '增伤',
  tags: ['buff', '增伤', 'bonusAll'],
})

// 特定属性伤害加成
class BuffBonus extends Buff {
  static info(data) {
    const { name, source, type, hide, maxValue, target} = data;
    const info = D.AttributeText['bonus' + type];
    return {
      name: name,
      short: info.short,
      source: source,
      desc: info.short +'提高',
      show: hide? false : true,
      maxValue: maxValue || 0,
      target: target || 'self',
      tags: ['buff', '增伤', 'bonus' + type],
    };
  }
  getDesc() {
    const { type, desc } = this.data;
    const attrInfo = D.AttributeText['bonus' + type];
    return `${desc || ''}${attrInfo.short}提高${D.toPercent(this.data['bonus' + type] * this.value)}`;
  }
  getAttributes() {
    return {
      ['bonus' + this.data.type]: this.data[ 'bonus' + this.data.type ] * this.value,
    }
  }
}

// 全抗性提升
const BuffDefendAll = Buff.createAttrBuff({
  attr: 'defendAll',
  short: '加抗',
  tags: ['buff', '加抗'],
})

// 全抗性提升
const BuffDodge = Buff.createAttrBuff({
  attr: 'dodge',
  short: '抵抗',
  tags: ['buff', '抵抗'],
})

// 速度加成(按百分比)
const BuffSpeedRate = Buff.createAttrBuff({
  attr: 'speedRate',
  short: '加速',
  tags: ['buff', '加速'],
})

// 速度加成(按数值)
const BuffSpeed = Buff.createAttrBuff({
  attr: 'speed',
  short: '加速',
  tags: ['buff', '加速'],
})

// 命中
const BuffHit = Buff.createAttrBuff({
  attr: 'hit',
  short: '命中',
  tags: ['buff', '命中'],
})

// 减伤
class BuffBlock extends Buff {
  static info(data) {
    const { name, source, hide, maxValue, target} = data;
    return {
      name: name,
      short: '减伤',
      source: source,
      desc:'受到伤害降低',
      show: hide? false : true,
      maxValue: maxValue || 0,
      target: target || 'self',
      tags: ['buff', '减伤'],
    };
  }
  getDesc() {
    return `${this.data.desc || ''}受到伤害降低${D.toPercent(this.data.damageRate * this.value)}。`;
  }
  getAttributes() {
    return { damageRate: 1 - this.data.damageRate * this.value * 0.01 };
  }
}

// 暴击率
const BuffCriRate = Buff.createAttrBuff({
  attr: 'criRate',
  short: '暴击',
  tags: ['buff', '暴击'],
})

// 暴击伤害
const BuffCriDamage = Buff.createAttrBuff({
  attr: 'criDamage',
  short: '暴伤',
  tags: ['buff', '暴伤'],
})


// 防御穿透
const BuffDefThrough = Buff.createAttrBuff({
  attr: 'defThrough',
  short: '穿透',
  tags: ['buff', '破防'],
})

// 治疗量提升
const BuffHealRate = Buff.createAttrBuff({
  attr: 'healRate',
  short: '治疗量',
  tags: ['buff', '治疗量'],
})

// 回血
class BuffHeal extends Buff {
  static info(data) {
    return {
      name: data.name,
      short: '回血',
      source: data.source,
      desc: '回血',
      show: data.hide ? false : true ,
      maxValue: data.maxValue || 0,
      target: data.target || 'members',
      tags: data.isHot?['report', 'buff', 'HOT'] : ['report'],
    };
  }
  getDesc() {
    return `${this.data.desc||''}回复${Math.floor(this.getData(this.member))}生命。`;
  }
  getReportData(target) {
    const heal0 = this.getData(target);
    return this.data.hideReport? []: [{
      type:'heal', name: this.data.title, labels:[ this.data.label || '治疗量'], tip: this.data.tip || '',
      heal0, 
    }];
  }
  getData(target) {
    const base = target.getAttr(this.data.baseAttr);
    return C.calHealData(base * this.data.healR * 0.01 + (this.data.heal || 0), this.member, target);
  }
}

// 回能
class BuffEn extends Buff {
  static info(data) {
    return {
      name: data.name,
      short: '回能',
      source: data.source,
      desc: '回能',
      show:  data.hide ? false : true ,
      maxValue: data.maxValue || 0,
      target: data.target || 'self',
      tags: ['report'],
    };
  }
  getDesc() {
    return `${this.data.desc}$回复${Math.floor(this.data.en)}能量。`;
  }
  getReportData(target) {
    const en = this.data.en * target.attr.data.enRate * 0.01; // 不确定这个是吃谁的能量回复效率
    return[{
      type:'energy', name: this.data.title, labels:[ this.data.label || '回能'], tip: this.data.tip || '',
      en0: en,
    }];
  }
}

// 套盾
class BuffShield extends Buff {
  static info(data) {
    return {
      name: data.name,
      short: '护盾',
      source: data.source,
      desc: '获得护盾',
      show: data.hide ? false : true  ,
      maxValue: data.maxValue || 0,
      target: data.target || 'self',
      tags: ['shield'],
    };
  }
  getDesc() {
    return `剩余护盾：${Math.floor(this.state.shield)}。`;
  }
  init() {
    this.state.shield = this.getData();
    this.listen({ e: 'B_HIT_S', f: (buff, unit, data)=>{
      const { damage, blocked } = data;
      const b = Math.min(damage, buff.state.shield);
      data.blocked = Math.max(b, blocked || 0);
      buff.state.shield -= b;
      if(buff.state.shield <= 0) {
        buff.state.count = 0;
      }
    }})
  }
  getData() {
    const base = this.member.getAttr(this.data.baseAttr);
    return C.calShieldData(base * this.data.shieldR * 0.01 + this.data.shield, this.member, this.target);
  }
}

// 免疫伤害
class BuffImmune extends Buff {
  static info(data) {
    return {
      name: data.name,
      short: '免疫',
      source: data.source,
      desc: '免疫除持续伤害外的所有伤害',
      show: data.hide ? false : true  ,
      maxValue: data.maxValue || 0,
      target: data.target || 'self',
      tags: ['immune'],
    };
  }
  init() {
    this.listen({ e: 'B_HIT_S', f: (buff, unit, data)=>{
      if(D.checkType(data.type, 'DOT')) return;
      data.blocked = data.damage;
    }})
  }
}

module.exports = {
  BuffDamage,
  BuffAtkRate,
  BuffAtk,
  BuffDefRate,
  BuffHpRate,
  BuffEnRate,
  BuffBreakRate,
  BuffBonus,
  BuffDefendAll,
  BuffDodge,
  BuffSpeedRate,
  BuffSpeed,
  BuffHit,
  BuffBlock,
  BuffCriDamage,
  BuffDefThrough,
  BuffCriRate,
  BuffHeal,
  BuffEn,
  BuffShield,
  BuffHealRate,
  BuffImmune,
}