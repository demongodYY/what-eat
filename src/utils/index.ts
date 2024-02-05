import Taro from '@tarojs/taro';

export interface ChatItem {
  role: 'AI' | 'Human';
  content: string;
}

export const formatTime = (date) => {
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

export const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

export const getPeriod = (): string => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 10) return '早餐';
  if (currentHour >= 10 && currentHour < 15) return '午餐';
  if (currentHour >= 15 && currentHour < 22) return '晚餐';
  return '夜宵';
};

export const getQuestionsCompletion = async (chatHistory: ChatItem[] = []) => {
  const res = await Taro.cloud.callContainer({
    path: '/api/recommend/questions',
    header: {
      'X-WX-SERVICE': 'express-fh13',
    },
    timeout: 15 * 1000,
    method: 'POST',
    data: {
      history: chatHistory,
      period: getPeriod(),
      location: '中国',
    },
  });
  return res.data?.data;
};

export const getRestaurantCompletion = async (
  eatList,
  chatHistory: ChatItem[] = []
) => {
  const res = await Taro.cloud.callContainer({
    path: '/api/recommend/restaurants',
    header: {
      'X-WX-SERVICE': 'express-fh13',
    },
    timeout: 15 * 1000,
    method: 'POST',
    data: {
      history: chatHistory,
      eatList,
      period: getPeriod(),
      location: '中国',
    },
  });
  return res.data?.data;
};
