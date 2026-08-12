import {
  assertUniAvailable,
  buildFullPath,
  createResponse,
  normalizeHeaders,
} from "./helpers.js";
import {
  bindCancellation,
  createAdapterError,
  settle,
  throwIfCancellationRequested,
  toAxiosProgressEvent,
} from "./task.js";

const getDownloadOptions = (config) => {
  const download = config.uniDownload || {};

  return {
    url: buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls),
    header: normalizeHeaders(config.headers),
    timeout: config.timeout,
    filePath: download.filePath,
    success: null,
    fail: null,
  };
};

const uniDownloadAdapter = (config) => {
  assertUniAvailable();

  return new Promise((resolve, reject) => {
    let task;
    let settled = false;
    let cleanup = () => {};

    const done = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };

    try {
      throwIfCancellationRequested(config);
      const options = getDownloadOptions(config);

      options.success = (res) => {
        const response = createResponse(res, config, task, res);
        done(() => settle(resolve, reject, response));
      };
      options.fail = (res) => {
        const response = createResponse(res, config, task, res);
        done(() =>
          reject(
            createAdapterError(
              res.errMsg || "Network Error",
              "ERR_NETWORK",
              config,
              task,
              response
            )
          )
        );
      };

      task = uni.downloadFile(options);

      if (config.onDownloadProgress && task && task.onProgressUpdate) {
        let previousLoaded = 0;
        task.onProgressUpdate((progress) => {
          const event = toAxiosProgressEvent(progress, "download", previousLoaded);
          previousLoaded = event.loaded;
          config.onDownloadProgress(event);
        });
      }

      cleanup = bindCancellation(config, task, (reason) => {
        done(() => {
          if (task && task.abort) {
            task.abort();
          }
          reject(reason);
        });
      });
    } catch (error) {
      done(() => reject(error));
    }
  });
};

export default uniDownloadAdapter;
