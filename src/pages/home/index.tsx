import {
  useLoad,
  request,
  getLocation,
  showToast,
  showLoading,
  hideLoading,
} from '@tarojs/taro';
import {
  View,
  Button,
  Image,
  Map,
  Input,
  ScrollView,
} from '@tarojs/components';
import HomeImage from '@/assets/topic.png';
import marker32 from '@/assets/marker32.png';
import { useState } from 'react';
import { getEatCompletion, getMapConfig, getPeriod } from '@/utils';
import styles from './index.module.less';

export interface ChatItem {
  role: 'AI' | 'Human';
  content: string;
}

export default function Index() {
  const [data, setData] = useState<any>();
  const [inputString, setInputString] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [eatList, setEatList] = useState<any[]>([]);
  useLoad(async () => {
    console.log('Page loaded.');

    try {
      showLoading();
      const MapConfig = await getMapConfig();
      const res = await onSearch(MapConfig.MAP_KEY);
      setEatList(res);
      completeWithAI(res, []);
    } catch (e) {
      showToast({
        title: '哎呀出错了！请刷新页面重试',
      });
    } finally {
      hideLoading();
    }
  });

  const onSearch = async (mapKey: string) => {
    showLoading({
      title: '疯狂搜索中...',
    });
    try {
      const { latitude, longitude } = await getLocation({ type: 'wgs84' });
      const translateLocationRes = await request({
        url: 'https://apis.map.qq.com/ws/coord/v1/translate',
        method: 'GET',
        data: {
          key: mapKey,
          type: 1,
          locations: `${latitude},${longitude}`,
        },
      });
      const { locations } = translateLocationRes.data;
      console.log(123, locations, latitude, longitude);
      const res = await request({
        url: 'https://apis.map.qq.com/ws/place/v1/search',
        method: 'GET',
        data: {
          key: mapKey,
          keyword: `美食`,
          boundary: `nearby(${locations[0].lat},${locations[0].lng},2000,1)`,
          page_size: 20,
        },
      });

      hideLoading();
      return res.data.data;
      // chooseEat(res.data.data);

      console.log('@@@返回的20条附近的数据:', res.data.data);
    } catch (error) {
      hideLoading();
      showToast({
        title: '哎呀出错了！请稍后重试一下呢',
      });
      console.log(error);
    }
  };

  const completeWithAI = async (
    eatItemsList: any[],
    chatHistoryBefore: ChatItem[]
  ) => {
    const resFromAI = await getEatCompletion(
      eatItemsList,
      chatHistoryBefore
      ) as any;
    console.log("response from ai", typeof resFromAI);
    const AIResponseHistory: ChatItem[] = [
      ...chatHistoryBefore,
      { role: 'AI', content: typeof resFromAI === "string" ? resFromAI : resFromAI.name },
    ];

    setChatHistory(AIResponseHistory);
  };

  const chooseEat = async (eatList) => {
    try {
      showLoading({
        title: '疯狂搜索中...',
      });
      //TODO 更改下面逻辑， 从 res 中获取推荐餐馆信息
      //调用 AI function
      const res: any = await getEatCompletion(eatList, ['辛辣', '便宜']);
      console.log('模型返回', res);
      const recommendData: { name: string; detail: any; reason: string } =
        typeof res === 'string'
          ? JSON.parse(res?.match(/\{[\s\S]*\}/)[0])
          : res;
      console.log('解析后', recommendData);
      const recommendRestaurant = recommendData.detail;
      const reason = recommendData.reason;

      const marker = {
        id: 0,
        height: 28,
        width: 28,
        latitude: recommendRestaurant.location.lat,
        longitude: recommendRestaurant.location.lng,
        title: recommendRestaurant.title,
        iconPath: marker32,
      };
      setData({
        reason: reason,
        title: recommendRestaurant.title,
        address: recommendRestaurant.address,
        tel: recommendRestaurant.tel,
        distance: recommendRestaurant._distance,
        location: recommendRestaurant.location,
        markers: [marker],
      });
    } finally {
      hideLoading();
    }
  };

  return (
    <View>
      {data?.markers ? (
        <View className={styles.result}>
          <Map
            id="map"
            className={styles.map}
            markers={data.markers}
            longitude={data.location.lng}
            latitude={data.location.lat}
            scale={17}
            showLocation
          />
          <View className={styles.recommend}>
            <View>推荐理由：{data.reason}</View>
            <View>店名：{data.title}</View>
            <View>地址：{data.address}</View>
            <View>电话：{data.tel}</View>
            <View>距离：{data.distance} 米</View>
          </View>
          <View className={styles.operation}>
            <Button type="primary" onClick={onSearch}>
              点我换一家
            </Button>
            <Button type="warn">点击前往</Button>
          </View>
        </View>
      ) : (
        <View className={styles.home}>
          {/* <Image src={HomeImage} mode="widthFix" className={styles.banner} />
          <Button type="primary" onClick={onSearch} className={styles.tryBtn}>
            点我试试
          </Button> */}
          <ScrollView
            className={styles.chatWrapper}
            scrollY
            scrollWithAnimation
          >
            {chatHistory.map((item, index) => (
              <View
                className={
                  item.role === 'AI' ? styles.chatItemAI : styles.chatItemHuman
                }
                key={index}
              >
                {item.role}: {item.content}
              </View>
            ))}
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
      )}
    </View>
  );
}
function getCurrentPeriod(arg0: number) {
  throw new Error('Function not implemented.');
}
