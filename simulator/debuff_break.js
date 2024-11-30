'use strict';

const { D, Buff } = require('./index');

// 构造击破debuff
function createBreakDot(tag, attr, maxValue, count, tags = null, desc = null) {
  class BreakDot extends Buff {
    static info() {
      return {
        name: tag,
        short: tag,
        source: '击破',
        desc: (desc || '每回合') + '受到' +  D.getTypeText(attr) + '伤害',
        show: true,
        maxValue: maxValue || 1,
        target: 'enemy',
        tags: tags || ['debuff', 'dot', 'removable', tag],
      }
    }
    init() {
      this.state.count = count;
      const data = this.data || {};
      data.type = attr;
      this.data = data;
    }
    getDesc() {
      const damage = this.getData();
      return `${desc || '每回合'}受到${Math.floor(damage)}点${ D.getTypeText(attr)}伤害。`;
    }
    getData() {
      const { dotDamage } = this.member.getBreakDamage(this.target);
      return dotDamage * (this.value || 1);
    }
  }
  return BreakDot;
}

// 击破的灼烧debuff
const BreakFire = createBreakDot('灼烧', 'Fire',  1, 2);
// 击破的冻结debuff
const BreakIce = createBreakDot('冻结', 'Ice', 1, 1, ['debuff', '冻结', 'freeze', 'removable'], '无法行动，解冻时');
// 击破的触电debuff
const BreakThunder = createBreakDot('触电', 'Thunder', 1, 2);
// 击破的裂伤debuff
const BreakPhysical = createBreakDot('裂伤', 'Physical', 1, 2);
// 击破的风化debuff
class BreakWind extends Buff {
  static info() {
    return {
      name: '风化',
      short: '风化',
      source: '击破',
      desc: '每回合受到风伤',
      show: true,
      maxValue: 5,
      target: 'enemy',
      tags: ['debuff', 'dot', '风化', 'removable'],
    }
  }
  init() {
    this.state.count = 2;
    const data = this.data || {};
    data.type = 'Wind';
    this.data = data;
  }
  getDesc() {
    const damage = this.getData();
    return `'每回合受到${Math.floor(damage)}点风伤。`;
  }
  getData() {
    const { dotDamage } = this.member.getBreakDamage(this.target);
    return dotDamage * (this.value || 1);
  }
}
// 击破的纠缠debuff
const BreakQuantum = createBreakDot('纠缠', 'Quantum', 5, 1, ['debuff', '纠缠', 'removable'], '下回合开始时');
// 击破的禁锢debuff
class BreakVoid extends Buff {
  static info() {
    return {
      name: '禁锢',
      short: '禁锢',
      source: '击破',
      desc: '无法行动，速度降低10%',
      show: true,
      maxValue: 1,
      target: 'enemy',
      tags: ['debuff', '减速', '禁锢', 'freeze', 'removable'],
    }
  }
  getDesc() {
    return `无法行动，速度降低10%。`;
  }
  getAttributes() {
    return { speedRate: -10.0 }
  }
}

function getValue() { return 1 }
module.exports = {
  Fire: {
    Debuff: BreakFire,
    getValue,
    listens: [Buff.dotListener()],
  },
  Ice: {
    Debuff: BreakIce,
    getValue,
    listens: [Buff.freezeListener(true, true)],
  },
  Wind: {
    Debuff: BreakWind,
    getValue: (enemy) => enemy.isElite() ? 3 : 1,
    listens: [Buff.dotListener()],
  },
  Thunder:{
    Debuff: BreakThunder,
    getValue,
    listens: [Buff.dotListener()],
  },
  Physical:{
    Debuff: BreakPhysical,
    getValue,
    listens: [Buff.dotListener()],
  },
  Quantum:{
    Debuff: BreakQuantum,
    getValue,
    listens: [Buff.dotListener('AD'), { e:'B_DMG_S', f: (buff) => {
      buff.member.addBuff(buff.key, buff.target, 1, {}, true, true);
    } }],
  },
  Void:{
    Debuff: BreakVoid,
    getValue,
    listens: [Buff.freezeListener(false, true)],
  }
}