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
import { getEatCompletion } from '@/utils';
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
  const [eatList, setEatList] = useState<any[]>([]);
  const mapSdkRef = useRef<QQMapWX | null>(null);

  useLoad(async () => {
    mapSdkRef.current = new QQMapWX({
      key: MAP_SDK_KEY,
    });
  });

  useReady(async () => {
    const restaurantList = await onSearch();
    setEatList(restaurantList);
    await completeWithAI(restaurantList, []);
  });

  const onSearch = async () => {
    return new Promise<any[]>((resolve, reject) => {
      showLoading({
        title: '疯狂搜索中...',
      });
      mapSdkRef.current?.search({
        keyword: '餐馆',
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

  const completeWithAI = async (
    eatItemsList: any[],
    chatHistoryBefore: ChatItem[]
  ) => {
    showLoading({
      title: 'AI 思考中...',
    });
    try {
      const resFromAI = await getEatCompletion(eatItemsList, chatHistoryBefore);
      const AIResponseHistory: ChatItem[] = [
        ...chatHistoryBefore,
        {
          role: 'AI',
          content: resFromAI,
        },
      ];
      setChatHistory(AIResponseHistory);
    } catch (e) {
      showToast({
        title: '哎呀出错了！重新再问一下吧',
      });
      console.error(e);
    } finally {
      hideLoading();
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
            const recommand = content.match(/\{[\s\S]*\}/);
            if (!recommand) {
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
            } else {
              const restInfo = JSON.parse(recommand[0]);
              const { name, reason } = restInfo;
              const restDetail = eatList.find(({ title }) => title === name);
              console.log(12345, restDetail);
              return (
                <>
                  <View className={styles.chatItemAI} key={index}>
                    <Text>
                      {role}: {reason}
                    </Text>
                  </View>
                  <View className={styles.chatItemAI} key={index}>
                    <RestaurantCard restaurant={restDetail} />
                  </View>
                </>
              );
            }
          })}
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

              // request to AI get response
              completeWithAI(eatList, humanInputHistory);

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
