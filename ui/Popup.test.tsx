// @vitest-environment happy-dom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ChannelRule } from "../core/channel-rule"
import { InMemoryRulesRepository } from "../core/rules-repository"
import { InMemorySettingsRepository } from "../core/settings-repository"
import { Popup } from "./Popup"

function rule(channelKey: string, channelName: string): ChannelRule {
  return { channelKey, channelName, mode: "hide" }
}

async function renderPopup(rules: ChannelRule[] = [], enabled = true) {
  const rulesRepository = new InMemoryRulesRepository(rules)
  const settingsRepository = new InMemorySettingsRepository(enabled)
  render(<Popup rules={rulesRepository} settings={settingsRepository} />)
  await screen.findByRole("heading", { name: "Hushfeed" })
  return { rules: rulesRepository, settings: settingsRepository }
}

function channelNames(): string[] {
  return screen
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".channel-name")?.textContent ?? "")
}

describe("Popup", () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("explains how to hide a channel when none is hidden", async () => {
    await renderPopup()

    expect(screen.getByText(/No hidden channels yet/)).toBeTruthy()
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("counts and lists all hidden channels by name, sorted", async () => {
    await renderPopup([
      rule("@b", "beta"),
      rule("UC1", "Alpha"),
      rule("@c", "Gamma")
    ])

    expect(
      screen.getByRole("heading", { name: "3 channels hidden" })
    ).toBeTruthy()
    expect(channelNames()).toEqual(["Alpha", "beta", "Gamma"])
  })

  it("uses the singular for one channel", async () => {
    await renderPopup([rule("@a", "Alpha")])

    expect(
      screen.getByRole("heading", { name: "1 channel hidden" })
    ).toBeTruthy()
  })

  it("shows a channel again", async () => {
    const { rules } = await renderPopup([
      rule("@a", "Alpha"),
      rule("@b", "Beta")
    ])

    fireEvent.click(screen.getByRole("button", { name: "Show Alpha" }))

    expect(await rules.getRules()).toEqual([rule("@b", "Beta")])
    await screen.findByRole("heading", { name: "1 channel hidden" })
    expect(channelNames()).toEqual(["Beta"])
  })

  it("shows whether filtering is on and toggles it", async () => {
    const { settings } = await renderPopup()
    const toggle = screen.getByRole("switch") as HTMLInputElement
    expect(toggle.checked).toBe(true)
    expect(screen.getByText("Filtering on")).toBeTruthy()

    fireEvent.click(toggle)

    expect(await settings.isEnabled()).toBe(false)
    await screen.findByText("Filtering off")
    expect(toggle.checked).toBe(false)
  })

  it("starts with filtering off when it was turned off", async () => {
    await renderPopup([], false)

    expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(false)
  })

  it("follows changes made elsewhere, e.g. hiding from the feed", async () => {
    const { rules } = await renderPopup()

    await act(() => rules.saveRule(rule("@a", "Alpha")))

    const list = await screen.findByRole("list")
    expect(within(list).getByText("Alpha")).toBeTruthy()
  })

  it("keeps working when storage fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const { rules } = await renderPopup([rule("@a", "Alpha")])
    vi.spyOn(rules, "deleteRule").mockRejectedValueOnce(new Error("quota"))

    fireEvent.click(screen.getByRole("button", { name: "Show Alpha" }))
    await act(() => Promise.resolve())

    expect(error).toHaveBeenCalled()
    expect(channelNames()).toEqual(["Alpha"])
  })
})
