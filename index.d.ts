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

declare module "axios" {
  interface AxiosRequestConfig {
    /** UniUploadAdapter 使用的 uni.uploadFile 参数。 */
    uniUpload?: UniUploadOptions;
  }
}

export declare function UniAdapter(config: AxiosRequestConfig): AxiosPromise;

export declare function UniUploadAdapter(
  config: AxiosRequestConfig
): AxiosPromise<string>;


declare const axios: AxiosStatic;

export default axios;
