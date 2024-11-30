// components/my-drawer.js
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '对话框标题',
    },
    confirmText: {
      type: String,
      value: '',
    },
    cancelText: {
      type: String,
      value: '关闭',
    },
    height: {
      type: Number,
      value: 0,
    },
    overwriteCancel: {
      type: Boolean,
      value: false,
    },
    zindex: {
      type: Number,
      value: 98,
    }
  },
  data: {
    isShow: false,
    animation: {},
  },
  methods: {
    onConfirm() {
      this.triggerEvent('confirm', {});
    },
    onCancel(){
      if(this.data.overwriteCancel) {
        this.triggerEvent('cancel', {});
      } else {
        this.setData({ show: false });
      }
    },
    doNothing() {}
  },
  observers: {
    show: function (value) {
      if(value) {
        let ani = wx.createAnimation({ duration:200 });
        ani.opacity(1).step()
        this.setData({
          isShow: true,
        }, () => {
          this.setData({
            animation: ani.export(),
          });
        });
      } else {
        let ani = wx.createAnimation({ duration:200 });
        ani.opacity(0).step()
        this.setData({
          animation: ani.export(),
        });
        setTimeout(()=>{
          this.setData({ isShow: false});
        }, 250);
      }
    }
  }
})
