## uniapp-axios-adapter

用于`uni-app`的`axios`库以及使用到的`UniAdapter`适配器

利用`axios`的`adapter`适配器来兼容了小程序的请求 api。添加本适配器或者使用本包导出的`axios`后,`axios`底层将使用`uni.request`发起请求

项目源码很简单,感兴趣的可以前往`github`或者`gitee`查看

## 安装

### 安装 uniapp-axios-adapter

推荐使用`pnpm`进行包管理。

```shell
  pnpm/npm i uniapp-axios-adapter
  # 或者 yarn add uniapp-axios-adapter
```

### 安装 axios

我们在包里添加了最新版本的`axios`作为依赖,如果你不想使用最新版本的`axios`,可以自行安装指定版本的`axios`配合我们的`UniAdapter`来使用,`tree-shaking`不会将本包依赖的`axios`打包进生产环境中

`axios v1.0+`尚不稳定,推荐安装`0.27.2`版本

```shell
  pnpm/npm i axios@0.27.2
  # 或者 yarn add axios@0.27.2
```

### 使用

我们按需导出了`UniAdapter`适配器,并且默认导出了使用了该适配器的`axios`,你可以自行使用适配器,也可以直接使用我们导出的 axios

### 自行使用适配器

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
  // 统一处理响应,返回Promise以便链式调用
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

### 使用开箱即用的 axios

#### 添加拦截器的方式

```js
// http.js中
import axios from "uniapp-axios-adapter";
const request = axios.create({
  baseURL: "https://example.com",
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  //带上token
  config.headers["Authorization"] = "token";
  return config;
});

request.interceptors.response.use((response) => {
  // 统一处理响应,返回Promise以便链式调用
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

#### 直接使用

```js
// 业务代码中
import axios from "uniapp-axios-adapter";
axios.get({
  url: "https://example.com/api/getUserById",
  params: {
    id: 1,
  },
});
```

## 更新日志

[点击查看](https://gitee.com/black-key/uniapp-axios-adapter/blob/main/CHANGELOG.md)

## TODO

- 压缩打包,减小体积
- 适配`uni.downloadFile`和`uni.uploadFile`
