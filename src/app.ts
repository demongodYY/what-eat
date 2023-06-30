import { ReactNode } from "react";
import Taro, { useLaunch } from "@tarojs/taro";
import "./app.less";

function App({ children }: { children: ReactNode }) {
  useLaunch(() => {
    console.log("App launched.");
  });

  Taro.cloud.init({
    env: "cloud1-8gydyeo6bb9e2948",
  });

  // children 是将要会渲染的页面
  return children;
}

export default App;
