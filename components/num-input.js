// components/num-input.js
Component({
  properties: {
    value: {
      type: Number,
      value: 0,
    },
    min: {
      type: Number,
      value: 0
    },
    max: {
      type: Number,
      value: 100
    },
  },
  data: {
    val: '',
  },
  methods: {
    onInput(e) {
      const value = e.detail.value.replace(/\D/g, '');
      if(value.length === 0) return value;
      const {max} = this.data;
      const val = Math.min(max, parseInt(value));
      return val;
    },
    onConfirm(e) {
      this.onChange(e);
    },
    onBlur(e) {
      this.onChange(e)
    },
    onChange(e) {
      const { value, min } = this.data;
      if(e.detail.value==='') {
        this.setData({val: value});
        return;
      };
      let val = parseInt(e.detail.value);
      if(val < min) {
        val = min;
        this.setData({val: min})
      }
      if(value !== val) this.triggerEvent('change', { value: val });
    },
    onFocus(e){
      if(e._userTap) this.setData({val:''});
    }
  },
  observers: {
    value(val) {
      this.setData({val: val.toString()})
    }
  }
})