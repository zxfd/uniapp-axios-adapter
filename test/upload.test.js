import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import axios from "axios";

import uniUploadAdapter from "../src/upload.js";

const originalUni = globalThis.uni;

afterEach(() => {
  globalThis.uni = originalUni;
});

const createUploadMock = (result = { data: "ok", statusCode: 200 }) => {
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
    uploadFile(receivedOptions) {
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

test("maps single-file upload options to uni.uploadFile", async () => {
  const mock = createUploadMock({ data: '{"id":1}', statusCode: "201" });
  const config = {
    baseURL: "https://api.test/v1/",
    url: "/files",
    headers: {
      Authorization: "Bearer token",
      "Content-Type": "application/json",
    },
    timeout: 5_000,
    uniUpload: {
      filePath: "/tmp/photo.jpg",
      name: "avatar",
      fileType: "image",
      formData: { userId: "1" },
    },
  };

  const response = await uniUploadAdapter(config);
  const options = mock.getOptions();

  assert.equal(options.url, "https://api.test/v1/files");
  assert.deepEqual(options.header, { Authorization: "Bearer token" });
  assert.equal(options.timeout, 5_000);
  assert.equal(options.filePath, "/tmp/photo.jpg");
  assert.equal(options.name, "avatar");
  assert.equal(options.fileType, "image");
  assert.deepEqual(options.formData, { userId: "1" });
  assert.equal(response.data, '{"id":1}');
  assert.equal(response.status, 201);
  assert.equal(response.request, mock.task);
});

test("maps multi-file uploads without single-file fields", async () => {
  const mock = createUploadMock();
  const files = [
    { name: "front", uri: "/tmp/front.jpg" },
    { name: "back", uri: "/tmp/back.jpg" },
  ];

  await uniUploadAdapter({
    url: "https://api.test/files",
    uniUpload: { files, name: "ignored", filePath: "/tmp/ignored.jpg" },
  });

  const options = mock.getOptions();
  assert.equal(options.files, files);
  assert.equal(options.filePath, undefined);
  assert.equal(options.name, undefined);
});

test("reports upload progress with Axios event fields", async () => {
  let releaseUpload;
  let options;
  let progressCallback;
  globalThis.uni = {
    uploadFile(receivedOptions) {
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
  const request = uniUploadAdapter({
    url: "https://api.test/files",
    uniUpload: { filePath: "/tmp/photo.jpg", name: "file" },
    onUploadProgress: (event) => events.push(event),
  });

  progressCallback({
    progress: 25,
    totalBytesSent: 25,
    totalBytesExpectedToSend: 100,
  });
  progressCallback({
    progress: 50,
    totalBytesSent: 50,
    totalBytesExpectedToSend: 100,
  });
  releaseUpload = () => options.success({ data: "ok", statusCode: 200 });
  releaseUpload();
  await request;

  assert.deepEqual(events, [
    {
      loaded: 25,
      total: 100,
      progress: 0.25,
      bytes: 25,
      upload: true,
      download: undefined,
    },
    {
      loaded: 50,
      total: 100,
      progress: 0.5,
      bytes: 25,
      upload: true,
      download: undefined,
    },
  ]);
});

test("aborts an upload through AbortSignal", async () => {
  let options;
  let abortCount = 0;
  globalThis.uni = {
    uploadFile(receivedOptions) {
      options = receivedOptions;
      return {
        abort() {
          abortCount += 1;
          queueMicrotask(() => options.fail({ errMsg: "uploadFile:fail abort" }));
        },
      };
    },
  };
  const controller = new AbortController();
  const request = uniUploadAdapter({
    url: "https://api.test/files",
    signal: controller.signal,
    uniUpload: { filePath: "/tmp/photo.jpg", name: "file" },
  });

  controller.abort();

  await assert.rejects(request, (error) => {
    assert.equal(error.code, "ERR_CANCELED");
    assert.equal(error.__CANCEL__, true);
    return true;
  });
  assert.equal(abortCount, 1);
});

test("aborts an upload through Axios CancelToken", async () => {
  let abortCount = 0;
  globalThis.uni = {
    uploadFile() {
      return {
        abort() {
          abortCount += 1;
        },
      };
    },
  };
  const source = axios.CancelToken.source();
  const request = uniUploadAdapter({
    url: "https://api.test/files",
    cancelToken: source.token,
    uniUpload: { filePath: "/tmp/photo.jpg", name: "file" },
  });

  source.cancel("stop upload");

  await assert.rejects(request, (error) => axios.isCancel(error));
  assert.equal(abortCount, 1);
});

test("rejects invalid upload configuration before calling uni.uploadFile", async () => {
  let called = false;
  globalThis.uni = {
    uploadFile() {
      called = true;
    },
  };

  await assert.rejects(
    uniUploadAdapter({ url: "https://api.test/files", uniUpload: {} }),
    /filePath.*file.*files is required/
  );
  assert.equal(called, false);
});

test("applies Axios validateStatus to upload responses", async () => {
  createUploadMock({ data: "not found", statusCode: 404 });

  await assert.rejects(
    uniUploadAdapter({
      url: "https://api.test/files",
      validateStatus: (status) => status >= 200 && status < 300,
      uniUpload: { filePath: "/tmp/photo.jpg", name: "file" },
    }),
    (error) => {
      assert.equal(error.code, "ERR_BAD_REQUEST");
      assert.equal(error.response.status, 404);
      return true;
    }
  );
});
