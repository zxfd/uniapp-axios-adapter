import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import uniAdapter from "../src/adapters.js";

const originalUni = globalThis.uni;

afterEach(() => {
  globalThis.uni = originalUni;
});

const requestWithConfig = async (requestConfig) => {
  let receivedConfig;

  globalThis.uni = {
    request(config) {
      receivedConfig = config;
      config.success({ statusCode: 200, errMsg: "request:ok" });
    },
  };

  await uniAdapter(requestConfig);

  return receivedConfig;
};

const requestWithHeaders = (headers) =>
  requestWithConfig({ url: "/users", headers });

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

test("preserves request and response fields without object spread", async () => {
  let receivedConfig;
  const requestConfig = { url: "/users", timeout: 1_000 };

  globalThis.uni = {
    request(config) {
      receivedConfig = config;
      config.success({
        data: { id: 1 },
        statusCode: 201,
        errMsg: "request:ok",
      });
    },
  };

  const response = await uniAdapter(requestConfig);

  assert.equal(receivedConfig.timeout, 1_000);
  assert.deepEqual(response.data, { id: 1 });
  assert.equal(response.status, 201);
  assert.equal(response.statusText, "request:ok");
  assert.equal(response.config, requestConfig);
});

test("builds request URLs with Axios-compatible baseURL semantics", async (t) => {
  const cases = [
    {
      name: "keeps an HTTP absolute URL",
      config: {
        baseURL: "https://configured.test/api",
        url: "http://api.test.com/wx/login",
      },
      expected: "http://api.test.com/wx/login",
    },
    {
      name: "keeps an HTTPS absolute URL",
      config: {
        baseURL: "https://configured.test/api",
        url: "https://api.test.com/wx/login",
      },
      expected: "https://api.test.com/wx/login",
    },
    {
      name: "keeps a protocol-relative URL",
      config: {
        baseURL: "https://configured.test/api",
        url: "//api.test.com/wx/login",
      },
      expected: "//api.test.com/wx/login",
    },
    {
      name: "combines a relative URL with one slash",
      config: {
        baseURL: "https://configured.test/api/",
        url: "/wx/login",
      },
      expected: "https://configured.test/api/wx/login",
    },
    {
      name: "combines a relative URL without surrounding slashes",
      config: {
        baseURL: "https://configured.test/api",
        url: "wx/login",
      },
      expected: "https://configured.test/api/wx/login",
    },
    {
      name: "keeps a relative URL when baseURL is absent",
      config: { url: "/wx/login" },
      expected: "/wx/login",
    },
    {
      name: "combines an absolute URL when allowAbsoluteUrls is false",
      config: {
        baseURL: "https://configured.test/api",
        url: "https://api.test.com/wx/login",
        allowAbsoluteUrls: false,
      },
      expected: "https://configured.test/api/https://api.test.com/wx/login",
    },
  ];

  for (const { name, config, expected } of cases) {
    await t.test(name, async () => {
      const receivedConfig = await requestWithConfig(config);

      assert.equal(receivedConfig.url, expected);
    });
  }
});
