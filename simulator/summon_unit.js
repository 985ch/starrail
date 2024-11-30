// 召唤单位
const BaseUnit = require('./base_unit');

class SummonUnit extends BaseUnit {
  constructor(owner, name) {
    super(owner.team);
    this.owner = owner;
    this.name = name;
    this.faction = 'members';
    this.base = this.getBase();
  }
  resetState() {
    this.state = {
      wait: this.calActionTime(),
      turn: 0,
    };
  }
  getBase() {
    return { image:'summon.png', rarity: 'SR'}
  }
  checkAlive() {
    return this.owner.checkAlive();
  }
  summon() {
    this.owner.triggerEvent('SUMMON_A', { unit: this });
  }
  dismiss() {
    this.owner.triggerEvent('SUMMON_D', { unit: this });
  }
}

module.exports = SummonUnit;
