// components/timeline/action.js
Component({
  properties: {
    index: {
      type: Number,
      value: 0,
    },
    data: {
      type: Object,
      value: null,
      observer(data) {
        this.setData({
          action: data.action,
          cmp: data.cmp || null,
        });
      }
    },
    images: {
      type: Object,
      value: {}
    },
    selected: {
      type: Boolean,
      value: false
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
    action: {
      unit:'虎克', action:'普攻', key:'na', target:'木人桩1',
      state:{
        t:0, sp:0, spMax:5, damage: 0, expDamage: 0
      }
    },
    cmp: null,
  },
  methods: {
  }
})