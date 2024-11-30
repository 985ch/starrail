const { setNames, setsClass } = require('../../simulator/equipments/index')
Component({
  properties: {
    tips: {
      type: Array,
      value: [
        '外圈4件套请选两个一样的选项，只选一个按“2+散件”算',
        '内圈建议锁定套装，因为内圈2件套加成较明显',
      ]
    },
    set4: {
      type: Array,
      value: [null, null],
    },
    set2: {
      type: String,
      optionalTypes: [null],
      value: null,
    }
  },
  data: {
    setNames: [[],[]],
  },
  methods: {
    onSelSet4(e) {
      const { set2, set4 } = this.data;
      const { index } = e.currentTarget.dataset;
      const idx = e.detail.value;
      set4[index] = idx===0? null: this.data.setNames[0][idx];
      this.setData({ set4 },()=>{
        this.triggerEvent('change', { set4, set2 });
      });
    },
    onSelSet2(e) {
      const { set4 } = this.data;
      const idx = e.detail.value;
      const set2 = idx===0? null: this.data.setNames[1][idx];
      this.setData({ set2 }, ()=>{
        this.triggerEvent('change', { set4, set2 });
      })
    }
  },
  lifetimes: {
    ready() {
      this.setData({
        setNames: [
          ['未指定套装'].concat(setNames[0]),
          ['未指定套装'].concat(setNames[1]),
        ]
      })
    }
  },
})