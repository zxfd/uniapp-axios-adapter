import uniAdapter from "./src/adapters";

import axios from "axios";

export const UniAdapter = uniAdapter;

axios.defaults.adapter = uniAdapter;

export default axios;
