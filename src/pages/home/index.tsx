import { useRef, useState } from 'react';
import { useLoad, showToast, showLoading, hideLoading } from '@tarojs/taro';
import {
  View,
  Button,
  Text,
  Image,
  Input,
  ScrollView,
} from '@tarojs/components';
import HomeImage from '@/assets/topic.png';
import QQMapWX from '@/assets/js/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.min.js';
import { getQuestionsCompletion, getRestaurantCompletion } from '@/utils';
import RestaurantCard from './components/restaurantCard';
import styles from './index.module.less';

const MAP_SDK_KEY = '34ZBZ-AMFCO-2ZGWD-SNT2V-AYMDJ-QFF63';
export interface ChatItem {
  role: 'AI' | 'Human';
  content: string;
  recommandRestaurant?: any;
}

export default function Index() {
  const [inputString, setInputString] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [currentChatItem, setChatItem] = useState<string>('');

  const mapSdkRef = useRef<QQMapWX | null>(null);

  useLoad(async () => {
    mapSdkRef.current = new QQMapWX({
      key: MAP_SDK_KEY,
    });
  });

  const onSearch = async (keyword: string) => {
    return new Promise<any[]>((resolve, reject) => {
      mapSdkRef.current?.search({
        keyword: keyword,
        page_size: 20,
        filter: 'category<>冷饮店,娱乐休闲',
        success: (res) => {
          resolve(res.data);
        },
        failed: (res) => {
          console.error('map search error: ', res);
          showToast({
            title: '哎呀出错了！请刷新页面重试',
          });
          reject(res);
        },
      });
    });
  };

  const chatWithAI = async (chatHistoryBefore: ChatItem[]) => {
    showLoading({
      title: 'AI 思考中...',
    });
    try {
      const resFromAI = await getQuestionsCompletion(chatHistoryBefore);
      // const resFromAI = { question: 'hahah' };
      const { question, keyword } = resFromAI;
      if (question) {
        const AIResponseHistory: ChatItem[] = [
          ...chatHistoryBefore,
          {
            role: 'AI',
            content: question,
          },
        ];
        setChatHistory(AIResponseHistory);
      } else if (keyword) {
        const foundRestaurants = await onSearch(keyword);
        if (foundRestaurants?.length === 0) {
          showToast({
            title: '没有找到合适的餐馆，重新聊聊吧',
          });
          const AIResponseHistory: ChatItem[] = [
            ...chatHistoryBefore,
            {
              role: 'AI',
              content:
                '我在附近没有找到符合您要求的餐馆，可以再详细描述一下吗？',
            },
          ];
          setChatHistory(AIResponseHistory);
          return;
        }
        const recommandRestaurantInfo = await getRestaurantCompletion(
          foundRestaurants,
          chatHistoryBefore
        );
        const { recommendEat } = recommandRestaurantInfo ?? {};

        const restDetail = foundRestaurants.find(
          ({ id }) => id === recommendEat?.id
        );
        if (restDetail?.length === 0) {
          showToast({
            title: '没有找到合适的餐馆，重新聊聊吧',
          });
          const AIResponseHistory: ChatItem[] = [
            ...chatHistoryBefore,
            {
              role: 'AI',
              content:
                '我在附近没有找到符合您要求的餐馆，可以再详细描述一下吗？',
            },
          ];
          setChatHistory(AIResponseHistory);
          return;
        }
        const AIResponseHistory: ChatItem[] = [
          ...chatHistoryBefore,
          {
            role: 'AI',
            content: `为您推荐了${recommendEat?.title}, ${recommendEat?.reason}。如果您还有更多需求，可以继续跟我说。`,
            recommandRestaurant: restDetail,
          },
        ];
        setChatHistory(AIResponseHistory);
      }
    } catch (e) {
      showToast({
        title: '哎呀出错了！重新再问一下吧',
      });
      console.error(e);
    } finally {
      hideLoading();
      setTimeout(() => {
        setChatItem(`chatItem${chatHistory.length - 1}`);
      }, 0);
    }
  };

  return (
    <View>
      <View className={styles.title}>这一顿吃什么：智能餐馆推荐</View>
      {!chatHistory.length ? (
        <View className={styles.preWrapper}>
          <Image src={HomeImage} mode="widthFix" className={styles.banner} />
          <Button type="primary" onClick={() => chatWithAI([])}>
            🤔这一顿吃什么？🤖点击这聊聊看！
          </Button>
        </View>
      ) : (
        <View className={styles.home}>
          <View className={styles.chatContainer}>
            <ScrollView
              className={styles.chatWrapper}
              scrollY
              scrollWithAnimation
              scrollIntoView={currentChatItem}
            >
              {chatHistory.map((item, index) => {
                const { role, content, recommandRestaurant } = item;
                return (
                  <>
                    {recommandRestaurant && (
                      <View className={styles.chatItem}>
                        <RestaurantCard restaurant={recommandRestaurant} />
                      </View>
                    )}
                    <View
                      id={`chatItem${index}`}
                      className={styles.chatItem}
                      key={index}
                    >
                      <Text
                        className={
                          role === 'AI'
                            ? styles.chatItemAI
                            : styles.chatItemHuman
                        }
                      >
                        {content}
                      </Text>
                    </View>
                  </>
                );
              })}
            </ScrollView>
          </View>

          <View className={styles.bottomInputWrapper}>
            <Input
              className={styles.bottomInput}
              value={inputString}
              placeholder="随便说点啥吧"
              onInput={(evt) => setInputString(evt.detail.value)}
              type="text"
              confirm-type="send"
              cursor={inputString.length}
            />
            <Button
              className={styles.bottomBtn}
              onClick={async () => {
                const textValue = inputString.trim();
                if (!textValue.length) return;
                const humanInputHistory: ChatItem[] = [
                  ...chatHistory,
                  { role: 'Human', content: textValue },
                ];
                chatWithAI(humanInputHistory);
                setInputString('');
              }}
              type="primary"
            >
              提交
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
