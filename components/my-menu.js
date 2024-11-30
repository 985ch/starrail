// components/my-menu.js
Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    offset: {
      type: String,
      value: '0'
    },
    position: {
      type: String,
      value: 'right'
    },
    animate: {
      type: String,
      value: 'top'
    }
  },
  data: {
    show: false,
    isShow: false,
  },
  methods: {
    showMenu() {
      this.setData({show: true})
    },
    hideMenu() {
      this.setData({show: false})
    }
  },
  observers: {
    show: function(val){
      const { animate } = this.data;
      const dataHide = {scaleY:0, transformOrigin:animate};
      const dataShow = {scaleY:1, transformOrigin:animate};
      if (val) {
        this.setData({isShow: true},()=>{
          this.animate('#menu', [dataHide, dataShow], 100);
        })
      } else {
        this.animate('#menu', [dataShow, dataHide], 100, ()=>{
          this.setData({isShow: false});
        });
      }
    }
  }
})