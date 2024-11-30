'use strict';

const BaseWeapon = require('../weapon');
const Buff = require('../buff');
const D = require('../data');

const baseData = {
  name: '无边曼舞',
  short: '试探',
  rarity: 'SR',
  job: '虚无',
  hp: D.levelData['43_952'],
  atk: D.levelData['21_476'],
  def: D.levelData['15_330'],
  data: D.makeTable([['criRate','criDamage'],[8,24],[10,30],[12,36],[14,42],[16,48]]),
};

class BuffCriDamage extends Buff {
  static info() {
    return {
      name: baseData.short,
      short: '暴伤',
      source: '光锥',
      desc: '对被减防或减速的目标暴伤提高',
      show: false,
      maxValue: 0,
      target: 'self',
      tags: [],
    };
  }
  getDesc(){
    return `对被减防或减速的目标暴伤提高${this.data.criDamage}%。`
  }
  isActivated(target) {
    const buff = target.findBuff({ tag:'减速' }) || target.findBuff({ tag:'减防' });
    return buff? true: false;
  }
  getAttributesT(target) {
    return this.isActivated(target)? { criDamage: this.data.criDamage } : {}
  }
}

class SrNihWBMW extends BaseWeapon {
  getBase() { return baseData; }
  getDesc() { return `暴击提高${this.data.criRate}%，对被减防或减速的目标暴伤提高${this.data.criDamage}%。` }
  getExtendAttributes(){
    return { criRate: this.data.criRate }
  }
  getBuffList(){
    return [Buff.getListJson(this.character, BuffCriDamage, [], '', this.data)];
  }
}

module.exports = {
  data: baseData,
  weapon: SrNihWBMW,
}