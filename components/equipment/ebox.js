const { setsClass }=require('../../simulator/equipments/index');
const Equipment = require('../../simulator/equipment');

Component({
  properties: {
    part: {
      type: String,
      value: 'head', //hand, body, foot, link, ball
    },
    equipment: {
      type: Object,
      value: null,
    },
    label: {
      type: String,
      value: '-',
    },
  },
  data: {
    info: {},
    main: {},
    attrs: {},
  },
  methods: {
    // 点击选中
    onSelect() {
      this.triggerEvent('select', {
        part: this.data.part,
      });
    },
  },
  observers: {
    equipment: function (json) {
      if(!json) return;
      const { main, attrs } = Equipment.getAttributesTextInfo(json);
      this.setData({
        info: setsClass[json.name].getDesc(),
        main,
        attrs,
      });
    }
  }
})