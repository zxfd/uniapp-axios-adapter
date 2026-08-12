import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import axios from "axios";

import uniDownloadAdapter from "../src/download.js";

const originalUni = globalThis.uni;

afterEach(() => {
  globalThis.uni = originalUni;
});

const createDownloadMock = (
  result = { tempFilePath: "/tmp/file.zip", statusCode: 200 }
) => {
  let options;
  let progressCallback;
  let abortCount = 0;
  const task = {
    abort() {
      abortCount += 1;
    },
    onProgressUpdate(callback) {
      progressCallback = callback;
    },
  };

  globalThis.uni = {
    downloadFile(receivedOptions) {
      options = receivedOptions;
      queueMicrotask(() => receivedOptions.success(result));
      return task;
    },
  };

  return {
    getAbortCount: () => abortCount,
    getOptions: () => options,
    progress: (value) => progressCallback(value),
    task,
  };
};

test("maps download options to uni.downloadFile and preserves platform fields", async () => {
  const result = {
    tempFilePath: "/tmp/archive.zip",
    apFilePath: "/tmp/alipay-archive.zip",
    filePath: "/storage/archive.zip",
    fileContent: new Uint8Array([1, 2]),
    statusCode: "200",
  };
  const mock = createDownloadMock(result);
  const config = {
    baseURL: "https://api.test/v1/",
    url: "/archive",
    headers: { Authorization: "Bearer token" },
    timeout: 8_000,
    uniDownload: { filePath: "/storage/archive.zip" },
  };

  const response = await uniDownloadAdapter(config);
  const options = mock.getOptions();

  assert.equal(options.url, "https://api.test/v1/archive");
  assert.deepEqual(options.header, { Authorization: "Bearer token" });
  assert.equal(options.timeout, 8_000);
  assert.equal(options.filePath, "/storage/archive.zip");
  assert.equal(response.data, result);
  assert.equal(response.status, 200);
  assert.equal(response.request, mock.task);
});

test("reports download progress with Axios event fields", async () => {
  let options;
  let progressCallback;
  globalThis.uni = {
    downloadFile(receivedOptions) {
      options = receivedOptions;
      return {
        abort() {},
        onProgressUpdate(callback) {
          progressCallback = callback;
        },
      };
    },
  };

  const events = [];
  const request = uniDownloadAdapter({
    url: "https://api.test/archive",
    onDownloadProgress: (event) => events.push(event),
  });

  progressCallback({
    progress: 20,
    totalBytesWritten: 20,
    totalBytesExpectedToWrite: 100,
  });
  progressCallback({
    progress: 60,
    totalBytesWritten: 60,
    totalBytesExpectedToWrite: 100,
  });
  options.success({ tempFilePath: "/tmp/archive.zip", statusCode: 200 });
  await request;

  assert.deepEqual(events, [
    {
      loaded: 20,
      total: 100,
      progress: 0.2,
      bytes: 20,
      upload: undefined,
      download: true,
    },
    {
      loaded: 60,
      total: 100,
      progress: 0.6,
      bytes: 40,
      upload: undefined,
      download: true,
    },
  ]);
});

test("aborts a download through AbortSignal", async () => {
  let options;
  let abortCount = 0;
  globalThis.uni = {
    downloadFile(receivedOptions) {
      options = receivedOptions;
      return {
        abort() {
          abortCount += 1;
          queueMicrotask(() => options.fail({ errMsg: "downloadFile:fail abort" }));
        },
      };
    },
  };
  const controller = new AbortController();
  const request = uniDownloadAdapter({
    url: "https://api.test/archive",
    signal: controller.signal,
  });

  controller.abort();

  await assert.rejects(request, (error) => {
    assert.equal(error.code, "ERR_CANCELED");
    assert.equal(error.__CANCEL__, true);
    return true;
  });
  assert.equal(abortCount, 1);
});

test("aborts a download through Axios CancelToken", async () => {
  let abortCount = 0;
  globalThis.uni = {
    downloadFile() {
      return {
        abort() {
          abortCount += 1;
        },
      };
    },
  };
  const source = axios.CancelToken.source();
  const request = uniDownloadAdapter({
    url: "https://api.test/archive",
    cancelToken: source.token,
  });

  source.cancel("stop download");

  await assert.rejects(request, (error) => axios.isCancel(error));
  assert.equal(abortCount, 1);
});

test("applies Axios validateStatus to download responses", async () => {
  createDownloadMock({ tempFilePath: "/tmp/error.txt", statusCode: 503 });

  await assert.rejects(
    uniDownloadAdapter({
      url: "https://api.test/archive",
      validateStatus: (status) => status >= 200 && status < 300,
    }),
    (error) => {
      assert.equal(error.code, "ERR_BAD_RESPONSE");
      assert.equal(error.response.status, 503);
      assert.equal(error.response.data.tempFilePath, "/tmp/error.txt");
      return true;
    }
  );
});

test("rejects uni.downloadFile failures as Axios-compatible network errors", async () => {
  globalThis.uni = {
    downloadFile(options) {
      queueMicrotask(() => options.fail({ errMsg: "downloadFile:fail timeout" }));
      return { abort() {} };
    },
  };

  await assert.rejects(
    uniDownloadAdapter({ url: "https://api.test/archive" }),
    (error) => {
      assert.equal(error.name, "AxiosError");
      assert.equal(error.code, "ERR_NETWORK");
      assert.equal(error.message, "downloadFile:fail timeout");
      return true;
    }
  );
});
