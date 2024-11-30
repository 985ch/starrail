const { AttributeText }=require('../../simulator/data');
Component({
  properties: {
    grey: {
      type: Boolean,
      value: false,
    },
    attr: {
      type: String,
      value: '',
    },
    value1: {
      type: Number,
      value: 0,
    },
    value2: {
      type: Number,
      value: 0,
    },
  },
  lifetimes: {
  },
  data: {
    label: '',
    value: 0,
    compare: 0,
    color: '',
  },
  methods: {
    updateData(attr, value1, value2) {
      const label = AttributeText[attr].short;
      let value;
      let compare;
      if(AttributeText[attr].type !== 'percent'){
        value = Math.floor(value1);
        compare = Math.abs(value1-value2) < 0.05? 0 :(value1 > value2? '+' : '') + (value - Math.floor(value2));
      } else { // percent
        value = fix( value1 ) + '%';
        compare = Math.abs(value1-value2) < 0.05? 0 :(value1>value2? '+' : '') + fix(value1-value2) + '%';
      }
      color = compare === 0 ? '' : ( value1-value2>0? 'red': 'green');
      this.setData({ label, value, compare, color });
    }
  },
  observers: {
    ['attr,value1, value2']:function(attr, value1, value2) {
      this.updateData(attr, value1, value2);
    }
  }
})

function fix(num) {
  return (Math.floor(num*10)*0.1).toFixed(1);
}
