// 骇域漫游的信使
'use strict';

const EquipSet = require('../equip_set');
const { Buff, D } = require('../index');
const { BuffCriDamage } = require('../buff_simple')

class Speed4SD extends EquipSet {
  static getDesc() {
    return {
      name: '重循苦旅的司铎',
      short: '司铎',
      set2: '速度提高6%',
      set4: '对我方单体目标施放战技或终结技时，使技能目标的暴击伤害提高18%，持续2回合，该效果最多叠加2次',
      image: 'speed4_sd',
      buffs: [['暴伤提高', '司铎', 2]],
      evt: 'ACT_E',
    }
  }
  getAttributes() {
    return (this.count >= 2) ? { speedRate: 6} : {};
  }
  getBuffList() {
    if(this.count<4)return [];
    return [ Buff.getListJson(this, BuffCriDamage, [Buff.simpleListener()], '', {
      criDamage: 18, name: '司铎', source:'遗器', maxValue: 2,
    }) ];
  }
  onEvent(e, unit, data){
    const c = this.character;
    if(!D.checkType(data.type,['US','NS']) ||this.count<4 || unit!==c) return;
    if(typeof data.target==='string' || data.target.faction!=='members')return;
    c.addBuff(Buff.getKey(c.name,'遗器', '司铎'), data.target, 1);
  }
}

module.exports = Speed4SD;