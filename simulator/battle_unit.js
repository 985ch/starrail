'use strict';

const BaseUnit = require('./base_unit');
const Attributes = require('./attributes');
const { A, C, D, Buff } = require('./index');

class BattleUnit extends BaseUnit {
  constructor(team, index, name, level, faction, state) {
    super(team, state);
    this.index = index;
    this.base = this.getBaseData();
    this.name = name;
    this.team = team;
    this.attr = new Attributes(); // 实战面板
    this.level = level;
    this.faction = faction;
    this.staticAttr = this.attr; // 静态面板
    this.buffedAttr = new Attributes(this.attr.data); // 计算固定buff后，计算转模buff前的中间面板，每次updateData后更新
    this.isUpdating = false; // 是否正在计算新数据
    this.needUpdate = false; // 是否需要更新
    this.cachedAttr = null; // 对特定目标的属性缓存
    this.cachedTarget = null; // 缓存的目标
    this.logs = []; // 显示日志
  }
  // 获取基本数据
  getBaseData() {
    return null;
  }
  // 重置数据
  reset(){
    super.reset();
    this.attr.reset();
    this.resetBaseAttributes();
    // 保存基本属性
    this.baseHp = this.attr.data.hp;
    this.baseAtk = this.attr.data.atk;
    this.baseDef = this.attr.data.def;
    this.baseSpeed = this.base.speed;
    this.baseHate = this.base.hate || 100;
    this.attr.mergeAttributes(this.getExtendAttributes());
    // 保存当前数据为静态面板
    this.staticAttr = new Attributes(this.attr.data);
    this.staticHp = this.attr.data.hp;
    this.staticAtk = this.attr.data.atk;
    this.staticDef = this.attr.data.def;
    this.staticSpeed = this.attr.data.speed;
    this.staticHate = this.attr.data.hate;
    this.updateBaseAttributes(this.staticAttr);
  }
  // 重置基本属性
  resetBaseAttributes() {};
  // 获取额外属性
  getExtendAttributes() {
    return [];
  };
  // 获取指定属性
  getAttr(key) {
    if(!this.isUpdating) {
      return this.attr.data[key];
    }
    // 使key首字母大写
    const Key = key.charAt(0).toUpperCase() + key.slice(1);
    if(this['base'+Key]) {
      return this.attr.data[key] + this['base' + Key] * this.attr.data[key+'Rate'] * 0.01;
    }
    return this.attr.data[key];
  }
  // 获取该单位可以提供的所有增益和减益效果
  getBuffList(){
    return [];
  }
  // 获取角色关联的召唤物列表
  getSummonList(){
    return [];
  }
  // 添加buff
  addBuff(key, target, value, state, log = true, noEvent = false) {
    const buffInfo = this.team.buffManager.findBuffJson(key);
    if(!buffInfo) throw new Error('找不到buff:'+key);
    if(!this.team.battleMode) {
      return this.team.buffManager.addBuff(buffInfo, target, value, state, log);
    }
    const info = buffInfo.buffClass.info(buffInfo.data, this);
    // 触发事件
    const data = { member: this, target, value, state, info:buffInfo };
    let targets = Buff.getBuffTargets(info.target, this, target);
    // 当buff只针对单个目标时，判断该buff会不会被阻止，若被阻止则不触发后续事件
    if(targets.length===1 && info.maxValue>0 && info.tags.includes('debuff') && info.tags.includes('removable')) {
      const buffs = targets[0].filterBuffs({tag:['抵抗异常']});
      for(let i=0;i<buffs.length;i++) {
        if(buffs[i].blockDebuff(this, targets[0], info))return null;
      }
    }
    if(!noEvent) {
      this.triggerEvent('C_BUFF_S', data);
      targets.forEach(t => t.triggerEvent('B_BUFF_S', data))
    }
    const buff = this.team.buffManager.addBuff(buffInfo, target, value, state, log);
    data.buff = buff;
    if(!noEvent) {
      targets.forEach(t => t.triggerEvent('B_BUFF_E', data))
      this.triggerEvent('C_BUFF_E', data);
    }

    return buff;
  }
  // 根据效果命中随机添加buff
  addBuffRandom(key, target, value, state, hit, count = 1, isControl = false, isDot = false ) {
    if(D.rand(C.calHitRate(hit, this, target, count, isControl, isDot))) {
      this.addBuff(key, target, value, state, true);
      return true;
    }
    return false;
  }
  // 移除一个状态
  removeABuff(keyTag = 'debuff') {
    const debuff = this.findBuff({tag:['removable']},this.filterBuffs({tag:[keyTag]}));
    if(debuff) return this.removeBuff(debuff, true);
    return false;
  }
  // 移除buff
  removeBuff(buff, log) {
    if(buff && log) {
      const info = buff.getInfo();
      const targets = buff.getTargets();
      const result = this.team.buffManager.removeBuff(buff, log);
      targets.forEach(t => t.triggerEvent('B_BUFF_RM', info))
      return result;
    }
    return this.team.buffManager.removeBuff(buff, log);
  }
  // 获取可以添加给自己的所有buff信息
  getBuffListForSelf() {
    return this.team.buffManager.filterBuffListForTarget(this);
  }
  // 查找指定buff
  findBuff(findObj, list = null, needTarget = true){
    if(needTarget && !findObj.target) findObj.target = [this.name, this.faction];
    return this.team.buffManager.findBuff(findObj, list);
  }
  // 获取符合条件的buff列表
  filterBuffs(findObj, list = null, needTarget = true){
    if(needTarget && !findObj.target) findObj.target = [this.name, this.faction];
    return this.team.buffManager.filterBuffs(findObj, list);
  }
  // 统计符合条件的buff数量，可设定最大返回值
  countBuffs(findObj, max = 0, list = null, needTarget = true){
    const count = this.filterBuffs(findObj, list, needTarget).length;
    return max<=0 ? count : Math.min(count, max);
  }
  // 更新战斗单位数据
  updateData(){
    //console.log(this.name, 'updateData');
    this.isUpdating = true; // 开始计算新数据
    const oldSpeed = this.attr.data.speed;
    const oldHp = this.attr.data.hp;

    this.attr = new Attributes(this.staticAttr.data); // 复制静态面板
    this.attr.data.hp = this.staticHp;
    this.attr.data.atk = this.staticAtk;
    this.attr.data.def = this.staticDef;
    this.attr.data.speed = this.staticSpeed;
    this.attr.data.hate = this.staticHate;
    // 计算增益效果
    let buffs = this.filterBuffs({ target: [this.name, this.faction]});
    for(let i=0; i<buffs.length; i++) {
      const attr = buffs[i].getAttributes(this);
      if(attr)this.attr.mergeAttributes(attr);
    }
    // 保存中间结果
    this.buffedAttr = new Attributes(this.attr.data);
    this.updateBaseAttributes(this.buffedAttr);
    // 处理转模buff
    const transAttr = new Attributes();
    for(let j=0; j<buffs.length; j++) {
      const buff = buffs[j];
      const info = buff.getTransAttr(this);
      if(!info) {
        buff.lastTransAttr[this.name] = null;
        continue;
      }
      const json = this.getTransData(buff.member, info);
      buff.lastTransAttr[this.name] = json;
      transAttr.mergeAttributes(json);
    }
    // 合并转模属性
    this.attr.mergeAttributes(transAttr.data);
    this.updateBaseAttributes(this.attr);

    this.team.clearTargetCache(this);
    this.cachedTarget = null;
    this.cachedAttr = null;
    const newSpeed = this.attr.data.speed;
    if( newSpeed !== oldSpeed ){
      this.state.wait *= oldSpeed / newSpeed;
      this.team.updateActionUnit(this);
    }
    const hpChange = this.attr.data.hp - oldHp;
    if(hpChange !== 0 && this.team.battleMode) {
      this.state.hp = Math.min(this.attr.data.hp, Math.max(this.state.hp+hpChange, 0))
    }
    this.isUpdating = false; // 结束计算新数据
    this.needUpdate = false;
    if(this.team.battleMode) {
      this.triggerEvent('UPDATE_DATA', {})
    }
  }
  // 获取根据其他属性转化得来的属性数据
  getTransData(member, info) {
    const json = {};
    for(let key in info) {
      const { raw, min = 0, step = 0, rate = 0, max = 0, add = 0 } = info[key];
      const rawVal = member.getAttr(raw) + 0.0001;
      if(rawVal<min) {
        continue;    
      };
      const val = step? Math.floor((rawVal - min)/step) * rate + add: (rawVal-min) * rate + add;
      json[key] = max? Math.min(val, max): val;
    }
    return json;
  }

  // 获取针对特定目标的额外增益数据
  getAttributesT(target) {
    if(!target) return {};
    if(target === this.cachedTarget) return this.cachedAttr.data;
    this.cachedTarget = target;
    const attr = new Attributes(this.attr.data);
    this.cachedAttr = attr;

    let buffs = this.filterBuffs({ target: [this.name, this.faction]});
    buffs.forEach(buff=>{
      const json = buff.getAttributesT(target, this);
      if(json)attr.mergeAttributes(json);
    });
    this.updateBaseAttributes(attr);
    return attr.data;
  }
  // 获取受来自特定目标的行动时额外的增益数据
  getAttributesB(target) {
    if(!target) return {};
    const attr = new Attributes(this.attr.data);
    let buffs = this.filterBuffs({ target: [this.name, this.faction]});
    buffs.forEach(buff=>{
      const json = buff.getAttributesB(target, this);
      if(json)attr.mergeAttributes(json);
    });
    this.updateBaseAttributes(attr);
    return attr.data;
  }
  // 更新四项基础数据
  updateBaseAttributes(attr) {
    attr.updateBaseAttributes('hp', this.baseHp);
    attr.updateBaseAttributes('atk', this.baseAtk);
    attr.updateBaseAttributes('def', this.baseDef);
    attr.updateBaseAttributes('speed', this.baseSpeed);
    attr.updateBaseAttributes('hate', this.baseHate);
  }
  // 计算行动间隔
  calActionTime() {
    if(this.needUpdate) this.updateData();
    return C.calActionTime(this.getAttr('speed'), 0);
  }
  // 获取角色可以执行的行动
  getActions() {
    if(!this.team.state.inBattle){
      return this.getReadyActions();
    }
    if(this.checkAlive() && !this.findBuff({tag:'freeze'})) {
      return this.getBattleActions(this.checkMyTurn());
    }
    return [];
  }
  // 执行攻击行动
  actionAttack(func, type, target, atkType, en, rawDmg, hits, diffHits, options) {
    let count = 0;
    if(atkType === 'random') {
      count = hits;
      hits = [1];
    }
    A.actionAttack({ type, member:this, target, atkType, hits, diffHits, count, options }, func, ()=>A.simpleDmg(this.base.type, en, rawDmg));
  }
  // 执行治疗行动
  actionHeal(func, type, target, tarType, heal, en, healDiff = 0, healCount = 1) {
    A.actionHeal({type, member:this, target, tarType, count: healCount }, func, (data, target)=>{
      return C.calHealData((healDiff && data.idx>0)? healDiff: heal, this, target);
    })
    if(en)this.addEn(en)
  }
  // 采取行动
  castAction(data) {
    if(D.checkType(data.type, 'AA')) {
      const { type, target, atkType, en, rawDmg, hits, diffHits, count, options, func } = data;
      if(!target || (typeof target !== 'string' && !target.checkAlive())) return;
      this.team.logger.startAction(this, {text:'追击', key: null, target});
      const fn = func || (cb => cb());
      A.actionBase({type:'AA', member:this, target }, ()=> {
        fn(()=> A.triggerAttack({
          type, member:this, target, atkType, options, hits, diffHits, count,
        },()=>A.simpleDmg(this.base.type, en, rawDmg)))
      });
    } else {
      super.castAction(data);
    }
  }
  // 使用额外治疗
  triggerHeal(targets, heal) {
    A.triggerHeal({type: 'AH', member:this, targets}, (d)=> C.calHealData(heal, this, targets[d.idx]));
  }
  // 触发追加攻击
  castAdditionAttack(target, atkType, en, rawDmg, hits, diffHits, options, func) {
    const data = { type: 'AA', target, atkType, en, rawDmg, diffHits, options, func}
    if(typeof hits === 'number') {
      data.count = hits;
    } else {
      data.hits = hits;
    }
    this.pushAction(data);
  }
  // 获取准备阶段的行动
  getReadyActions() { return []};
  // 获取战斗阶段可以执行的行动
  getBattleActions(/* isMyTurn */) { return []};
  // 检查生命值是否大于或小于等于某个百分比
  checkHp(percent, checkGT = false) {
    const le = this.state.hp <= this.getAttr('hp') * percent * 0.01;
    return checkGT? !le : le;
  }
  // 获取当前状态
  getState() {
    return Object.assign({
      hpMax: this.getAttr('hp'),
    }, this.state);
  }
  // 重制状态
  resetState(/*isReborn = false*/) {
    this.state = {
      statistics: {
        naC: 0, nsC: 0, usC: 0, aaC: 0, dotC:0, brkC:0, adC:0, etcC: 0, // 各种行动触发次数
        naD: 0, nsD: 0, usD: 0, aaD: 0, dotD:0, brkD:0, adD:0, etcD: 0, // 各种行动对应伤害值
        naE: 0, nsE: 0, usE: 0, aaE: 0, dotE:0, brkE:0, adE:0, etcE: 0, // 各种行动对应期望伤害值
        atkedC: 0, // 受到攻击次数
        healedC: 0, healed: 0, //受到治疗的次数和治疗量
        healC: 0, heal: 0, // 治疗次数和治疗量
        enGet: 0, // 累计能量获取
      },
      hp: this.getAttr('hp'),
      wait: this.calActionTime(),
      turn: 0, // 单位的回合数
      damage: 0, // 实际伤害
      expDamage: 0, // 期望伤害
      damaged: 0, // 承受伤害
    };
  }
  // 追加伤害统计值
  setDmgStat(data) {
    const dmg = data.damage;
    const dmgE = data.expDamage;
    const type = D.checkType(data.type, ['NA','NS','US','SP']) || D.checkType(data.type, ['AA','AD','DOT','BRK']) || 'ETC';
    const tk = type==='SP'? 'etc': type.toLowerCase();
    const stat = this.state.statistics;

    this.state.damage += dmg;
    this.state.expDamage += dmgE;
    stat[tk+'D'] += dmg;
    stat[tk+'E'] += dmgE;
    if(data.idxH<=0 && data.idxT===0 && ['na','ns','us'].indexOf(tk) < 0){
      stat[tk+'C']++;
    }
  }
  // 更新冷却回合信息，并返回是否可以触发事件
  updateCD(count, key, allTurn = false, trigger = true) {
    const curTurn = allTurn? this.team.state.turn : this.state.turn;
    const turn = this.state[key];
    if((turn || turn === 0 ) && curTurn - turn < count) {
      return false;
    }
    if(trigger)this.state[key] = curTurn;
    return true;
  }
  // 判断单位是否存活
  checkAlive(data = null) {
    if(data && this.state.hp <= 0) this.triggerEvent('BEFORE_DEATH', data);
    return this.state.hp > 0;
  }
  // 修改生命值
  changeHp(value, unit, source, killType = null) {
    if(!this.checkAlive() || value === 0) return;
    let hp = this.state.hp;
    const data = { member: unit, target:this, source, hp, change: value }
    this.team.clearTargetCache(this);
    hp = Math.min(this.getAttr('hp'), Math.max(0, hp + value ));
    this.state.hp = hp;
    this.triggerEvent('HP_CHANGE', data);

    if(killType && hp <= 0) {
      const killData = {member: unit, target: this, type: killType};
      this.triggerEvent('BEFORE_DEATH', killData);
      if(this.state.hp <= 0)this.triggerEvent('B_KILL', killData);
    }
    return this.state.hp > 0;
  }
  // 重生
  reborn () {
    this.resetState(true);
    this.triggerEvent('REBORN', {});
    this.team.updateActionUnit(this);
  }
  // 移除所有buff
  removeAllBuffs() {
    const buffs = this.team.buffManager.filterBuffs({ target: this.name });
    while(buffs.length > 0) {
      const buff = buffs.shift();
      this.removeBuff(buff, false);
    }
  }
  // 响应事件
  onEvent(e, unit, data) {
    if(this.needUpdate && (unit !== this || e!=='UPDATE_DATA')) this.updateData();
    if(unit === this) {
      switch(e) {
        case 'C_HIT_E':
          {
            data.attacker.setDmgStat(data);
            const type = D.checkType(data.type,['DOT','BRK'])? data.type: (data.isCri? 'CRIT': 'NORMAL');
            this.team.logger.logDamage(data.attacker, data.target, data.damage, data.expDamage, Array.isArray(type)? type[0] : type);
            break;
          }
        case 'ACT_S':
          {
            const type = D.checkType(data.type,['NA','NS','US'])
            if(type)this.state.statistics[type.toLowerCase()+'C']++;
          }
          break;
        case 'B_ATK_E':
          this.state.statistics.atkedC++;
          break;
        case 'B_HIT_E':
          this.onHit(data);
          break;
        case 'CURE_S':
          this.state.statistics.healC++;
          break;
        case 'B_HEAL_E':
        {
          const ss = this.state.statistics;
          this.changeHp(data.heal, data.member, 'heal', false);
          ss.healedC++;
          ss.healed += data.heal;
          data.member.state.statistics.heal += data.heal;
          this.team.logger.logHeal(data.member, this, data.heal);
          break;
        }
        case 'EN_CHANGE':
          if(data.after > data.before) {
            this.state.statistics.enGet += data.after - data.before;
          }
          break;
        case 'B_KILL':
          this.removeAllBuffs();
          this.team.updateActionUnit(this);
          this.team.logger.logDie(this);
          break;
        default:
          break;
      }
    }
    super.onEvent(e, unit, data);
  }
  // 响应受到伤害事件
  onHit(data) {
    const { member, damage, blocked, brkDmg } = data;
    const hpChange = Math.max(0, damage - (blocked || 0));
    this.state.damaged += damage;
    if(brkDmg && this.faction==='enemies'){
      const cData = data[this.name];
      cData.brkDmg = (cData.brkDmg || 0) + brkDmg;
      if(this.state.shield===0) cData.brkDmgEx = (cData.brkDmgEx || 0) + brkDmg;
    }
    this.changeHp(-hpChange, member, 'damage', false);
  }
  // 添加日志
  addLog(type, text) {
    this.logs.unshift({ type, text });
  }
  // 清空日志
  clearLogs() {
    this.logs = [];
  }
  // 获取影子buff属性
  getShadowBuffData(buff, enemy, attr) {
    const ba = buff.getAttributes(this);
    if(ba)attr.mergeAttributes(ba);
    const bt = enemy? buff.getAttributesT(enemy, this): {};
    if(bt)attr.mergeAttributes(bt);
  }
  // 获取影子buff的转模属性
  getShadowBuffTrans(buff, attr, transList) {
    const trans = buff.getTransAttr(this);
    if(trans) {
      if(buff.member !== this){
        attr.mergeAttributes(this.getTransData(buff.member, trans));
      } else {
        const newTrans = {}
        const result = this.getTransData(this, trans);
        for(let key in trans) {
          if(result[key] && ((trans[key].max && result[key]>=trans[key].max-0.001) || (!trans[key].rate && result[key]>=trans[key].add-0.001))) {
            attr.mergeAttributes({ [key]: result[key] })
          } else {
            newTrans[key] = trans[key];
          }
        }
        transList.push(newTrans);
      }
    }
  }
}

module.exports = BattleUnit;