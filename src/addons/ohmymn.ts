import { Addon } from "const"
import lang from "lang"
import { cellViewType, IConfig } from "types/Addon"

const { label, help, option } = lang.addon.ohmymn

export const enum PanelPosition {
  Auto,
  Left,
  Center,
  Right
}

export const enum PanelHeight {
  Higher,
  Standard,
  Lower
}

const config: IConfig = {
  name: Addon.title,
  intro: `version: ${Addon.version} \nmade by ${Addon.author}`,
  link: Addon.link,
  settings: [
    {
      help: help.profile,
      key: "profile",
      type: cellViewType.select,
      option: Array(5)
        .fill(option.profile)
        .map((_, index) => _ + " " + (index + 1)),
      label: label.profile
    },
    {
      label: label.quick_switch,
      key: "quickSwitch",
      type: cellViewType.muiltSelect,
      option: []
    },
    {
      key: "panelPosition",
      type: cellViewType.select,
      option: option.panel_position,
      label: label.panel_position
    },
    {
      key: "panelHeight",
      type: cellViewType.select,
      option: option.panel_height,
      label: label.panel_height
    },
    {
      key: "doubleClick",
      type: cellViewType.switch,
      label: label.double_click
    },
    {
      key: "clickHidden",
      type: cellViewType.switch,
      label: label.click_hidden,
      help: help.click_hidden
    },
    {
      key: "screenAlwaysOn",
      type: cellViewType.switch,
      label: label.screen_always_on
    },
    {
      key: "lockExcerpt",
      type: cellViewType.switch,
      label: label.lock_excerpt
    },
    {
      help: help.auto_correct,
      key: "autoCorrect",
      type: cellViewType.switch,
      label: label.auto_correct
    }
  ],
  actions: []
}

const util = {}
const action = {}
export { config, util, action }
