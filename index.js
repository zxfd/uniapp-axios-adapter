import uniAdapter from "./src/adapters.js";
import uniUploadAdapter from "./src/upload.js";
import uniDownloadAdapter from "./src/download.js";

import axios from "axios";

export const UniAdapter = uniAdapter;
export const UniUploadAdapter = uniUploadAdapter;
export const UniDownloadAdapter = uniDownloadAdapter;

axios.defaults.adapter = uniAdapter;

export default axios;
