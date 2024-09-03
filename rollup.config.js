import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  treeshake: false,
  input: "out-tsc/src/adaptation.js",
  output: {
    dir: "dist",
  },
  plugins: [nodeResolve()],
};
