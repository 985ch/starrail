// 盗匪荒漠的废土客
'use strict';

const EquipSet = require('../equip_set');
const Buff = require('../buff');

class BuffCri extends Buff {
  static info() {
    return {
      name: '废土客[双爆]',
      short: '双爆',
      source: '遗器',
      desc: '对有负面状态目标暴击提高10%，对被禁锢目标暴伤提高20%',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getAttributesT(target) {
    const debuffs = target.filterBuffs({tag:'debuff'});
    if(debuffs.length === 0) return {};
    const hasCriDamage = target.findBuff({tag:'禁锢'}, debuffs);
    return { criRate: 10, criDamage: hasCriDamage? 20 : 0};
  }
}

class Void4FTK extends EquipSet {
  static getDesc() {
    return {
      name: '盗匪荒漠的废土客',
      short: '废土客',
      set2: '虚数伤提升10%',
      set4: '对有负面状态目标暴击提高10%，对被禁锢目标暴伤提高20%',
      image: 'void4_ftk',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { bonusVoid: 10} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this.character, BuffCri) ];
  }
}

module.exports = Void4FTK;