'use strict';

const { map, getValueText, clone } = require('../utils/util');
const Attributes = require('./attributes');
const { setsClass } = require('./equipments/index');
const D = require('./data');
const {stringifyEquip, getSubValue} = require('./equip_generator')

// 修正数据
const fixJson = {
  '群星璀璨的天才':'繁星璀璨的天才',
  '	机心戏梦的钟表匠':'机心戏梦的钟表匠',
}

class Equipment {
  constructor(character, equip) {
    this.character = character;
    this.attr = new Attributes();
    this.bonusAttr = {};
    this.reset();
    if(equip) {
      this.fromJSON(equip);
    }
  }
  // 重置数据
  reset() {
    this.equipments = {
      head: null,
      hand: null,
      body: null,
      foot: null,
      link: null,
      ball: null,
    };
    this.sets = {};
    this.bonusAttr = {};
    this.bonusCount = {};
    this.updateData();
  }
  // 更新装备属性
  updateData() {
    this.attr.reset();
    this.attr.mergeAttributes(map(this.equipments, e => (e ? (Object.assign({}, Equipment.getMainAttribute(e), Equipment.getSubAttributes(e))) : {})));
    this.attr.mergeAttributes(map(this.sets, obj => {
      return obj.getAttributes();
    }));
    this.attr.mergeAttributes(this.bonusAttr);
  }
  // 获取副词条数
  getAttrCount() {
    const attrs = {};
    for(let key in D.EquipSubScore) {
      attrs[key] = { key, count: 0 };
    }
    for(let part in this.equipments) {
      if(!this.equipments[part]) continue;
      for(let attr in this.equipments[part].data) {
        const cur = this.equipments[part].data[attr];
        attrs[attr].count += cur.length;
      }
    }
    return attrs;
  }
  // 设置额外词条数量
  setBonusCount(bonusCount) {
    this.bonusAttr = {};
    bonusCount = bonusCount || {};
    for(let key in bonusCount) {
      this.bonusAttr[key] = (bonusCount[key] || 0) * D.EquipSubData.SSR[key][1];
    }
    this.bonusCount = bonusCount;
  }
  // 获取装备属性
  getAttributes() {
    return this.attr.data;
  }
  // 设置装备
  setEquipment(e, update) {
    e.name = fixJson[e.name] || e.name;
    const old = this.equipments[e.part];
    if (old) {
      const oldSet = this.sets[old.name];
      if(oldSet.count <= 1) {
        this.character.removeListener(oldSet);
        delete this.sets[old.name];
      } else {
        oldSet.count--;
      }
    }
    this.equipments[e.part] = e;
    if(!this.sets[e.name]) {
      const newSet = new setsClass[e.name](this.character);
      this.sets[e.name] = newSet;
    } else {
      this.sets[e.name].count++; 
    }
    if(update) this.updateData();
  }
  // 获取全部装备的key
  getEquipmentKeys() {
    return map(this.equipments, e => {
      if(!e) return null;
      return e.key || stringifyEquip(e);
    }).filter(v => v);
  }
  // 添加全部监听
  addListens() {
    for(let key in this.sets) {
      const evt = setsClass[key].getDesc().evt;
      if(evt) {
        this.character.listenEvent(evt, this.sets[key]);
      }
    }
  }
  // 生成一个指定装备
  static generateEquipment(name, part, rarity, level, addition = false, main = null, data = null) {
    // 根据部位从部位词条里随机选一个主属性
    if (!main) {
      let n = Math.random() * 100;
      for (let i = 0; i < D.EquipPartWords[part].length; i++) {
        if (n < D.EquipPartWords[part][i].w) {
          main = D.EquipPartWords[part][i].k;
          break;
        }
        n -= D.EquipPartWords[part][i].w;
      }
    }
    // 根据等级和稀有度获得总词条数，再根据总词条数获取副属性
    if (!data) {
      data = {};
      // 生成4个子词条
      const types = [];
      while( types.length < 4) {
        const key = randomSubAttributes(main, types);
        data[key] = []
        types.push(key);
      };
      // 设置词条数值
      const addCount = (addition === false) ? 0 : ( addition === true ? 1: (Math.random() > 0.8 ? 1 : 0) );
      const wordCount = (rarity === 'SSR' ? 3 : 2) + addCount + Math.floor(level / 3);
      
      for (let i = 0; i < wordCount; i++) {
        const idx = i<4 ? i : Math.floor(Math.random() * 4);
        data[types[idx]].push(Math.floor(Math.random() * 3));
      }
    }
    return {
      name, // 套装名称
      part, // 装备部位
      rarity, // 装备稀有度
      level, // 装备等级
      main, // 主属性
      data, // 子属性
    };
  }
  // 获取装备JSON
  getEquipmentData(part) {
    const equip = this.equipments[part];
    if(!equip) return null;
    const data = {
      name: equip.name,
      level: equip.level,
      rarity: equip.rarity,
      main: this.getMainAttribute(equip),
      data: this.getSubAttributes(equip),
    };
    return data;
  }
  // 获取套装配置文本
  getSetText() {
    let texts = [];
    for(let key in this.sets) {
      const count = this.sets[key].count;
      if(count>=2) texts.push(`${setsClass[key].getDesc().short}${count===3? 2: count}`);
    }
    return texts;
  }
  // 获取套装效果描述
  getSetDesc() {
    const list = [];
    for(let key in this.sets) {
      list.push(...this.sets[key].getDescList());
    }
    return list;
  }
  // 获取装备可以提供的所有增益和减益效果
  getBuffList(){
    const list = [];
    if(!this.character) return list;
    for (let key in this.sets) {
      list.push(...this.sets[key].getBuffList());
    }
    return list;
  }
  // 获取装备的报告数据
  getReportData(target, options) {
    const list = [];
    if(!target) return list;
    for (let key in this.sets) {
      list.push(...this.sets[key].getReportData(target, options));
    }
    return list;
  }
  // 保存装备信息到JSON
  toJSON() {
    return map(this.equipments, e => e).filter(v => v);
  }
  // 加载装备信息
  fromJSON(list) {
    for(let e of list) {
      this.setEquipment(e, false);
    }
    this.updateData();
  }
  // 加载试用套装
  static generateDefaultSet(opt) {
    const { name4, name2, body, foot, link, ball } = opt;
    const json = {
      hpRate:clone(opt.hpRate) || [0, 4, 1],
      atkRate:clone(opt.atkRate) || [0, 4, 1],
      defRate:clone(opt.defRate) || [0, 4, 1],
      hp:clone(opt.hp) || [0, 1, 0],
      atk:clone(opt.atk) || [0, 1, 0],
      def:clone(opt.def) || [0, 1, 0],
      criRate:[0, 0, 5], criDamage:[0, 0, 5],
      hit:[0, 0, 5], dodge:[0, 0, 5],
      breakRate:[0, 0, 5], speed:[0, 1, 4],
    };
    const words = [body, foot, link, ball].indexOf('hpRate')<0? ['atkRate','defRate','hpRate']:['hpRate','atkRate','defRate'];
    const left = [words[2], 'speed', 'breakRate', 'hp', 'atk', 'def'];
    return [
      getDefaultEquip('body', name4, body, ['dodge','speed','breakRate'], json, left),
      getDefaultEquip('foot', name4, foot, ['hit','criRate','criDamage'], json, left),
      getDefaultEquip('link', name2, link, ['criRate','speed','dodge'], json, left),
      getDefaultEquip('ball', name2, ball, ['criDamage','hit','breakRate'], json, left),
      getDefaultEquip('head', name4, 'hp', [words[0],words[1],words[2]], json, left),
      getDefaultEquip('hand', name4, 'atk', [words[1],words[0],words[2]], json, left),
    ]
  }
  // 根据遗器主属性和遗器等级获取遗器属性
  static getMainAttribute(e, maxLevel=false) {
    return Equipment.getMainWordValue(e.main, e.rarity, maxLevel? (e.rarity==='SSR'? 15: 12): e.level);
  }
  // 根据遗器副属性配置获取遗器副属性
  static getSubAttributes(e) {
    const data = {};
    for(let attr in e.data) {
      data[attr] = getSubValue(e.data[attr], attr, e.rarity);
    }
    return data;
  }
  // 获取遗器把主副属性处理成文本元素
  static getAttributesTextInfo(e, short = true, needVal = false, fill = false) {
    // 获取主属性文本数据
    const mainObj = Equipment.getMainAttribute(e);
    const mainInfo = D.AttributeText[e.main];
    const main = {
      key: short? mainInfo.short : mainInfo.text,
      attr: e.main,
      value: getValueText(mainObj[e.main], mainInfo.type)
    };
    // 获取子属性文本数据
    const attrs = map(Equipment.getSubAttributes(e), (v, k) => {
      const info = D.AttributeText[k];
      return {
        key: short ? info.short: info.text,
        attr: k,
        value: getValueText(v, info.type),
        words: e.data[k],
        val: needVal? getSubValue(e.data[k], k, e.rarity) : 0,
      }
    
    });
    // 填充至4词条
    if(fill) {
      const keys = Object.keys(e.data);
      while(attrs.length < 4) {
        const k = randomSubAttributes(e.main, keys);
        const info = D.AttributeText[k];
        attrs.push({
          key: short ? info.short: info.text,
          attr: k,
          value: getValueText(0, info.type),
          words: [],
          val: 0,
        });
      }
    }
    return { main, attrs }
  }
  // 获取有效主词条
  static getMainWordsList(part) {
    const list = [];
    for(let item of D.EquipPartWords[part]) {
      const info = D.AttributeText[item.k];
      list.push({ text:info.text, attr: item.k, s:info.s, short: info.short });
    }
    return list;
  }
  // 根据装备获取特定副词条的有效列表
  static getSubWordsList(e) {
    const list = []
    for(let item of D.EquipSubWeights) {
      const key = item.k;
      if( !e || key !== e.main ) {
        const info = D.AttributeText[key];
        list.push({ text:info.text, attr:key, short:info.short });
      }
    }
    return list; 
  }
  // 修正错误的套装名称
  static fixEquipsName(list) {
    list.forEach(e => e.name = fixJson[e.name] || e.name);
  }
  // 获取特定主词条在指定状态下的值
  static getMainWordValue(main, rarity, level) {
    const attr = D.EquipMainData[rarity][main];
    return { [main]: attr[0] + attr[1] * level }
  }
}

// 按权重随机选出一个不重复的副词条
function randomSubAttributes(main, actives) {
  const list = D.EquipSubWeights.filter( o => !actives.includes(o.k) && o.k !== main);
  const total = list.reduce((a, b) => a + b.w, 0);
  let n = Math.floor(Math.random() * total);
  for (let i = 0; i < list.length; i++) {
    if (list[i].w < n) {
      n -= list[i].w;
    } else {
      return list[i].k;
    }
  }
  return list[0].k;
}
// 根据词条配置设置套装
function getDefaultEquip(part, name, main, words, json, left) {
  const e = {name, part,rarity:'SSR',level:15, main, data:{}};
  const n = [3, 2, 2];
  for(let i=0; i<3; i++) {
    pickWords(e.data, words[i], json, n[i]);
  }
  for(let j=0;j<left.length;j++) {
    const word = left[j];
    if(word === main || e.data[word]) continue;
    pickWords(e.data, word, json, 1);
    left.splice(j, 1);
    return e;
  }
  return e;
}
// 从对象中抽取指定个数的词条填充到data里
function pickWords(data, key, json, count) {
  data[key]=[];
  for(let i=0;i<3;i++) {
    const picked = Math.min(count, json[key][i]);
    count-=picked;
    json[key][i]-=picked;
    for(let j=0; j<picked; j++) {
      data[key].push(i);
    }
    if(count===0) return;
  }
}

module.exports = Equipment;