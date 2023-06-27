// 云函数入口文件
const cloud = require('wx-server-sdk');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HumanChatMessage, SystemChatMessage } = require('langchain/schema');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

const completion = async (messages) => {
  const AIConfig = (
    await db.collection('global_config').where({ CONFIG_NAME: 'OPENAI' }).get()
  ).data[0];

  const chat = new ChatOpenAI({
    openAIApiKey: AIConfig.API_KEY,
    configuration: {
      basePath: AIConfig.API_URL,
    },
    temperature: 0,
  });
  return await chat.call(messages);
};

const recommandEat = async (eatList) => {
  //TODO
  const messages = [
    new SystemChatMessage(
      `你是一个美食助手，请根据我提供的餐馆列表上下文，来帮助我挑选一家餐馆。餐馆列表上下文会被引用在 ''' 之中，我的喜好会被引用在 --- 之中。
      餐馆列表上下文：'''${JSON.stringify(eatList)}'''
      请只推荐符合要求的一家，并用以下 JSON 格式进行输出：
      {
        name: 餐馆的名字
        reason: 推荐的理由
        detail: 上下文中餐馆的详细信息
      }
      `
    ),
    new HumanChatMessage('---辣的,便宜---'),
  ];
  return await completion(messages);
};

// 云函数入口函数
exports.main = async (event, context) => {
  const res = await recommandEat(event.eatList);
  return res.text;
};
