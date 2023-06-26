//app.js

wx.cloud.init({
  env: 'cloud1-8gydyeo6bb9e2948',
});

const refreshAIConfig = async () => {
  const { result } = await wx.cloud.callFunction({ name: 'getAIConfig' });
  wx.setStorageSync('AI_CONFIG', result);
};

App({
  onLaunch: async function () {
    await refreshAIConfig();
  },
});
