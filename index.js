import uniAdapter from "./src/adapters";
import uniUploadAdapter from "./src/upload";

import axios from "axios";

export const UniAdapter = uniAdapter;
export const UniUploadAdapter = uniUploadAdapter;

axios.defaults.adapter = uniAdapter;

export default axios;
