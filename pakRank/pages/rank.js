const shared = require('../utils/share.js');
const { clone } = require('../../utils/util');

let videoAd = null; // 激励广告实例
let reloadTime = Date.now();
let searchTime = 0;
Page({
  data: {
    evt: null, // 抬头组件的事件
    viewMode: 'fav', // 浏览模式
    favList: null, // 热门队伍
    results: null, // 搜索结果
    myList: null, // 我的队伍
    groups: null, // 队伍分组

    myTeam: null, // 当前队伍数据
    members: [null, null, null, null], // 选择的队伍
    curGroup: '', // 当前分组
    showGroupPicker: false, // 是否显示分组选择
    showMemberPicker: false, // 是否显示成员选择
    count: 0, // 记录总数
    searchMode: 'name', // 搜索条件
    teamId: '', // 输入的队伍ID
  },
  onLoad(options) {
    if (!videoAd && wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-35f4e603b7c5381b'})
      videoAd.onError((err)=>console.error('激励视频广告加载失败', err))
      videoAd.onClose((res)=>{
        if(res.isEnded)this.setData({evt:{ event:'adClose', time: 15 }})
      });
    }
    shared.getGroups().then(groups => {
      this.setData({ groups, curGroup: groups[0] }, ()=> this.updateData());
    }).catch(err => {
      this.logError(err,'pages/rank/onReady','读取分组失败');
    })
  },
  onReady() {
  },
  onShow() {
  },
  onHide() {

  },
  onUploadTeam() {
    const { myList } = this.data;
    if(myList && myList.length >= 20) {
      wx.showModal({
        title: '您的队伍过多',
        content: '您上传的队伍过多，建议先删除一些旧的队伍再重新上传。',
        showCancel: false,
      })
      return;
    }
    this.setData({ showGroupPicker: true });
  },
  uploadTeam(group) {
    wx.showModal({
      title: '上传队伍',
      content: '您确认上传当前队伍到分组“'+group+'”吗？',
      success: (res)=>{
        if(res.confirm) {
          const team = getApp().team(0);
          wx.showLoading({ title: '上传中' });
          shared.uploadTeam(group, team).then(data=>{
            wx.showToast({ title: '上传成功', icon: 'none' });
            this.setData({ myList: getApp().globalData.myTeams });
          }).catch(err => {
            this.logError(err,'pages/rank/uploadTeam','上传队伍失败');
          }).finally(()=>wx.hideLoading());
        }
      }
    })
  },
  onDeleteTeam(e) {
    wx.showModal({
      title: '删除队伍',
      content: '您确认删除当前队伍吗？',
      success: (res)=>{
        if(res.confirm) {
          const id = e.detail.id;
          wx.showLoading({ title: '删除中' });
          shared.deleteTeam(id).then(()=>{
            wx.showToast({ title: '删除成功', icon: 'none' });
            this.setData({ myList: getApp().globalData.myTeams });
          }).catch(err=>{
            this.logError(err,'pages/rank/onDeleteTeam','删除队伍失败');
          }).finally(()=>wx.hideLoading());
        }
      }
    })
  },
  onDownloadTeam(e) {
    const score = getApp().globalData.score;
    if(!score && score!==0) {
      wx.showToast({ title: '请先完成签到', icon: 'none' });
      return;
    }
    if(score<1) {
      wx.showToast({ title: '积分不足', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '下载队伍',
      content: '每次下载队伍都将消耗1点积分，您确认下载当前队伍吗？',
      success: (res)=>{
        if(res.confirm) {
          const id = e.detail.id;
          this.downloadTeam(id);
        }
      }
    })
  },
  downloadTeam(id) {
    const self = this;
    wx.showLoading({ title: '下载中' })
    shared.downloadTeam(id).then(base64=>{
      const team = getApp().team(0);
      team.fromBase64(base64);
      team.updateData(true);
      getApp().autoSave();
      this.setData({
        evt: {event: 'update'},
        myTeam: { info: team.getMembersInfo() },
      },()=>{
        wx.showModal({
          title: '跳转',
          content: '下载成功，是否立即跳转到队伍配置页面？',
          success: (res)=>{
            if(res.confirm) {
              wx.navigateTo({ url: '/pages/index' });
            }
          }
        })
      })
    }).catch(err=>{
      this.logError(err,'pages/rank/downloadTeam','下载队伍失败');
    }).finally(()=>wx.hideLoading());
  },
  onChangeMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ viewMode: mode }, ()=>this.updateData())
  },
  onSearchMode(e) {
    this.setData({ searchMode: e.currentTarget.dataset.value })
  },
  selectGroup() {
    this.setData({ showGroupPicker: true })
  },
  updateData() {
    const { viewMode, curGroup, myTeam } = this.data;
    switch(viewMode) {
      case 'fav':
        this.getNewTeams(curGroup);
        break;
      case 'search':
        break;
      case 'my':
        this.getMyTeams();
        break;
    }
    if(!myTeam) {
      const team = getApp().team(0);
      this.setData({ myTeam: { info: team.getMembersInfo() } });
    }
  },
  onReload() {
    if(Date.now() - reloadTime < 5*60*1000) {
      wx.showToast({ title: '刷新过于频繁', icon: 'none' });
      return;
    }
    reloadTime = Date.now();
    this.getNewTeams(this.data.curGroup, true);
  },
  getNewTeams(group, force = false) {
    if(!group) return;
    wx.showLoading({ title: '加载中' });
    shared.getNewTeams(group, force).then(teams => {
      this.setData({ favList: clone(teams) });
    }).catch(err => {
      this.logError(err,'pages/rank/getNewTeams','获取队伍失败');
    }).finally(()=>wx.hideLoading());
  },
  onInput(e) {
    this.setData({ teamId: e.detail.value });
  },
  onSearch() {
    if(Date.now() - searchTime < 30*1000) {
      wx.showToast({ title: '搜索过于频繁', icon: 'none' });
      return;
    }

    const { curGroup, members, searchMode, teamId } = this.data;
    if(searchMode === 'name') {
      searchTime = Date.now();
      getApp().globalData.searchInfo = {
        group: curGroup,
        members: members.filter(m => m),
        page: -1,
        totalPage: -1,
      }
      getApp().globalData.searchResults = [];
      this.setData({ results: [], count:0 }, ()=>this.getSearchTeams(0))
    } else if(searchMode === 'id') {
      // 确保teamId只包含英文和数字
      console.log(teamId)
      if(teamId.length!==6 || !teamId.match(/^[a-zA-Z0-9]+$/)) {
        wx.showToast({ title: '无效的队伍ID', icon: 'none' });
        return;
      }
      searchTime = Date.now();
      getApp().globalData.searchResults = [];
      this.setData({ results: [], count:0 }, ()=>this.getSearchTeam(teamId.toUpperCase()));
    }
  },
  onNextPage() {
    const info = getApp().globalData.searchInfo;
    if(info.totalPage>=0 && info.page<info.totalPage - 1) {
      this.getSearchTeams(info.page+1);
    }
  },
  getSearchTeams(page) {
    const g = getApp().globalData;
    const info = g.searchInfo;
    if(info.page>=0 && (page<=info.page || page>=info.totalPage)) return;
    wx.showLoading({ title: '加载中' });
    shared.findTeams(info.group, info.members, page).then(res => {
      info.page = page;
      info.totalPage = Math.ceil(res.count/20);
      g.searchResults.push(...res.data);
      const result = this.data.results || [];
      result.push(...clone(res.data));
      this.setData({
        results: result,
        count: res.count,
      })
    }).catch(err=> {
      console.log(err);
      this.logError(err, 'pages/rank/getSearchTeams', '搜索队伍失败')
    }).finally(()=>wx.hideLoading());
  },
  getSearchTeam(id) {
    const g = getApp().globalData;
    wx.showLoading({ title: '加载中' });
    shared.findTeam(id).then(res => {
      g.searchResults = res.data;
      if(res.count===0) {
        wx.showToast({ title: '队伍不存在', icon: 'none' });
      }
      this.setData({
        results: clone(res.data),
        count: res.count,
      })
    }).catch(err=> {
      console.log(err);
      this.logError(err, 'pages/rank/getSearchTeam', '搜索队伍失败')
    }).finally(()=>wx.hideLoading());
  },
  getMyTeams() {
    wx.showLoading({ title: '加载中' });
    shared.getMyTeams().then(teams => {
      this.setData({ myList: clone(teams) });
    }).catch(err => {
      this.logError(err, 'pages/rank/getMyTeams', '获取队伍失败')
    }).finally(()=>wx.hideLoading());
  },
  onSelectGroup(e) {
    const { viewMode, groups } = this.data;
    const group = groups[e.detail.value];
    switch(viewMode) {
      case 'fav':
      case 'search':
        this.setData({ curGroup: group }, ()=> this.updateData());
        break;
      case 'my':
        this.uploadTeam(group);
        break;
      default:
        break;
    }
    this.setData({ showGroupPicker: false });
  },
  onSelectMember(e) {
    const { members } = this.data;
    const { index, character } = e.detail;
    if(character) {
      for(let i=0; i<members.length; i++) {
        if(i!==index && members[i] === character) {
          members[i] = null;
        }
      }
    }
    members[index] = character;
    this.setData({ members });
  },
  logError(err, src, text) {
    if(typeof err === 'string') {
      wx.showToast({ title: err, icon: 'none' })
      return;
    }
    getApp().onError(err.message, src, text);
  },
  onShareAppMessage() {
    return {
      title: '黑塔配装助手',
      path: '/pages/index',
      promise: getApp().shareTeam(),
    }
  },
  // 展示广告
  onShowAds() {
    if (videoAd) {
      videoAd.show().catch(() => {
        // 失败重试
        videoAd.load()
          .then(() => videoAd.show())
          .catch(err => {
            console.error('激励视频 广告显示失败', err)
          })
      })
    }
  },
})