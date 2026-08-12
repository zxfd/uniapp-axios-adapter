## uniapp-axios-adapter

用于`uni-app`的`axios`库以及使用到的`UniAdapter`适配器

利用 Axios 的`adapter`机制兼容 uni-app 网络 API：`UniAdapter`调用`uni.request`，`UniUploadAdapter`调用`uni.uploadFile`，`UniDownloadAdapter`调用`uni.downloadFile`。

项目源码很简单,感兴趣的可以前往`github`或者`gitee`查看

上传和下载必须显式选择对应适配器，避免根据请求方法或`responseType`错误推断文件操作。

## 安装

### 安装 uniapp-axios-adapter

推荐使用`pnpm`进行包管理。

```shell
  pnpm/npm i uniapp-axios-adapter
  # 或者 yarn add uniapp-axios-adapter
```

### 安装 axios

本包将`axios`声明为 peer dependency，需要在业务项目中自行安装。你可以安装符合项目要求的版本，构建产物不会重复打包`axios`。

适配器同时支持普通请求头对象，以及 Axios 1.x 使用的`AxiosHeaders`请求头。

```shell
  pnpm/npm i axios
  # 或者 yarn add axios
```

### 使用

我们按需导出了`UniAdapter`适配器,并且默认导出了使用了该适配器的`axios`,你可以自行使用适配器,也可以直接使用我们导出的 axios

### 自行使用适配器

普通请求指定`adapter: UniAdapter`，其余用法与 Axios 保持一致。

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
  url: 'example/api/test',
  method: 'get',
  params: {
    id: 123,
  }
})

http({
  url: 'example/api/test',
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
axios.get("https://example.com/api/getUserById", {
  params: {
    id: 1,
  },
});
```

## 上传文件

使用`UniUploadAdapter`时，通过`uniUpload`传入`uni.uploadFile`需要的文件参数。单文件上传必须设置`filePath`（H5 也可以设置`file`）和`name`：

```js
import axios, { UniUploadAdapter } from "uniapp-axios-adapter";

const controller = new AbortController();

const response = await axios.post("https://example.com/upload", undefined, {
  adapter: UniUploadAdapter,
  headers: {
    Authorization: "Bearer token",
  },
  uniUpload: {
    filePath: tempFilePaths[0],
    name: "file",
    formData: {
      userId: "123",
    },
  },
  signal: controller.signal,
  onUploadProgress({ loaded, total, progress }) {
    console.log("已上传", loaded, "总大小", total, "进度", progress);
  },
});

// 需要取消时调用：controller.abort();
// uni.uploadFile 原始 data 为字符串；之后仍会经过 Axios 的 transformResponse，
// 因此合法 JSON 默认会转换为对象。
console.log(response.data);
```

App、H5 可以使用`files`上传多个文件；`files`生效时`filePath`、`file`和`name`会被忽略：

```js
await axios.post("https://example.com/upload", undefined, {
  adapter: UniUploadAdapter,
  uniUpload: {
    files: [
      { name: "front", uri: frontFilePath },
      { name: "back", uri: backFilePath },
    ],
    formData: {
      userId: "123",
    },
  },
});
```

微信等只支持单文件上传的平台，需要循环调用单文件模式。适配器会移除 Axios 自动生成的`Content-Type`，由`uni.uploadFile`设置正确的`multipart/form-data` boundary。

## 下载文件

使用`UniDownloadAdapter`时，`response.data`保留 uni-app 的完整下载结果，以兼容各平台的`tempFilePath`、`apFilePath`、`filePath`和`fileContent`差异：

```js
import axios, { UniDownloadAdapter } from "uniapp-axios-adapter";

const response = await axios.get("https://example.com/archive.zip", {
  adapter: UniDownloadAdapter,
  uniDownload: {
    // 可选，仅在支持的平台指定下载后的本地路径
    filePath: "/storage/archive.zip",
  },
  onDownloadProgress({ loaded, total, progress }) {
    console.log("已下载", loaded, "总大小", total, "进度", progress);
  },
});

const localPath =
  response.data.filePath ||
  response.data.tempFilePath ||
  response.data.apFilePath;
```

临时文件路径通常只在当前应用启动期间有效；需要长期保存时，请按 uni-app 官方文档继续调用`uni.saveFile`。上传和下载都支持 Axios 的`AbortSignal`、旧版`CancelToken`、`timeout`、`baseURL`、请求头和`validateStatus`。

API 参数与平台差异以[uni.uploadFile / uni.downloadFile 官方文档](https://uniapp.dcloud.net.cn/api/request/network-file)为准。

## 更新日志

[点击查看](https://gitee.com/black-key/uniapp-axios-adapter/blob/main/CHANGELOG.md)

## TODO

- 压缩打包,减小体积
