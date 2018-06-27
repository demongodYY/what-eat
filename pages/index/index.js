//index.js
//获取应用实例
const app = getApp()
const QQMapWx = require('../../libs/qqmap-wx-jssdk.min.js')
const qqMapSdk = new QQMapWx({
  key: '34ZBZ-AMFCO-2ZGWD-SNT2V-AYMDJ-QFF63'
})

Page({
  data: {
    address: '',
    title: '',
    location:{},
    tel:'',
    distance: -1,
    txtBtn: '点我',
    markers:[]
  },
  onShareAppMessage: function (res) {
    let msg  = '这顿吃什么呢？来看一哈嘛！'
    if (this.data.title) {
      msg = `咱们要去${this.data.title}吃饭，快一起来吧！`
    }
    return {
      title: msg
    }
  },
  //事件处理函数
  bindViewTap: function() {
    wx.showLoading({
      title: '疯狂搜索中...',
    })
    qqMapSdk.search({
      keyword:'美食',
      page_size: 20,
      success: (res) => {
        wx.hideLoading()
        this.chooseEat(res.data)
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '哎呀出错了！请稍后重试一下呢',
        })
        console.log(err)
      } 
    })
  },
  bindMarkTap: function(e) {
    console.log(this.data.location)
    wx.openLocation({
      latitude: this.data.location.lat,
      longitude: this.data.location.lng,
      name: this.data.title,
      address: this.data.address
    })
  },
  chooseEat: function(eatList) {
    const listLength  = eatList.length
    const index   = Math.floor(Math.random()*listLength)
    const eatItem = eatList[index]
    const marker = {
      id: 0,
      latitude: eatItem.location.lat,
      longitude: eatItem.location.lng,
      title: eatItem.title,
      iconPath: '../../assets/marker32.png',
    }
    console.log(eatItem)
    this.setData({
      title: eatItem.title,
      address: eatItem.address,
      tel: eatItem.tel,
      distance: eatItem._distance,
      location: eatItem.location,
      txtBtn: '点我换一家',
      markers:[marker]
    })
  }
})
