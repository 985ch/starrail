// components/number-label.js
Component({
  properties: {
    label: {
      type: String,
      value: 'label',
    },
    value: {
      type: Number,
      value: 0,
    },
    compare: {
      type: Number,
      value: 0,
    },
    flip: {
      type: Boolean,
      value: false,
    },
    width: {
      type: String,
      value: 'normal',
    },
    fixed: {
      type: Number,
      value: 1,
    },
    type: {
      type: String,
      value: 'integer', // float, percent
    },
    simple: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    text: '0',
    compareStyle: '',
    compareText: '-',
  },
  methods: {
    onTap() {
      this.triggerEvent('select', {
        value: this.data.value,
      });
    }
  },
  observers: {
    'value,compare': function(v){
      const { type, fixed, flip, value, compare } = this.data;
      const styles = flip ? ['green', 'red'] : ['red', 'green'];
      const isSame = Math.abs(compare) < 0.005;
      const changeValue = formatNumber(compare, fixed, type, true)
      const changePercent = type==='integer'? `(${formatChanged(value, compare)})`: '';
      const data = {
        text: formatNumber(value, fixed, type, false),
        compareText: isSame ? '-': `${(compare>0?'+':'')}${changeValue}${changePercent}`,
        compareStyle: isSame ? '': styles[compare > 0 ? 0 : 1],
      };
      this.setData(data);
    }
  }
})
function formatNumber(value, fixed, type, simple) {
  if(type==='integer') {
    return !simple || value<100000 ? Math.floor(value): Math.floor(value/1000) + 'k';
  }
  const n = Math.pow(10, fixed);
  return (Math.floor(value * n)/n).toFixed(fixed) + (type==='percent' ? '%' : '')
}
function formatChanged(value, compare) {
  let changed = Math.abs(compare/(value - compare));
  if(changed<10) {
    return (100 * changed).toFixed(1) + '%';
  } else {
    return changed.toFixed(0) + '倍';
  }
}