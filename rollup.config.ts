import typescript from "@rollup/plugin-typescript"
import copy from "rollup-plugin-copy"
import zip from "rollup-plugin-zip"
import { uglify } from "rollup-plugin-uglify"
import strip from "@rollup/plugin-strip"
import banner from "rollup-plugin-banner"
import pkg from "./package.json"
// 判断是否为开发环境
const isProd = () => process.env.NODE_ENV === "production"

const _banner = `THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source code, please visit the github repository
https://github.com/ourongxing/ohmymn
version: <%= pkg.version %> by <%= pkg.author %>`

// 把用户名换一下就行，亲测无法使用 ～
const dir = isProd()
  ? "./dist"
  : "/Users/ourongxing/Library/Containers/QReader.MarginStudyMac/Data/Library/MarginNote Extensions/marginnote.extension.ohmymn"
export default {
  input: ["src/main.ts"],
  output: {
    dir,
    format: "iife",
    exports: "none",
    sourcemap: false
  },
  watch: {
    exclude: "../node_modules/**"
  },
  plugins: [
    typescript(),
    copy({
      targets: [
        {
          src: ["assets/logo.png", "mnaddon.json", "assets/icon"],
          dest: "dist"
        }
      ],
      copyOnce: true
    }),
    isProd() &&
      strip({
        include: ["**/*.ts"],
        functions: ["log"]
      }),
    isProd() && uglify(),
    isProd() && banner(_banner),
    isProd() &&
      zip({
        file: `ohmymn_v${pkg.version}.mnaddon`
      })
  ]
}
