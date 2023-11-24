import { useRef, useState } from 'react';
import {
  useLoad,
  useReady,
  showToast,
  showLoading,
  hideLoading,
} from '@tarojs/taro';
import {
  View,
  Button,
  Text,
  // Image,
  Input,
  ScrollView,
} from '@tarojs/components';
// import HomeImage from '@/assets/topic.png';
import QQMapWX from '@/assets/js/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.min.js';
import { getQuestionsCompletion, getRestaurantCompletion } from '@/utils';
import RestaurantCard from './components/restaurantCard';
import styles from './index.module.less';

const MAP_SDK_KEY = '34ZBZ-AMFCO-2ZGWD-SNT2V-AYMDJ-QFF63';
export interface ChatItem {
  role: 'AI' | 'Human';
  content: string;
}

export default function Index() {
  const [inputString, setInputString] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [recommandRestaurant, setRecommandRestaurant] =
    useState<any>(undefined);
  const mapSdkRef = useRef<QQMapWX | null>(null);

  useLoad(async () => {
    mapSdkRef.current = new QQMapWX({
      key: MAP_SDK_KEY,
    });
  });

  useReady(async () => {
    setRecommandRestaurant(undefined);
    await chatWithAI([]);
  });

  const onSearch = async (keyword: string) => {
    return new Promise<any[]>((resolve, reject) => {
      showLoading({
        title: '疯狂搜索中...',
      });
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
        complete: () => {
          hideLoading();
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
      console.log('resFromAI', resFromAI);
      const question = getQuestion(resFromAI);
      console.log('question', question);
      if (question) {
        const AIResponseHistory: ChatItem[] = [
          ...chatHistoryBefore,
          {
            role: 'AI',
            content: question,
          },
        ];
        setChatHistory(AIResponseHistory);
      } else {
        const keyword = getKeyword(resFromAI);
        console.log('keyword', keyword);
        const foundRestaurants = await onSearch(keyword);
        const recommandRestaurantInfo = await getRestaurantCompletion(
          foundRestaurants,
          chatHistory
        );
        const { name } = JSON.parse(recommandRestaurantInfo);
        const restDetail = foundRestaurants.find(({ title }) => title === name);
        console.log('recommandRestaurant', recommandRestaurantInfo);
        setRecommandRestaurant(restDetail);
        console.log('recommandRestaurant', recommandRestaurantInfo);
      }
    } catch (e) {
      showToast({
        title: '哎呀出错了！重新再问一下吧',
      });
      console.error(e);
    } finally {
      hideLoading();
    }
  };

  const getKeyword = (resFromAI: string) => {
    try {
      const { keyword } = JSON.parse(resFromAI);
      if (keyword) {
        return keyword;
      }
      return null;
    } catch (e) {
      console.log('AI return something is not JSON format');
      return resFromAI;
    }
  };

  const getQuestion = (resFromAI: string) => {
    try {
      const { question } = JSON.parse(resFromAI);
      if (question) {
        return question;
      } else {
        return null;
      }
    } catch (e) {
      console.log('AI return something is not JSON format');
      return resFromAI;
    }
  };

  return (
    <View>
      <View className={styles.home}>
        {/* <Image src={HomeImage} mode="widthFix" className={styles.banner} />
          <Button type="primary" onClick={onSearch} className={styles.tryBtn}>
            点我试试
          </Button> */}
        <ScrollView className={styles.chatWrapper} scrollY scrollWithAnimation>
          {chatHistory.map((item, index) => {
            const { role, content } = item;
            return (
              <View
                className={
                  role === 'AI' ? styles.chatItemAI : styles.chatItemHuman
                }
                key={index}
              >
                <Text>
                  {role}: {content}
                </Text>
              </View>
            );
          })}
          {recommandRestaurant && (
            <View className={styles.chatItemAI}>
              <RestaurantCard restaurant={recommandRestaurant} />
            </View>
          )}
        </ScrollView>

        <View className={styles.bottomInputWrapper}>
          <Input
            className={styles.bottomInput}
            value={inputString}
            onInput={(evt) => setInputString(evt.detail.value)}
            type="text"
          />
          <Button
            className={styles.bottomBtn}
            onClick={async () => {
              const humanInputHistory: ChatItem[] = [
                ...chatHistory,
                { role: 'Human', content: inputString },
              ];
              chatWithAI(humanInputHistory);
              setInputString('');
            }}
            type="warn"
          >
            提交
          </Button>
        </View>
      </View>
    </View>
  );
}
