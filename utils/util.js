const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  );
};

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

const getAIConfig = async () => {
  const AIConfig = wx.getStorageSync('AI_CONFIG') ?? {};
  if (AIConfig?.API_KEY) return AIConfig;
  const { result } = await wx.cloud.callFunction({ name: 'getAIConfig' });
  wx.setStorageSync('AI_CONFIG', result);
  return result;
};

const getMapConfig = async () => {
  const mapConfig = wx.getStorageSync('MAP_CONFIG') ?? {};
  if (mapConfig?.MAP_KEY) return mapConfig;
  const { result } = await wx.cloud.callFunction({ name: 'getMapConfig' });
  wx.setStorageSync('MAP_CONFIG', result);
  return result;
};

module.exports = {
  formatTime,
  formatNumber,
  getAIConfig,
  getMapConfig,
};
