// 云函数入口文件
const cloud = require('wx-server-sdk');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanChatMessage, SystemChatMessage, AIChatMessage } = require('langchain/schema');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

const completion = async (messages) => {
  const AIConfig = (
    await db.collection('global_config').where({ CONFIG_NAME: 'OPENAI' }).get()
  ).data[0];

  const chat = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo', //gpt-4
    openAIApiKey: AIConfig.API_KEY,
    configuration: {
      basePath: AIConfig.API_URL,
    },
    temperature: 0.5,
  });
  return await chat.call(messages);
};

const getRecommendRestaurant = async(eatList, history) => {
  const restaurantInfo = eatList.map(({title, address, category}) => {
    return {title, address, category}
  })
  const historyMessages = history.map((msg) => {
    if (msg.role === 'AI') {
      return new AIChatMessage(msg.content);
    } else {
      return new HumanChatMessage(msg.content);
    }
  });
  if (history.length === 6) {
    return await recommendEat(restaurantInfo, historyMessages);
  }

  return await getPromptQuestion(restaurantInfo, historyMessages);
}

const recommendEat = async (eatList, historyMessages) => {
  const messages = [
    new SystemChatMessage(
      `你是一个美食助手，请根据我提供的餐馆列表上下文，根据我提供的喜好, 来帮助我挑选一家餐馆。
      餐馆列表上下文会被引用在 ''' 之中
      餐馆列表上下文：'''${JSON.stringify(eatList)}'''
      请只推荐符合要求的一家，并用以下 JSON 格式进行输出：
      {
        name: 餐馆的名字
        reason: 推荐的理由
        detail: 上下文中餐馆的详细信息
      }
      `
    ),
    ...historyMessages
  ];
  const res = await completion(messages);
  return res;
};

const getPromptQuestion = async (eatList, historyMessages) => {
  console.log("enter get prompt question");
  const messages = [
    new SystemChatMessage(
      `你是一个美食助手，你将通过向用户连续提问的方式来识别用户的需求
      请结合餐馆列表上下文和历史提问来提出下一个问题，这个问题将帮助我从餐馆列表中选择出一家我最想去的餐馆。
      问题需要和口味相关，比如“您喜欢吃辣吗”或者“你喜欢鸡肉吗”或者“你喜欢火锅吗”
      不要提供和口味无关的问题，比如“您是否需要早餐店提供电话预定服务？”和“您是否对早餐店的环境有特别的要求，比如需要安静的环境，或者喜欢热闹的氛围？”等等
      餐馆列表上下文会被引用在 ''' 之中。
      餐馆列表上下文：'''${JSON.stringify(eatList)}'''
      请每次都问更详细的问题,不要重复类似的问题
      如果没有新问题了，请返回“我没有新问题了”
    `),
    ...historyMessages
  ];
  const res = await completion(messages);
  console.log("生成的问题：", res.text);
  return res
};


// 云函数入口函数
exports.main = async (event, context) => {
  const res = await getRecommendRestaurant(event.eatList, event.chatHistory);
  return res.text;
};
