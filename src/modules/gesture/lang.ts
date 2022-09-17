import { MN } from "~/sdk"

const zh = {
  intro: "自定义手势触发动作",
  singleBar: "卡片单选工具栏",
  muiltBar: "卡片多选工具栏",
  selectionBar: "文本选择工具栏"
}

const en: typeof zh = {
  intro: "Custom Gestures to Trigger Actions",
  singleBar: "Single Select Toolbar",
  muiltBar: "Multi Select Toolbar",
  selectionBar: "Text Select Toolbar"
}

export const lang = MN.isZH ? zh : en
