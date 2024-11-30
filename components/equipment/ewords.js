const { setsClass } = require('../../simulator/equipments/index');
const D = require('../../simulator/data');

function shortAttr(key) {
  return D.AttributeText[key].short2 || D.AttributeText[key].short;
}

Component({
  properties: {
    score: {
      type: Number,
      value: 0
    },
    simple: {
      type: Boolean,
      value: false
    },
    selectable: {
      type: Boolean,
      value: false
    },
    sets: {
      type: Array,
      value: [],
      observer(list) {
        const icons = [];
        const names = [];
        list.forEach(name => {
          const info = setsClass[name]? setsClass[name].getDesc(): null;
          if(info) {
            icons.push(`/images/equip/${info.image}_${info.set4?'head':'link'}.png`);
            names.push(info.short);
          } else {
            icons.push(`/images/base/empty.png`);
            names.push(name);
          }
        })
        this.setData({ title: names.join('+'), icons });
      }
    },
    equips: {
      type: Array,
      value: [],
      observer(list) {
        const json = {};
        list.forEach(e => json[e.part] = e.main);
        this.setData({ mainTabs: [
          D.AttributeText[json.body].short,
          D.AttributeText[json.foot].short,
          D.AttributeText[json.link].short,
          D.AttributeText[json.ball].short,
        ]})
      }
    },
    ranking: {
      type: Array,
      value: [],
      observer(values) {
        const subTabs = values.map(v => `${shortAttr(v[0])} ${v[1]}`);
        this.setData({ subTabs })
      }
    },
  },
  data: {
    title: '',
    icons: [],
    subTabs: [],
    mainTabs: [],
  },
  methods: {
    onRemove() { this.triggerEvent('remove')},
    onSelect() { this.triggerEvent('select')},
  }
})