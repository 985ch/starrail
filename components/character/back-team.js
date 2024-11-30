const D = require('../../simulator/data');
const { pick } = require('../../utils/util');
const { getImage } = require('../../utils/imgset.js');
Component({
  properties: {
    tid: {
      type: Number,
      value: 1,
    },
    character: {
      type: String,
      value: '',
    }
  },
  data: {
    dmgTypeInfo: D.DamageTypeInfo,
    images: {},

    curChar: -1, // 当前角色索引
    charBase: {}, // 角色基础数据
    skillText: '-', // 技能数据
    weapon: { name:'-未装备光锥-'}, // 角色武器
    equips: [null, null, null, null, null, null], // 角色装备
    members: [], // 队伍成员
    enemy: null, // 当前敌人
    enemyIdx: -1, // 当前敌人索引
  },
  methods: {
    updateData(tid, charName) {
      // 获得所有队友数据
      const { images } = this.data;
      const team = getApp().team(tid);
      if(!team) return;
      const members = team.members.map(m => {
        if(!m) return null
        if(!images[m.name]) {
          images[m.name] = getImage('char/' + m.base.image, file => this.setData({["images." + m.name]: file }));
        }
        return {
          name: m.name,
          rarity: m.base.rarity,
          soul: m.soul,
          level: m.level,
        };
      });
      // 获取当前敌人的数据
      if(!team.enemies[team.curEnemy]) {
        team.curEnemy = team.enemies.findIndex(e => e);
      }
      const enemy = team.enemies[team.curEnemy].toJSON();
      // 获取角色数据
      const curChar = members.findIndex(m => m && m.name === charName);
      if(curChar<0) {
        this.setData({ curChar, skillText: '-', members, enemy, enemyIdx: team.curEnemy, images });
        return;
      }
      // 获取当前角色的遗器，光锥和技能数据
      const character = team.members[curChar];
      const skillText = character.getSkillLevels().map(arr=>arr[0]+arr[1]).join('-');
      const base = character.base;
      const weapon = character.weapon;
      let wData;
      if(weapon){
        wData = pick(weapon, ['star', 'level']);
        wData.name = weapon.base.name;
        wData.rarity = weapon.base.rarity;
      } else {
        wData = { name:'-未装备光锥-' };
      }
      this.setData({ curChar, members, enemy, enemyIdx: team.curEnemy, charBase: base, weapon: wData, skillText, images });
    },
    onSwitchTeam() {
      const { tid } = this.data;
      if(tid!==1) return;
      this.triggerEvent('switch', {});
    },
    onSyncTeam() {
      const { tid, character } = this.data;
      if(tid!==1) return;

      const self = this;
      wx.showModal({
        title: '注意',
        content: '同步后，后台队伍数据将会和当前队伍一致！',
        success (res) {
          if (res.confirm) {
            self.triggerEvent('sync', {});
          } else if (res.cancel) {
            // do nothing
          }
        }
      })
    }
  },
  observers: {
    'tid,character': function (tid, character) {
      this.updateData(tid, character);
    }
  }
})