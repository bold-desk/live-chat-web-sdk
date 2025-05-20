import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

const bundle = config => ({
  ...config,
  input: "src/live-chat.ts",
  external: id => !/^[./]/.test(id),
})

export default [
  bundle({
    plugins: [typescript()],
    output: [
      {
        file: "dist/live-chat-web-sdk.umd.js",
        format: "umd",
        name: "live-chat-web-sdk",
        sourcemap: true,
      },
      {
        file: "dist/live-chat-web-sdk.esm.js",
        format: "esm",
        sourcemap: true,
      }
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: "dist/live-chat-web-sdk.d.ts",
      format: "es",
    },
  }),
]
