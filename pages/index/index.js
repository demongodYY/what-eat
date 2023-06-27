//index.js

const QQMapWx = require('../../libs/qqmap-wx-jssdk.min.js');
import { getMapConfig, getEatCompletion } from '../../utils/util.js';

Page({
  data: {
    reason: '',
    address: '',
    title: '',
    location: {},
    tel: '',
    distance: -1,
    txtBtn: '点我',
    markers: [],
    qqMapSdk: null,
  },
  async onLoad() {
    try {
      wx.showLoading();
      const MapConfig = await getMapConfig();
      const qqMapSdk = new QQMapWx({
        key: MapConfig.MAP_KEY,
      });
      this.setData({
        qqMapSdk: qqMapSdk,
      });
    } catch (e) {
      wx.showToast({
        title: '哎呀出错了！请刷新页面重试',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onShareAppMessage: function (res) {
    let msg = '这顿吃什么呢？来看一哈嘛！';
    if (this.data.title) {
      msg = `咱们要去${this.data.title}吃饭，快一起来吧！`;
    }
    return {
      title: msg,
    };
  },
  //事件处理函数
  bindViewTap: function () {
    const qqMapSdk = this.data.qqMapSdk;
    wx.showLoading({
      title: '疯狂搜索中...',
    });
    qqMapSdk.search({
      keyword: '美食',
      page_size: 20,
      success: (res) => {
        wx.hideLoading();
        this.chooseEat(res.data);
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '哎呀出错了！请稍后重试一下呢',
        });
        console.log(err);
      },
    });
  },
  bindMarkTap: function (e) {
    console.log(this.data.location);
    wx.openLocation({
      latitude: this.data.location.lat,
      longitude: this.data.location.lng,
      name: this.data.title,
      address: this.data.address,
    });
  },
  chooseEat: async function (eatList) {
    try {
      wx.showLoading({
        title: '疯狂搜索中...',
      });
      //TODO 更改下面逻辑， 从 res 中获取推荐餐馆信息
      //调用 AI function
      const res = await getEatCompletion(eatList);
      console.log(5555, res);
      const resData = JSON.parse(res.match(/\{[\s\S]*\}/)[0])
      console.log(123, resData);
      const eatItem = resData.detail;
      const reason = resData.reason;

      // const listLength = eatList.length;
      // const index = Math.floor(Math.random() * listLength);
      // const eatItem = eatList[index];
      const marker = {
        id: 0,
        latitude: eatItem.location.lat,
        longitude: eatItem.location.lng,
        title: eatItem.title,
        iconPath: '../../assets/marker32.png',
      };
      this.setData({
        reason: reason,
        title: eatItem.title,
        address: eatItem.address,
        tel: eatItem.tel,
        distance: eatItem._distance,
        location: eatItem.location,
        txtBtn: '点我换一家',
        markers: [marker],
      });
    } finally {
      wx.hideLoading();
    }
  },
});
