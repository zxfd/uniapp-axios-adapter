export default {
  input: "./index.js",
  external: ["axios"],
  output: [
    {
      file: "lib/index.cjs",
      format: "cjs",
      exports: "named",
    },
    {
      file: "lib/index.mjs",
      format: "es",
    },
  ],
};
