import Taro from "@tarojs/taro";

export const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join("/") +
    " " +
    [hour, minute, second].map(formatNumber).join(":")
  );
};

export const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : "0" + n;
};

export const getMapConfig = async () => {
  const mapConfig = Taro.getStorageSync("MAP_CONFIG") ?? {};
  if (mapConfig?.MAP_KEY) return mapConfig;
  const { result } = await Taro.cloud.callFunction({ name: "getMapConfig" });
  Taro.setStorageSync("MAP_CONFIG", result);
  return result;
};

export const getEatCompletion = async (eatList) => {
  //TODO 更多上下文参数
  const { result } = await Taro.cloud.callFunction({
    name: "eatChat",
    data: { eatList },
  });
  return result;
};
