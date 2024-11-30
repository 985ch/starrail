const D = require('../../simulator/data');
const { setsClass } = require('../../simulator/equipments/index');

Component({
  properties: {
    equip: {
      type: Object,
      value: null,
    },
    showTag: {
      type: Boolean,
      value: false,
    },
    mini: {
      type: Boolean,
      value: false,
    },
    selected: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    attrText: '?',
    image: '/images/base/empty.png',
  },
  methods: {
  },
  observers: {
    equip: function(e) {
      if (e) {
        const prefix = setsClass[e.name].getDesc().image
        const image = `/images/equip/${prefix}_${e.part}.png`
        this.setData({
          image,
          attrText: D.AttributeText[e.main].s || '?',
        });
      } else {
        this.setData({
          image: '/images/base/empty.png',
          attrText: '?',
        });
      }
    }
  }
})