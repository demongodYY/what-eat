import { ReactNode } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import './app.less';

function App({ children }: { children: ReactNode }) {
  useLaunch(() => {
    console.log('App launched.');
  });

  Taro.cloud.init({
    env: 'prod-2gf91y30c8f394d2',
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
