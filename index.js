import uniAdapter from "./src/adapters";
import uniUploadAdapter from "./src/upload";
import uniDownloadAdapter from "./src/download";

import axios from "axios";

export const UniAdapter = uniAdapter;
export const UniUploadAdapter = uniUploadAdapter;
export const UniDownloadAdapter = uniDownloadAdapter;

axios.defaults.adapter = uniAdapter;

export default axios;
