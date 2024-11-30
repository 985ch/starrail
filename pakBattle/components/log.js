// components/battle/log.js
Component({
  properties: {
    log: {
      type: Object,
      value: {
        t: 0,
        unit: null,
        target: null,
        action: '',
        key: null,
        info: '',
        damage: 0,
        expDamage: 0,
        heal: 0,
        data: {},
        deaths: [],
        buffs: [],
        dmgT: [],
        healT: [],
      },
      observer(val) {
        this.updateData(val);
      }
    },
    images: {
      type: Object,
      value: {},
    },
    gray: {
      type: Boolean,
      value: false
    }
  },
  data: {
    imgIdx: {
      '木人桩1': 1,
      '木人桩2': 2,
      '木人桩3': 3,
      '木人桩4': 4,
      '木人桩5': 5,
    },
    tags: [],
    kills: 0,
  },
  methods: {
    onShowDlg() {
      this.triggerEvent('showLog', this.data.log );
    },
    updateData(log) {
      const tags = [];
      for(let buff of log.buffs) {
        const isRemove = buff.tag[0] === '-';
        const isEnemy = buff.flag === 'enemy';
        tags.push({
          tag: buff.tag,
          color: isRemove ? (isEnemy?'green':'blue'):(isEnemy?'purple':'orange')
        });
      }
      this.setData({tags, kills:log.deaths.length});
    }
  }
})