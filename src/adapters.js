const getResponse = (res, config) => {
  const { statusCode, errMsg } = res;
  const response = Object.assign({}, res, {
    status: statusCode,
    statusText: errMsg,
    config,
    request: null,
  });

  return response;
};

const uniAdapter = (config) => {
  if (!uni) {
    throw new Error("please use this in uni-app project!");
  }
  return new Promise((resolve, reject) => {
    const { baseURL, url, headers, data, params } = config;
    const uniConfig = Object.assign({}, config, {
      url: (baseURL || '') + url,
      header:
        headers && typeof headers.toJSON === "function"
          ? headers.toJSON()
          : headers,
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
        const response = getResponse(res, config);
        resolve(response);
      },
      fail(res) {
        const response = getResponse(res, config);
        reject(response);
      },
    }));
  });
};

export default uniAdapter;
