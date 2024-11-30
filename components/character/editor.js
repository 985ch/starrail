const { stringifyEquip, importEquips } = require('../../simulator/equip_generator');
const { importEquipsFromWX } = require('../../simulator/ocr_parser');
const { createCharacter } = require('../../simulator/characters/index');
const { weaponsData, weaponsJson } = require('../../simulator/weapons/index');
const D = require('../../simulator/data');
const { pick, clone } = require('../../utils/util');
// 计算等级突破选项数组
function getLevelArray(){
  const list = [];
  for(let i = 1; i <= 80; i++) {
    list.push({ text: i, level: i, upgraded: false });
    if( i%10 === 0 && i!==10 && i!==80 ) {
      list.push({ text: i + '[破]', level: i, upgraded: true });
    }
  }
  return list;
}
// 根据等级和是否突破得到索引
function getLevelIndex(level, upgraded) {
  if(level <= 20 ) return level - 1;
  return Math.floor((level - 1)/10) - 2 + level + (upgraded ? 1 : 0);
}

Component({
  properties: {
    tid: {
      type: Number,
      value: 0
    },
    curMember: {
      type: Number,
      value: 0,
    },
  },
  data: {
    charName: '虎克', // 角色名称
    levelList: getLevelArray(), // 等级列表
    charSoul: 0, // 角色星魂等级
    charLvIdx: 0, // 角色等级索引

    weaponList: weaponsData, // 武器列表
    weaponSel: [0, 0], // 当前选中用武器
    weapon: {}, // 武器基础数据
    weaponStar: 5, // 武器星级
    weaponLvIdx: 0, // 武器等级索引
    weaponDesc: '', // 武器描述

    exSkList: [], // 额外能力列表
    attrList: [], // 额外属性列表
    skills:{ }, // 基本技能等级
  },
  methods: {
    // 角色变更
    onCharacterChange(e) {
      const { tid, curMember } = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      
      const { character } = e.detail;
      team.setMember(curMember, createCharacter(team, curMember, character.name, character));
      this.triggerEvent('update');
    },
    // 武器变更
    onWeaponChange(e) {
      const weapon = pick(weaponsJson[e.detail.name].data, ['name', 'rarity']);
      this.setData({ weapon },()=>{
        this.onSetup();
      });
    },
    // 技能等级变更
    onSkillLvChange(e) {
      this.setData({
        ["skills." + e.currentTarget.dataset.key]: e.detail.value,
      },()=>{
        this.onSetup();
      });
    },
    // 被动技能变更
    onExSkillChange(e) {
      this.setData({
        ['skills.ex[' + e.currentTarget.dataset.index + ']']: e.detail.checked ? 1 : 0,
      },()=>{
        this.onSetup();
      });
    },
    // 额外属性变更
    onAttrChange(e) {
      this.setData({
        ['skills.attr['+ e.currentTarget.dataset.index + ']']: e.detail.checked ? 1 : 0,
      },()=>{
        this.onSetup();
      });
    },
    onWeaponStarChange(e) {
      this.setData({ weaponStar: e.detail.value },()=>{
        this.onSetup();
      });
    },
    OnWeaponLvIdxChange(e) {
      this.setData({ weaponLvIdx: e.detail.value },()=>{
        this.onSetup();
      });
    },
    onCharSoulChange(e) {
      this.setData({ charSoul: e.detail.value },()=>{
        this.onSetup();
      });
    },
    onCharLvIdxChange(e) {
      this.setData({ charLvIdx: e.detail.value },()=>{
        this.onSetup();
      });
    },
    onShowEquipTip() {
      wx.showToast({
        title: '请在“遗器配装”界面修改当前遗器',
        icon: 'none',
        duration: 2000,
      })
    },
    onSetup() {
      const { tid, curMember, levelList, charLvIdx, charSoul, weapon, weaponStar, weaponLvIdx, skills } = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      const member = team.members[curMember];
      if(!member) return;

      const newWeapon = weapon.rarity? {
        name: weapon.name,
        star: weaponStar,
        level: levelList[weaponLvIdx].level,
        upgraded: levelList[weaponLvIdx].upgraded,
      } : null;

      const newJson = {
        name: member.name,
        level: levelList[charLvIdx].level,
        upgraded: levelList[charLvIdx].upgraded,
        soul: charSoul,
        skills:  skills,
        weapon: newWeapon,
        equip: member.equip.toJSON(),
      };

      team.setMember(curMember, createCharacter(team, curMember, newJson.name, newJson));
      this.triggerEvent('update');
    },
    updateData(tid, curMember) {
      const member = this.getMember(tid, curMember);
      if(!member) return;
      // 获取当前角色的光锥数据
      const weapon = member.weapon;
      const weaponData = weapon ? pick(weapon.base, ['name', 'rarity']) : { name: '-未装备光锥-' };
      const weaponStar = weapon ? weapon.star : 5;
      let weaponSel = [0, 0];
      let weaponLvIdx = 85;
      let weaponDesc = weapon? weapon.getDesc() : '';
      if(weapon) {
        const group = weaponsData.findIndex(o => o.text ===weapon.base.job);
        weaponSel = [group, weaponsData[group].data.findIndex(o => o.name === weapon.base.name )];
        weaponLvIdx = getLevelIndex(weapon.level, weapon.upgraded);
      } else {
        weaponSel[0] = weaponsData.findIndex(o => o.text === member.base.job);
      }

      // 计算额外属性的数组
      const attrList = [];
      let cur = 0;
      for(let i = 0; i < member.skills.attr.length; i++) {
        const attr = member.base.attributes[i];
        const key = Object.keys(attr)[0];
        const tInfo = D.AttributeText[key];
        if( i % 5 === 0) {
          attrList.push([]);
          cur = attrList.length - 1;
        }
        attrList[cur].push({
          idx: i,
          text: tInfo.short + (tInfo.type==='percent'? (Math.floor(attr[key]*10)*0.1).toFixed(1)+'%' : attr[key] ),
        });
      }

      this.setData({
        charName: member.name,
        charSoul: member.soul,
        charLvIdx: getLevelIndex(member.level, member.upgraded),
        weapon: weaponData,
        weaponStar,
        weaponSel,
        weaponLvIdx,
        weaponDesc,
        exSkList: member.base.es,
        attrList,
        skills: member.skills,
        state: pick(member.getState(),['hp','hpMax','en','enMax']),
      });
    },
    onStateChange(e) {
      const key = e.currentTarget.dataset.key;
      this.setData({ ['state.' + key]: e.detail.value });
    },
    getMember(tid = null, curMember = null) {
      tid = tid===null? this.data.tid: tid;
      curMember = curMember===null? this.data.curMember: curMember;
      const team = getApp().team(tid);
      if(!team) return null;
      return team.members[curMember] || null;
    },
    onStateChanged(e) {
      const member = this.getMember();
      if(!member) return;

      const key = e.currentTarget.dataset.key;
      const value = e.detail.value;
      member.state[key] = value;
      member.updateData();

      this.triggerEvent('update', { updated: true });
    },
    // 导出遗器
    onExport() {
      const member = this.getMember();
      if(!member) return;
      const equip = member.equip.equipments;
      let text = '';
      for(let key in equip) {
        const equipTxt = stringifyEquip(equip[key]);
        if(equipTxt === '') continue;
        text+= equipTxt + ';\n';
      }
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({
            title: '已复制到剪贴板',
          });
        },
      });
    },
    // 导入遗器
    onImport() {
      const self = this;
      wx.showModal({
        title: '确认导入',
        content: '确认导入剪贴板数据吗？当前遗器数据将被覆盖。',
        success: (res) => {
          if (res.confirm) {
            wx.getClipboardData({
              success: (res) => {
                if(typeof res.data !== 'string') {
                  wx.showToast({title: '剪贴板数据读取失败', icon: 'none'});
                  return;
                }
                self.importData(res.data);
              }
            });
          }
        },
      });
    },
    // 导入遗器文本
    importData(text) {
      const member = this.getMember();
      if(!member) return;

      // 先尝试按短文本导入
      let info = importEquips(text);
      if(info.equips.length===0 && info.msg) {
        // 短文本导入失败尝试用微信文本导入
        info = importEquipsFromWX(text);
      }
      // 遗器入库
      wx.showToast({
        title: info.msg || '遗器导入成功',
        icon: info.msg? 'none': 'success',
        duration: 2000,
      });
      if(info.equips.length === 0) return;
      // 替换角色身上的遗器
      const equip = this.data.equip;
      for(let e of info.equips) {
        member.equip.setEquipment(e);
      }
      this.triggerEvent('update', {});
    },
  },
  observers: {
    'tid,curMember': function (tid, curMember) {
      this.updateData(tid, curMember);
    }
  }
})