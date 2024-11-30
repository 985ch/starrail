// components/my-bar.js.js
Component({
  properties: {
    value: {
      type: Number,
      value: 0,
    },
    max: {
      type: Number,
      value: 0,
    },
    maxWidth: {
      type: Number,
      value: 100,
    }
  },
  data: {
    percent: 0,
    width: 1,
    color: "RGB(255,0,0)",
  },
  observers: {
    "value,max":function() {
      const {max, value, maxWidth} = this.data;
      const percent = max>0? value/max: 0;
      const width = maxWidth * percent;
      const color = `RGB(${Math.min(255,Math.floor(percent*2*255))},${Math.min(255, Math.floor((1-percent)*2*255))}, 0)`;
      this.setData({ percent, color, width: width || 1});
    }
  }
})