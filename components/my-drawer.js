// components/my-drawer.js
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    height: {
      type: Number,
      value: 350,
    },
  },
  data: {
    isShow: false,
    animation: {},
  },
  methods: {
    onCancel(){
      this.setData({ show: false });
    }
  },
  observers: {
    show: function (value) {
      if(value) {
        let move = wx.createAnimation({ duration:150 });
        move.translateY(0).step()
        this.setData({
          isShow: true,
        }, () => {
          this.setData({
            animation: move.export(),
          });
        });
      } else {
        const pos = this.data.height;
        let move = wx.createAnimation({ duration:150 });
        move.translateY(pos).step()
        this.setData({
          animation: move.export(),
        });
        setTimeout(()=>{
          this.setData({ isShow: false});
        }, 200);
      }
    }
  }
})
