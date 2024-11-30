class TeamLogger {
  constructor(team) {
    this.team = team;
    this.logs = []; // 战斗日志
    this.tempLog = null; // 临时日志
    this.tempInfo = null; // 临时信息
    this.stat = {}; // 不同行为统计数据
  }
  // 清空日志
  clear() {
    this.logs = [];
    this.tempLog = null;
    this.tempInfo = null;
    this.stat = {};
    this.team.timeline.clear();
  }
  // 处理成JSON数据
  toJSON() {
    return {
      logs: this.logs,
      stat: this.stat,
    }
  }
  // 从JSON数据恢复
  fromJSON(json) {
    if(!json) return;
    this.logs = json.logs;
    this.stat = json.stat;
    this.tempLog = null;
    this.tempInfo = null;
  }
  // 开始记录日志
  startAction(unit, action) {
    if(this.tempLog)this.finishAction();
    const log = {
      t: this.team.state.t,
      unit: unit? unit.name: null, // 行动对象
      actUnit: null, // 当前行动对象，即当前处于谁的回合中
      target: null, // 目标对象
      action: action.text, // 行动文本
      key: (unit && unit.faction==='members' && !action.noRecord)? action.key || null: null, // 行动关键字
      count: 0, // 第几次同类行动
      info: '', // 额外信息
      damage: 0, // 实际伤害
      expDamage: 0, // 期望伤害
      heal: 0, // 实际治疗
      data: {}, // 行动信息，包括每个角色受到的伤害，治疗，buff和是否在本次行动中被击倒
      deaths: [], // 击倒目标名单
      buffs: [], // buff一览数组
      dmgT: [], // 伤害目标数组
      healT: [], // 治疗目标数组
    };
    const info = {
      actUnit: this.team.getActionUnit(unit),
      owner: unit? (unit.owner || unit ): null, // 所属角色
      ignoreEmpty: action.ignoreEmpty || false, // 是否忽略空日志
      target: (action.target && action.tarType!=='self' && typeof action.target === 'object')? action.target.name: null, // 选中目标
      tarRaw: action.tarRaw || 'sel', // 选中目标来源，包括'sel','dmg','heal','buff'
      buffs: [], // buff全名数组
      data: {}, // 行动信息临时数据，最后不会在日志中出现的部分
      dmgFaction: null, // 伤害目标阵营
      healFaction: null, // 治疗目标阵营
    };
    if(unit) {
      info.healFaction = unit.faction;
      info.dmgFaction = unit.faction==='members'? 'enemies':'members';
      log.dmgT = this.team[info.dmgFaction].filter(e=>e).map((u)=>({name: u.name, hit: 0}));
      log.healT = this.team[unit.faction].filter(u=>u).map(u=>({name: u.name, hit: 0}))
    }
    this.tempLog = log;
    this.tempInfo = info;
  }
  // 开始记录非主动触发日志
  startActionS(unit, text, ignoreEmpty = false) {
    this.startAction(unit, { text, key: null, target: null, ignoreEmpty });
  }
  // 初始化目标信息
  initData(tar) {
    if(this.tempLog.data[tar]) return;
    this.tempLog.data[tar] = {
      death: false,
      tags: [],
    }
    this.tempInfo.data[tar] = {
      buffs: [],
    }
  }
  // 更新行动目标
  updateTarget(tar, tarRaw) {
    const info = this.tempInfo;
    if(tarRaw===info.tarRaw && !info.target ) info.target = tar;
  }
  // 记录额外信息
  logInfo(text) {
    if(!this.tempLog) return;
    this.tempLog.info += text;
  }
  // 记录伤害
  logDamage(attacker, target, dmg, expDmg, dType) {
    if(!this.tempLog || (dmg===0 && expDmg===0)) return;
    const log = this.tempLog;
    const info = this.tempInfo;
    log.damage += dmg;
    log.expDamage += expDmg;
    const tar = target.name;
    const unit = attacker?attacker.name:null;
    this.initData(tar);
    this.updateTarget(tar, 'dmg');
    const data = log.data[tar];
    data.tags.push({t:'dmg', dmg, expDmg, dType, unit: unit !== info.owner.name ? unit : null });
    if(target.faction === info.dmgFaction) {
      const idx = log.dmgT.findIndex(e=>e.name===tar);
      if(idx>=0)log.dmgT[idx].hit += 1;
    }
  }
  // 记录治疗
  logHeal(caster, target, heal) {
    if(!this.tempLog || heal===0) return;
    const log = this.tempLog;
    const info = this.tempInfo;
    log.heal += heal;
    const tar = target.name;
    const unit = caster?caster.name:null;
    this.initData(tar);
    this.updateTarget(tar, 'heal');
    const data = log.data[tar];
    data.tags.push({t:'heal', heal, unit: unit !== info.owner.name? unit : null });
    if(target.faction === this.tempInfo.healFaction) {
      const idx = log.healT.findIndex(e=>e.name===tar);
      if(idx>=0)log.healT[idx].hit += 1;
    }
  }
  // 记录阵亡
  logDie(target) {
    if(!this.tempLog) return;
    const log = this.tempLog;
    const tar = target.name;
    this.initData(tar);
    log.data[tar].death = true;
    log.deaths.push(tar);
  }
  // 记录状态变化
  logBuff(target, buff, type) {
    if(!this.tempLog || buff.isStatic() || !buff.getInfo().show)return;
    const log = this.tempLog;
    const buffs = this.tempInfo.buffs;
    const info = buff.getInfo();
    const targets = ['members','enemies'].includes(target)? this.team.getAliveUnits(target): [ this.team.getCharacter(target)];
    const faction = targets.length>0? targets[0].faction: target;
    type = type==='remove'? type: 'add';
    targets.forEach(t=>{
      this.initData(t.name);
      const tags = log.data[t.name].tags;
      const i = tags.findIndex(tag=> tag.t==='buff' && tag.member===buff.member.name && tag.name === info.name && tag.type === type);
      if(i<0) {
        tags.push({
          t: 'buff',
          member: buff.member.name,
          name: info.name,
          short: info.short,
          type,
          value: buff.value,
        })
      } else {
        tags[i].value = buff.value;
      }
    })
    const flag = type === 'remove'? '-':'+';
    if(buffs.findIndex(b => b.member===buff.member && b.name === info.name && b.flag === flag) < 0) {
      buffs.push({member: buff.member, name:info.name, flag });
      log.buffs.push({tag:flag + info.short, flag: faction==='members'? 'member': 'enemy'});
    }
  }
  // 完成一组行动
  finishAction() {
    if(!this.tempLog) return;
    const log = this.tempLog;
    const info = this.tempInfo;
    if(info.ignoreEmpty && log.info==='' && log.damage===0 && log.heal===0 && log.deaths.length===0 && log.buffs.length===0) return;
    log.target = info.target;
    // 展示各项数值
    for(let tar in log.data) {
      let dmg = 0;
      let heal = 0;
      let buffs = [];
      log.data[tar].tags.forEach(tag => {
        if(tag.t === 'dmg') {
          dmg += tag.dmg;
        } else if(tag.t === 'heal') {
          heal += tag.heal;
        } else if(tag.t === 'buff') {
          buffs.push({type: tag.type==='remove'?'remove':'add', name: tag.name});
        }
      });
      const unit = this.team.getCharacter(tar);
      if(dmg>0) unit.addLog('dmg','-'+Math.floor(dmg));
      if(heal>0) unit.addLog('heal','+'+Math.floor(heal));
      if(buffs.length>0) {
        buffs.forEach(tag => unit.addLog(tag.type, (tag.type==='add'?'+':'-')+tag.name));
      }
    }
    // 添加日志
    this.logs.push(log);
    // 添加统计数据
    const key = `${log.unit}#${log.action}`;
    const stat = this.stat[key] || { damage: 0, expDamage: 0, maxDamage:0, minDamage:0, heal:0, count:0 }
    stat.damage += log.damage;
    stat.expDamage += log.expDamage;
    stat.maxDamage = Math.max(stat.maxDamage, log.damage);
    if(log.damage>0) stat.minDamage = stat.minDamage>0? Math.min(stat.minDamage, log.damage): log.damage;
    stat.heal += log.heal;
    stat.count += 1;
    log.count = stat.count;
    // 更新当前行动对象
    if(info.actUnit && info.actUnit.name !== log.unit) log.actUnit = info.actUnit.name;

    this.tempLog = null;
    this.tempInfo = null;
    this.stat[key] = stat;
    // 记录排轴数据
    if(log.key) {
      this.team.timeline.addAction(log);
    }
  }
}

module.exports = TeamLogger;