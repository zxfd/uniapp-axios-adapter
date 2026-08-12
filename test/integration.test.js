import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import axios, {
  UniDownloadAdapter,
  UniUploadAdapter,
} from "../index.js";

const originalUni = globalThis.uni;

afterEach(() => {
  globalThis.uni = originalUni;
});

test("uses UniUploadAdapter through the public Axios export", async () => {
  let receivedOptions;
  globalThis.uni = {
    uploadFile(options) {
      receivedOptions = options;
      queueMicrotask(() =>
        options.success({ data: '{"id":1}', statusCode: 201 })
      );
      return { abort() {} };
    },
  };

  const response = await axios.post("https://api.test/files", undefined, {
    adapter: UniUploadAdapter,
    uniUpload: {
      filePath: "/tmp/photo.jpg",
      name: "avatar",
      formData: { userId: "1" },
    },
  });

  assert.equal(receivedOptions.filePath, "/tmp/photo.jpg");
  assert.equal(receivedOptions.name, "avatar");
  assert.deepEqual(response.data, { id: 1 });
  assert.equal(response.status, 201);
});

test("uses UniDownloadAdapter through the public Axios export", async () => {
  let receivedOptions;
  globalThis.uni = {
    downloadFile(options) {
      receivedOptions = options;
      queueMicrotask(() =>
        options.success({ tempFilePath: "/tmp/archive.zip", statusCode: 200 })
      );
      return { abort() {} };
    },
  };

  const response = await axios.get("https://api.test/archive.zip", {
    adapter: UniDownloadAdapter,
    uniDownload: { filePath: "/storage/archive.zip" },
  });

  assert.equal(receivedOptions.filePath, "/storage/archive.zip");
  assert.equal(response.data.tempFilePath, "/tmp/archive.zip");
  assert.equal(response.status, 200);
});
