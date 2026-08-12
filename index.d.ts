import type { AxiosStatic, AxiosPromise, AxiosRequestConfig } from "axios";

export interface UniUploadFile {
  /** multipart 表单字段名，默认值由 uni-app 决定。 */
  name?: string;
  /** H5 平台支持的 File 对象。 */
  file?: unknown;
  /** 文件的本地地址。 */
  uri: string;
}

export interface UniUploadOptions {
  /** App、H5 支持的多文件列表；设置后 file、filePath、name 不生效。 */
  files?: UniUploadFile[];
  /** H5 平台支持的 File 对象。 */
  file?: unknown;
  /** 单文件上传使用的本地资源路径。 */
  filePath?: string;
  /** 单文件上传的 multipart 字段名。 */
  name?: string;
  /** 支付宝小程序要求的文件类型。 */
  fileType?: "image" | "video" | "audio";
  /** 随文件一起提交的其他表单字段。 */
  formData?: Record<string, unknown>;
}

export interface UniDownloadOptions {
  /** 支持该字段的平台用于指定下载后的本地存储路径。 */
  filePath?: string;
}

export interface UniDownloadResult {
  /** 微信等小程序平台返回的临时文件路径。 */
  tempFilePath?: string;
  /** 支付宝小程序返回的本地临时文件路径。 */
  apFilePath?: string;
  /** 指定 filePath 后部分平台返回的用户文件路径。 */
  filePath?: string;
  /** QQ 小程序可能直接返回的文件内容。 */
  fileContent?: unknown;
  /** 开发者服务器返回的 HTTP 状态码。 */
  statusCode?: number | string;
  /** uni-app 平台可能附带的结果消息。 */
  errMsg?: string;
}

declare module "axios" {
  interface AxiosRequestConfig {
    /** UniUploadAdapter 使用的 uni.uploadFile 参数。 */
    uniUpload?: UniUploadOptions;
    /** UniDownloadAdapter 使用的 uni.downloadFile 参数。 */
    uniDownload?: UniDownloadOptions;
  }
}

export declare function UniAdapter(config: AxiosRequestConfig): AxiosPromise;

export declare function UniUploadAdapter(
  config: AxiosRequestConfig
): AxiosPromise<string>;

export declare function UniDownloadAdapter(
  config: AxiosRequestConfig
): AxiosPromise<UniDownloadResult>;


declare const axios: AxiosStatic;

export default axios;
