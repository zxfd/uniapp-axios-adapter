import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import uniAdapter from "../src/adapters.js";

const originalUni = globalThis.uni;

afterEach(() => {
  globalThis.uni = originalUni;
});

const requestWithHeaders = async (headers) => {
  let receivedConfig;

  globalThis.uni = {
    request(config) {
      receivedConfig = config;
      config.success({ statusCode: 200, errMsg: "request:ok" });
    },
  };

  await uniAdapter({ url: "/users", headers });

  return receivedConfig;
};

test("converts AxiosHeaders-compatible headers to a plain object", async () => {
  const plainHeaders = { Authorization: "Bearer token" };
  const headers = {
    toJSON() {
      assert.equal(this, headers);
      return plainHeaders;
    },
  };

  const config = await requestWithHeaders(headers);

  assert.equal(config.header, plainHeaders);
});

test("keeps plain headers unchanged", async () => {
  const headers = { Authorization: "Bearer token" };

  const config = await requestWithHeaders(headers);

  assert.equal(config.header, headers);
});

test("does not call a non-function toJSON property", async () => {
  const headers = { Authorization: "Bearer token", toJSON: true };

  const config = await requestWithHeaders(headers);

  assert.equal(config.header, headers);
});

test("supports requests without headers", async () => {
  const config = await requestWithHeaders(undefined);

  assert.equal(config.header, undefined);
});
