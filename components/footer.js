const changeLogs = [
  '2.6.0 追加2.6的角色，光锥和遗器',
  '2.5.3 导入JSON格式更新',
  '2.5.2 新增灵砂',
  '2.5.1 新增飞霄，貊泽。新增2.5的新光锥及遗器'
]
Component({
  properties: {

  },
  data: {
    version: '',
    showLogDlg: false,
    showThanksDlg: false,
    logs: changeLogs,
    thanksList:[[],[]],
  },
  methods: {
    // 打开修改日志窗口
    onLogDlg() {
      this.setData({showLogDlg: true})
    },
    // 打开支持窗口
    onThanksDlg() {
      if(!getApp().globalData.thanksList) {
        const table = wx.cloud.database().collection('setting');
        table.doc('thanks').get().then(res => {
          const list = [ res.data.listA, res.data.listB ];
          getApp().globalData.thanksList = list;
          this.setData({thanksList: list, showThanksDlg: true });
        }).catch(err=>{
          wx.showToast({title: '读取感谢名单失败', icon: 'none'})
        })
      } else {
        this.setData({thanksList: getApp().globalData.thanksList, showThanksDlg: true});
      }
    },
  },
  lifetimes: {
    attached() {
      const { version } = wx.getAccountInfoSync().miniProgram;
      this.setData({ version })
    },
  }
})