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

const getUploadHeaders = (headers) => {
  const normalized = Object.assign({}, normalizeHeaders(headers));

  Object.keys(normalized).forEach((key) => {
    if (key.toLowerCase() === "content-type") {
      delete normalized[key];
    }
  });

  return normalized;
};

const getUploadOptions = (config) => {
  const upload = config.uniUpload || {};
  const hasFiles = Array.isArray(upload.files) && upload.files.length > 0;
  const hasSingleFile = Boolean(upload.filePath || upload.file);

  if (!hasFiles && !hasSingleFile) {
    throw new TypeError("uniUpload.filePath, uniUpload.file or uniUpload.files is required");
  }
  if (!hasFiles && !upload.name) {
    throw new TypeError("uniUpload.name is required for single-file uploads");
  }

  const options = {
    url: buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls),
    header: getUploadHeaders(config.headers),
    timeout: config.timeout,
    formData: upload.formData,
    fileType: upload.fileType,
    success: null,
    fail: null,
  };

  if (hasFiles) {
    options.files = upload.files;
  } else {
    options.filePath = upload.filePath;
    options.file = upload.file;
    options.name = upload.name;
  }

  return options;
};

const uniUploadAdapter = (config) => {
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
      const options = getUploadOptions(config);

      options.success = (res) => {
        const response = createResponse(res, config, task);
        done(() => settle(resolve, reject, response));
      };
      options.fail = (res) => {
        const response = createResponse(res, config, task);
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

      task = uni.uploadFile(options);

      if (config.onUploadProgress && task && task.onProgressUpdate) {
        let previousLoaded = 0;
        task.onProgressUpdate((progress) => {
          const event = toAxiosProgressEvent(progress, "upload", previousLoaded);
          previousLoaded = event.loaded;
          config.onUploadProgress(event);
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

export default uniUploadAdapter;
