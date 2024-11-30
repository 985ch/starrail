const { DamageTypeInfo } = require('../../simulator/data');
const { getImage } = require('../../utils/imgset');
Component({
  properties: {
    index:{
      type: Number,
      value: -1,
      observer: function(val) {
        this.updateData(val);
      }
    },
    selected: {
      type: Boolean,
      value: false,
    },
    actionUnit: {
      type: String,
      value: '',
      observer: function(val) {
        this.updateBG(val);
      }
    },
    r:{
      type: Number,
      value: 0,
      observer: function(val) {
        this.updateData(this.data.index);
      }
    },
    logs: {
      type: Array,
      value: [],
    },
  },
  data: {
    name: 'enemy',
    maxShield: 8,
    shield: 0,
    hpMax: 100,
    hp: 100,
    hpColor: 'green',
    weakList: [],
    isAction: false,
    enemyJson: null,
    showRebirthDlg: false,
    image: '/images/base/unknown.png',
  },
  lifetimes: {
    attached() {
      this.setData({image: getImage('char/enemy.jpg', (file)=>this.setData({image: file}))});
    }
  },
  methods: {
    onSelected() {
      const team = getApp().team(0);
      const enemy = team.enemies[this.data.index];
      if(!enemy.checkAlive()) return;
      this.triggerEvent('sel', {index: this.data.index});
    },
    onRebirth() {
      const team = getApp().team(0);
      const enemy = team.enemies[this.data.index];
      this.setData({showRebirthDlg: true, enemyJson: enemy.toJSON()});
    },
    onEnemyChange(e) {
      const team = getApp().team(0);
      const json = e.detail.enemy;
      const { index } = this.data;
      team.setEnemy(index, json);
      team.updateData();
      this.setData({showRebirthDlg: false});
      this.triggerEvent('change', { json });
    },
    updateBG(value) {
      const team = getApp().team(0);
      const enemy = team.enemies[this.data.index];
      if(!enemy) return;
      this.setData({isAction: enemy.name === value});
    },
    updateData(index) {
      const team = getApp().team(0);
      const enemy = team.enemies[index];
      if(!enemy) {
        this.setData({ name: ''});
        return;
      }
      const percent = enemy.state.hp / enemy.getAttr('hp');
      const hpColor = percent > 0.8 ? 'green' : (percent > 0.5 ? 'orange': 'red');
      const weakList = enemy.checkAlive() ? 
        this.getWeakList(enemy):
        enemy.weakList.map(weak=>DamageTypeInfo[weak].img);
      this.setData({
        name: enemy.index+1,
        hp: enemy.state.hp,
        hpMax: enemy.getAttr('hp'),
        shield: enemy.state.shield,
        maxShield: enemy.shield,
        hpColor,
        weakList,
        isAction: enemy.name === this.data.actionUnit,
      })
    },
    getWeakList(enemy) {
      const list = [];
      const weakList = enemy.filterBuffs({tag:'weak'}).map(buff => buff.data.weak);
      for(let key in DamageTypeInfo) {
        if(weakList.includes(key)) list.push(DamageTypeInfo[key].img);
      }
      return list;
    }
  }
})