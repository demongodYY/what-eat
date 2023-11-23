import { View, Button, Map } from '@tarojs/components';
import marker32 from '@/assets/marker32.png';
import styles from './restaurantCard.module.less';

export default ({ restaurant }) => {
  const marker = {
    id: 0,
    height: 28,
    width: 28,
    latitude: restaurant?.location?.lat,
    longitude: restaurant?.location?.lng,
    title: restaurant?.title,
    iconPath: marker32,
  };

  return (
    <View className={styles.result}>
      <Map
        id="map"
        className={styles.map}
        markers={[marker]}
        longitude={restaurant?.location?.lng}
        latitude={restaurant?.location?.lat}
        scale={17}
        showLocation
      />
      <View className={styles.recommend}>
        <View>店名：{restaurant?.title}</View>
        <View>地址：{restaurant?.address}</View>
        <View>电话：{restaurant?.tel}</View>
        <View>距离：{restaurant?._distance} 米</View>
      </View>
      <View className={styles.operation}>
        <Button type="warn">点击前往</Button>
      </View>
    </View>
  );
};
