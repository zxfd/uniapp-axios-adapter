const getResponse = (res, config) => {
  const { statusCode, errMsg } = res;
  const response = {
    ...res,
    status: statusCode,
    statusText: errMsg,
    config,
    request: null,
  };

  return response;
};

const uniAdapter = (config) => {
  return new Promise((resolve, reject) => {
    const { baseURL, url, headers } = config;
    uni.request({
      ...config,
      url: baseURL + url,
      header: headers,
      success(res) {
        const response = getResponse(res);
        resolve(response, config);
      },
      fail(res) {
        const response = getResponse(res);
        reject(response, config);
      },
    });
  });
};

export default uniAdapter;
