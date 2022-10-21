## uniapp-axios-adapter

用于`uni-app`的`axios`库的`adapter`适配器

利用`axios`的`adapter`适配器来兼容了小程序的请求 api。添加本适配器后,`axios`底层将使用`uni.request`发起请求

项目源码很简单,感兴趣的可以自行查看

## 安装

### 安装 uniapp-axios-adapter

推荐使用`pnpm`进行包管理。

```shell
  pnpm/npm i uniapp-axios-adapter
  # 或者 yarn add uniapp-axios-adapter
```

### 安装 axios

由于本插件只是`axios`的一个适配器,所以我们还需要安装 `axios`

`axios v1.0+`尚不稳定,推荐安装`0.27.2`版本

```shell
  pnpm/npm i axios@0.27.2
  # 或者 yarn add axios@0.27.2
```

### 使用

指定`axios`的适配器`adapter`为本适配器即可,其余用法与`axios`保持一致

```js
import axios from "axios";
import { UniAdapter } from "uniapp-axios-adapter";

// 每次请求都创建一个新的实例
const request = axios.create({
  baseURL: "https://example.com",
  timeout: 10000,
  adapter: UniAdapter, // 指定适配器
});
```

#### 示例 1 设置请求拦截器与响应拦截器

```js
// src/utils/http.js 中
import axios from "axios";
import { UniAdapter } from "uniapp-axios-adapter";

const request = axios.create({
  baseURL: "https://example.com",
  timeout: 10000,
  adapter: UniAdapter,
});

request.interceptors.request.use((config) => {
  //带上token
  config.headers["Authorization"] = "token";
  return config;
});

request.interceptors.response.use((response) => {
  // 统一处理响应
  if (response.status === 200) {
    const { data } = response;
    if (data && data.code === 200) {
      return Promise.resolve(data);
    } else {
      return Promise.reject(data);
    }
  } else {
    return Promise.reject(response);
  }
});

export default request;
```

```js
// 具体业务代码文件中
import http from 'src/utils/http.js' // 上一步封装axios的路径中

http({
  url: 'example/api/test'
  method: 'get',
  params: {
    id: 123,
  }
})

http({
  url: 'example/api/test'
  method: 'post',
  data: {
    id: 123,
  }
})

```

## 更新日志

[点击查看]('https://gitee.com/black-key/uniapp-axios-adapter/blob/main/CHANGELOG.md')
