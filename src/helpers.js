export const assertUniAvailable = () => {
  if (typeof uni === "undefined") {
    throw new Error("please use this in uni-app project!");
  }
};

const isAbsoluteURL = (url) =>
  /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);

const combineURLs = (baseURL, relativeURL) =>
  relativeURL
    ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
    : baseURL;

export const buildFullPath = (baseURL, url, allowAbsoluteUrls) => {
  if (baseURL && (!isAbsoluteURL(url) || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, url);
  }

  return url;
};

export const normalizeHeaders = (headers) =>
  headers && typeof headers.toJSON === "function" ? headers.toJSON() : headers;

export const createResponse = (res, config, request, data) => {
  const statusCode = Number(res.statusCode);

  return Object.assign({}, res, {
    data: data === undefined ? res.data : data,
    status: Number.isNaN(statusCode) ? 0 : statusCode,
    statusText: res.errMsg || "",
    headers: res.header || res.headers || {},
    config,
    request: request || null,
  });
};
