import {
  assertUniAvailable,
  buildFullPath,
  createResponse,
  normalizeHeaders,
} from "./helpers.js";

const uniAdapter = (config) => {
  assertUniAvailable();

  return new Promise((resolve, reject) => {
    const { baseURL, url, headers, data, params, allowAbsoluteUrls } = config;
    const uniConfig = Object.assign({}, config, {
      url: buildFullPath(baseURL, url, allowAbsoluteUrls),
      header: normalizeHeaders(headers),
    });

    if (data || params) {
      try {
        uniConfig.data = JSON.parse(data || params);
      } catch (e) {
        uniConfig.data = data || params;
      }
    }
    uni.request(Object.assign({}, uniConfig, {
      success(res) {
        const response = createResponse(res, config);
        resolve(response);
      },
      fail(res) {
        const response = createResponse(res, config);
        reject(response);
      },
    }));
  });
};

export default uniAdapter;
